// ============================================================
// ФОРТОРИУМ v5.1 — Движок ВЛОЖЕННЫХ ЛУПОВ (луп над лупом)
//
// Мета-луп = НАДЗИРАТЕЛЬ. Сам он текст не пишет.
// Его виток — это цикл управления над дочерними циклами:
//
//   ПЛАН       — мета-планировщик разбивает глобальную цель на K подцелей
//                (по одной на дочерний луп; при провале ребёнка — переформулирует подцель)
//   ДЕЙСТВИЕ   — каждый незавершённый дочерний луп делает ОДИН свой виток
//                (у ребёнка свой план, исполнитель, валидатор и критик — полный цикл)
//   НАБЛЮДЕНИЕ — агрегация: баллы, статусы, долги и лучшие черновики всех детей
//   КОРРЕКЦИЯ  — мета-критик оценивает сборку и решает: продолжать,
//                перезапустить слабого ребёнка с уточнённой подцелью или собрать финал
//
// Круги ответственности (из видео):
//   Внутренний круг (ИИ)     — дочерние лупы крутятся автономно (autoMode=true),
//                              их "внешний круг" — это мета-луп, а не человек.
//   Внешний круг (человек)   — ворота одобрения на уровне мета-лупа:
//                              после каждого мета-витка человек видит сборку
//                              и решает: продолжить / остановить.
//
// Стоп-критерии мета-лупа (условие №1):
//   1. Все дети завершены + сборка ≥ metaQualityThreshold  → done
//   2. Лимит мета-витков исчерпан                          → limit_reached
//   3. Общий бюджет токенов (дети + мета) исчерпан         → budget_exceeded
//
// Файловая память: мета-состояние в meta-state.json, витки в meta-iteration-N.json,
// дети живут собственными run-каталогами (<metaRunId>-c0, -c1, ...).
// ============================================================

import {
  MetaState, MetaTask, MetaPlan, MetaChildSnapshot, MetaIterationRecord,
  ChildLoopSlot, LoopState, LoopTask, Critique, DebtReport, ArtifactType,
  ARTIFACT_LABELS, ARTIFACT_INSTRUCTIONS,
} from './types';
import { writeMemoryFile, readMemoryFile, initRun, deleteRun } from './file-memory';
import { createInitialState, runLoopStep, humanDecision, llmCall, extractJson } from './loop-engine';
import { estimateTokens, EMPTY_DEBTS } from './debts';

// ---------- Создание состояния мета-лупа ----------

export function createMetaState(metaRunId: string, task: MetaTask): MetaState {
  return {
    metaRunId,
    task,
    children: [],
    metaIteration: 0,
    status: 'ready',
    stopReason: null,
    assembly: null,
    bestAssembly: null,
    bestAssemblyScore: 0,
    debts: { ...EMPTY_DEBTS },
    history: [],
    created: Date.now(),
    updated: Date.now(),
  };
}

// ---------- Шаблоны подцелей (фоллбэк без LLM) ----------

const SUBGOAL_TEMPLATES: Record<ArtifactType, string[]> = {
  logline: [
    'Ядро идеи: герой, мир и интригующая завязка',
    'Конфликт и ставки: что герой может потерять',
    'Эмоциональный посыл и крючок для зрителя',
  ],
  scene: [
    'Завязка сцены: место, время, исходное положение героев',
    'Развитие: действие, препятствие и эскалация напряжения',
    'Кульминация: пик напряжения, поворотный момент',
    'Развязка: финальный образ, настроение и эмоциональная точка',
  ],
  synopsis: [
    'Пролог: мир истории и главный герой до всего',
    'Завязка конфликта: нарушение равновесия',
    'Развитие: усложнение препятствий и цена ошибок',
    'Кульминация: решающее столкновение',
    'Развязка и мораль: чем всё закончилось и чему учит',
  ],
};

function fallbackSubGoals(task: MetaTask): string[] {
  const templates = SUBGOAL_TEMPLATES[task.artifactType];
  const count = Math.min(task.childCount, templates.length);
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    // Если подцелей меньше, чем детей, последние дети получают расширенные формулировки
    const tpl = templates[Math.min(i, templates.length - 1)];
    picked.push(`${tpl} (глобальная цель: ${task.goal})`);
  }
  return picked;
}

// ---------- Агент мета-уровня 1: Мета-планировщик ----------

async function planMetaStep(state: MetaState): Promise<MetaPlan> {
  const t = state.task;

  const fallbackPlan = (): MetaPlan => {
    const weakChild = state.children.find(c => c.needsRestart);
    if (weakChild) {
      return {
        strategy: `Перезапуск слабого ребёнка №${weakChild.index + 1}: подцель переформулирована по замечаниям критика`,
        subGoals: [],
        decision: 'restart_weak',
        notes: weakChild.restartReason || 'Ребёнок не достиг порога качества',
        degraded: true,
      };
    }
    if (state.children.length === 0) {
      return {
        strategy: 'Первичное разбиение глобальной цели на подцели по шаблону драматургии',
        subGoals: fallbackSubGoals(t),
        decision: 'continue',
        notes: 'План сгенерирован эвристикой (LLM недоступен)',
        degraded: true,
      };
    }
    return {
      strategy: 'Продолжение: продвинуть каждый незавершённый дочерний луп на один виток',
      subGoals: [],
      decision: 'continue',
      notes: 'План сгенерирован эвристикой (LLM недоступен)',
      degraded: true,
    };
  };

  const childSummary = state.children.length
    ? state.children.map(c =>
        `Ребёнок №${c.index + 1} [${c.status}], балл ${c.lastScore}, подцель: «${c.subGoal}»${c.needsRestart ? ` — ПРОВАЛ, нужен перезапуск: ${c.restartReason}` : ''}`
      ).join('\n')
    : 'Детей ещё нет — нужно разбить цель и создать дочерние лупы.';

  const sys = 'Ты мета-планировщик: надзираешь за несколькими параллельными циклами доработки текста. Отвечай строго JSON без markdown.';
  const prompt = `МЕТА-ВИТОК №${state.metaIteration + 1}.

ГЛОБАЛЬНАЯ ЦЕЛЬ: ${t.goal}
ТИП АРТЕФАКТА КАЖДОГО РЕБЁНКА: ${ARTIFACT_LABELS[t.artifactType]} — ${ARTIFACT_INSTRUCTIONS[t.artifactType]}
ВСЕГО ДОЧЕРНИХ ЛУПОВ: ${t.childCount}

ТЕКУЩЕЕ СОСТОЯНИЕ ДЕТЕЙ:
${childSummary}

Составь план этого мета-витка. Верни JSON:
{
  "strategy": "стратегия мета-витка (1 фраза)",
  "subGoals": [],                    // пусто, если детей создавать/менять не нужно
  "decision": "continue" | "restart_weak" | "finish",
  "notes": "заметка надзирателя"
}
Если детей ещё нет — разложи глобальную цель на ${t.childCount} последовательных подцелей в subGoals.
Если ребёнок провалился — переформулируй его подцель конкретнее и верни decision="restart_weak" (subGoals не нужны).`;

  const { text, degraded } = await llmCall(sys, prompt, 700);
  if (degraded) return fallbackPlan();
  const json = extractJson(text);
  if (!json || typeof json.strategy !== 'string') return fallbackPlan();
  const decision = ['continue', 'restart_weak', 'finish'].includes(String(json.decision))
    ? (String(json.decision) as MetaPlan['decision'])
    : 'continue';
  return {
    strategy: String(json.strategy),
    subGoals: Array.isArray(json.subGoals) ? json.subGoals.map(String).slice(0, t.childCount) : [],
    decision,
    notes: typeof json.notes === 'string' ? json.notes : '',
  };
}

// ---------- Агент мета-уровня 2: Мета-критик (оценивает сборку) ----------

async function critiqueAssembly(state: MetaState, assembly: string): Promise<Critique> {
  const t = state.task;

  const fallbackCritique = (): Critique => {
    // Эвристика: средний балл детей ± бонус за полноту состава
    const finished = state.children.filter(c => ['done', 'limit_reached', 'budget_exceeded', 'stopped'].includes(c.status));
    const avg = finished.length
      ? finished.reduce((acc, c) => acc + c.lastScore, 0) / finished.length
      : 5;
    const score = Math.max(1, Math.min(10, Math.round(avg)));
    return {
      score,
      verdict: score >= t.metaQualityThreshold ? 'accept' : 'redo',
      strengths: 'Сборка агрегирует лучшие версии всех дочерних лупов (эвристическая оценка)',
      weaknesses: score < t.metaQualityThreshold ? 'Дочерние циклы не набрали достаточного среднего балла' : '—',
      improvements: 'Усилить связность между частями сборки и убрать повторы',
      degraded: true,
    };
  };

  const sys = 'Ты мета-критик: оцениваешь сборку, собранную из результатов нескольких дочерних циклов. Строгий, но конструктивный. Отвечай строго JSON без markdown.';
  const prompt = `ГЛОБАЛЬНАЯ ЦЕЛЬ МЕТА-ЛУПА: ${t.goal}
АРТЕФАКТ: ${ARTIFACT_LABELS[t.artifactType]} — ${ARTIFACT_INSTRUCTIONS[t.artifactType]}

ЧАСТИ СБОРКИ (по одной на дочерний луп):
${state.children.map(c => `— Часть №${c.index + 1} (балл ребёнка ${c.lastScore}/10): «${c.subGoal}»`).join('\n')}

СБОРКА НА ОЦЕНКЕ:
${assembly}

Оцени сборку ЦЕЛИКОМ: связность частей, полнота раскрытия глобальной цели, отсутствие повторов. Верни JSON:
{"score": 0-10, "verdict": "accept"|"redo", "strengths": "1 фраза", "weaknesses": "1 фраза", "improvements": "1 фраза — что перекроить надзирателю"}`;

  const { text, degraded } = await llmCall(sys, prompt, 600);
  if (degraded) return fallbackCritique();
  const json = extractJson(text);
  if (!json || typeof json.score !== 'number') return fallbackCritique();
  const score = Math.max(0, Math.min(10, Math.round(json.score)));
  return {
    score,
    verdict: json.verdict === 'accept' || score >= t.metaQualityThreshold ? 'accept' : 'redo',
    strengths: typeof json.strengths === 'string' ? json.strengths : '',
    weaknesses: typeof json.weaknesses === 'string' ? json.weaknesses : '',
    improvements: typeof json.improvements === 'string' ? json.improvements : 'Продолжить надзор',
  };
}

// ---------- Хелперы дочерних лупов ----------

function childRunIdOf(metaRunId: string, index: number): string {
  return `${metaRunId}-c${index}`;
}

function childTaskOf(task: MetaTask, subGoal: string): LoopTask {
  // Ребёнок живёт в autoMode: его внешний круг — мета-луп, не человек.
  // Бюджет ребёнка — справедливая доля общего бюджета мета-лупа.
  const childBudget = Math.max(1000, Math.floor(task.maxTokens / task.childCount));
  return {
    goal: subGoal,
    artifactType: task.artifactType,
    maxIterations: task.childMaxIterations,
    qualityThreshold: task.childQualityThreshold,
    maxTokens: childBudget,
    autoMode: true,
    source: 'meta-child',
    sourceLabel: `Мета-луп: ${task.goal.slice(0, 80)}`,
  };
}

async function spawnChild(metaRunId: string, task: MetaTask, index: number, subGoal: string): Promise<ChildLoopSlot> {
  const childRunId = childRunIdOf(metaRunId, index);
  const childTask = childTaskOf(task, subGoal);
  await initRun(childRunId, childTask);
  const childState = createInitialState(childRunId, childTask);
  await writeMemoryFile(childRunId, 'state.json', childState);
  return {
    index,
    childRunId,
    subGoal,
    status: 'ready',
    reformulations: 0,
    needsRestart: false,
    restartReason: null,
    lastScore: 0,
  };
}

async function restartChild(metaRunId: string, task: MetaTask, slot: ChildLoopSlot, newSubGoal: string): Promise<ChildLoopSlot> {
  // Полный пересброс слабого ребёнка с уточнённой подцелью (коррекция надзирателя)
  await deleteRun(slot.childRunId);
  const childRunId = childRunIdOf(metaRunId, slot.index);
  const childTask = childTaskOf(task, newSubGoal);
  await initRun(childRunId, childTask);
  const childState = createInitialState(childRunId, childTask);
  await writeMemoryFile(childRunId, 'state.json', childState);
  return {
    ...slot,
    childRunId,
    subGoal: newSubGoal,
    status: 'ready',
    reformulations: slot.reformulations + 1,
    needsRestart: false,
    restartReason: null,
    lastScore: 0,
  };
}

const CHILD_TERMINAL: Array<LoopState['status']> = ['done', 'stopped', 'limit_reached', 'budget_exceeded', 'error'];

// ---------- ОДИН МЕТА-ВИТОК ----------

export async function runMetaStep(metaRunId: string): Promise<{
  state: MetaState;
  record: MetaIterationRecord;
  stopDecision: { stopped: boolean; reason: string; detail: string } | null;
}> {
  // 1. ЧИСТЫЙ СТАРТ надзирателя: читаем meta-state.json
  const state = await readMemoryFile<MetaState>(metaRunId, 'meta-state.json');
  if (!state) throw new Error('Состояние мета-лупа не найдено — сначала создайте run (action=init)');
  if (['done', 'stopped', 'limit_reached', 'budget_exceeded'].includes(state.status)) {
    throw new Error(`Мета-луп уже завершён (статус: ${state.status}). Создайте новый run.`);
  }

  const t = state.task;
  const stepStart = Date.now();
  let metaTokens = 0;

  // 2. ПЛАН мета-витка
  const plan = await planMetaStep(state);
  metaTokens += estimateTokens(plan.strategy, plan.subGoals.join(' '), plan.notes);

  // 2а. Первичное создание детей
  if (state.children.length === 0) {
    const subGoals = plan.subGoals.length >= 2 ? plan.subGoals.slice(0, t.childCount) : fallbackSubGoals(t);
    const slots: ChildLoopSlot[] = [];
    for (let i = 0; i < subGoals.length; i++) {
      slots.push(await spawnChild(metaRunId, t, i, subGoals[i]));
    }
    state.children = slots;
  }

  // 2б. КОРРЕКЦИЯ с прошлого витка: перезапуск провалившихся детей с уточнёнными подцелями
  for (const slot of state.children) {
    if (!slot.needsRestart) continue;
    // Переформулировка подцели: LLM на основе причины провала; фоллбэк — добавляем уточнение
    const reform = await reformulateSubGoal(state, slot);
    metaTokens += estimateTokens(reform);
    state.children[slot.index] = await restartChild(metaRunId, t, slot, reform);
  }

  // 3. ДЕЙСТВИЕ: каждый незавершённый ребёнок делает ОДИН свой виток
  const childrenSnapshots: MetaChildSnapshot[] = [];
  for (const slot of state.children) {
    let childState = await readMemoryFile<LoopState>(slot.childRunId, 'state.json');
    let stepped = false;

    if (childState && !CHILD_TERMINAL.includes(childState.status) && childState.status !== 'waiting_approval') {
      try {
        const result = await runLoopStep(slot.childRunId, false);
        childState = result.state;
        stepped = true;
      } catch {
        // ребёнок упал — фиксируем статус ошибки, мета-луп продолжает управлять остальными
        if (childState) {
          childState.status = 'error';
          childState.stopReason = 'Дочерний цикл упал на витке (ошибка зафиксирована надзирателем)';
          await writeMemoryFile(slot.childRunId, 'state.json', childState);
        }
      }
    }

    if (childState) {
      // Ребёнок в waiting_approval не должен задерживать мета-луп: его внешний круг — надзиратель
      if (childState.status === 'waiting_approval') {
        childState.status = 'running';
        await writeMemoryFile(slot.childRunId, 'state.json', childState);
      }
      // Синхронизация слота с реальным состоянием ребёнка
      slot.status = childState.status;
      slot.lastScore = childState.bestScore;

      // Ребёнок завершился, но не дотянул до порога качества → кандидат на перезапуск
      if (
        CHILD_TERMINAL.includes(childState.status) &&
        childState.bestScore < t.childQualityThreshold &&
        slot.reformulations < 1 && // максимум одна переформулировка на ребёнка — защита от вечного цикла
        state.metaIteration + 1 < t.maxMetaIterations // есть куда отложить перезапуск
      ) {
        slot.needsRestart = true;
        slot.restartReason = childState.lastCritique?.improvements
          || `Балл ${childState.bestScore}/10 ниже порога ${t.childQualityThreshold}`;
      }
    }

    childrenSnapshots.push({
      index: slot.index,
      childRunId: slot.childRunId,
      subGoal: slot.subGoal,
      status: childState?.status || 'not_created',
      score: childState?.bestScore || 0,
      iterations: childState?.iteration || 0,
      tokens: childState?.debts.tokens || 0,
      bestDraft: childState?.bestDraft || null,
      steppedThisIteration: stepped,
    });
  }

  // 4. НАБЛЮДЕНИЕ: агрегация долгов (дети + мета-уровень) — пересчёт с нуля, без дельт
  const childStates = await Promise.all(
    state.children.map(s => readMemoryFile<LoopState>(s.childRunId, 'state.json'))
  );
  const aggregated: DebtReport = childStates.reduce<DebtReport>(
    (acc, cs) => {
      if (!cs) return acc;
      return {
        tokens: acc.tokens + cs.debts.tokens,
        moneyRub: acc.moneyRub + cs.debts.moneyRub,
        timeMs: acc.timeMs + cs.debts.timeMs,
        techDebt: acc.techDebt,
        retries: acc.retries + cs.debts.retries,
        failedChecks: acc.failedChecks + cs.debts.failedChecks,
      };
    },
    { ...EMPTY_DEBTS }
  );
  aggregated.techDebt = Math.min(
    100,
    Math.round(
      (100 * (aggregated.retries * 12 + aggregated.failedChecks * 8)) /
        (aggregated.retries * 12 + aggregated.failedChecks * 8 + 90 || 1)
    )
  );
  state.debts = aggregated;

  // 5. СБОРКА: когда все дети в терминальном статусе — собираем финальный артефакт
  const allTerminal = state.children.length > 0 && state.children.every(c => CHILD_TERMINAL.includes(c.status));
  let assembly: string | null = null;
  let critique: Critique | null = null;
  let decision = plan.decision;

  if (allTerminal) {
    const parts = childrenSnapshots
      .filter(c => c.bestDraft)
      .sort((a, b) => a.index - b.index)
      .map((c, i) => `— Часть ${i + 1}: ${c.subGoal}\n${c.bestDraft}`);
    assembly = parts.length ? parts.join('\n\n') : null;
    state.assembly = assembly;

    if (assembly) {
      critique = await critiqueAssembly(state, assembly);
      metaTokens += estimateTokens(critique.strengths, critique.weaknesses, critique.improvements);

      if (critique.score > state.bestAssemblyScore) {
        state.bestAssemblyScore = critique.score;
        state.bestAssembly = assembly;
      }
      decision = critique.verdict === 'accept' ? 'finish' : 'restart_weak';
    }
  }

  // 6. Запись мета-витка в историю (файловая память надзирателя)
  const record: MetaIterationRecord = {
    n: state.metaIteration + 1,
    plan,
    children: childrenSnapshots,
    assembly,
    critique,
    decision,
    tokens: metaTokens,
    ms: Date.now() - stepStart,
    timestamp: Date.now(),
  };
  state.history.push(record);
  await writeMemoryFile(metaRunId, `meta-iteration-${record.n}.json`, record);

  // 7. СТОП-КРИТЕРИИ мета-лупа
  const stopDecision = evaluateMetaStopCriteria(state, allTerminal, critique);
  if (stopDecision) {
    state.status =
      stopDecision.reason === 'quality_reached' ? 'done' :
      stopDecision.reason === 'limit_reached' ? 'limit_reached' :
      'budget_exceeded';
    state.stopReason = stopDecision.detail;
    await writeMemoryFile(metaRunId, 'meta-final.json', {
      finished: Date.now(),
      reason: stopDecision.reason,
      detail: stopDecision.detail,
      bestAssemblyScore: state.bestAssemblyScore,
      bestAssembly: state.bestAssembly,
      totalTokens: state.debts.tokens,
      children: state.children.map(c => ({ index: c.index, subGoal: c.subGoal, status: c.status, score: c.lastScore })),
    });
  } else {
    // 8. ВНЕШНИЙ КРУГ: ворота одобрения после каждого мета-витка (если не autoMode)
    state.status = t.autoMode ? 'running' : 'waiting_approval';
  }

  state.metaIteration = Math.max(state.metaIteration, record.n);
  state.updated = Date.now();
  await writeMemoryFile(metaRunId, 'meta-state.json', state);
  return { state, record, stopDecision };
}

// ---------- Стоп-критерии мета-лупа ----------

export function evaluateMetaStopCriteria(
  state: MetaState,
  allTerminal: boolean,
  critique: Critique | null
): { stopped: boolean; reason: string; detail: string } | null {
  const t = state.task;

  // Критерий 1: все дети завершены и сборка дотянула до порога надзирателя
  if (allTerminal && critique && critique.score >= t.metaQualityThreshold && critique.verdict === 'accept') {
    return {
      stopped: true,
      reason: 'quality_reached',
      detail: `Мета-критерий выполнен: сборка ${critique.score}/10 ≥ порога надзирателя ${t.metaQualityThreshold}. Все ${state.children.length} дочерних лупов завершены.`,
    };
  }

  // Критерий 2: лимит мета-витков
  if (state.metaIteration + 1 >= t.maxMetaIterations) {
    return {
      stopped: true,
      reason: 'limit_reached',
      detail: `Достигнут лимит мета-витков (${t.maxMetaIterations}). Надзиратель остановлен, чтобы вложенная структура не крутилась вечно.`,
    };
  }

  // Критерий 3: общий бюджет токенов (дети + мета-уровень)
  if (state.debts.tokens >= t.maxTokens) {
    return {
      stopped: true,
      reason: 'budget_exceeded',
      detail: `Общий бюджет исчерпан: ${state.debts.tokens} токенов ≥ лимита ${t.maxTokens}. Долг по токенам всей вложенной структуры достиг предела.`,
    };
  }

  return null;
}

// ---------- Переформулировка подцели слабого ребёнка (коррекция надзирателя) ----------

async function reformulateSubGoal(state: MetaState, slot: ChildLoopSlot): Promise<string> {
  const fallback = `${slot.subGoal} — УСИЛЕННАЯ ПОСТАНОВКА: ${slot.restartReason || 'добиться порога качества'}`;

  const { text, degraded } = await llmCall(
    'Ты мета-планировщик, переформулируешь подцель для перезапуска дочернего цикла. Отвечай строго JSON без markdown.',
    `Подцель ребёнка: «${slot.subGoal}»
Причина провала: ${slot.restartReason || 'низкий балл критика'}
Глобальная цель: ${state.task.goal}

Переформулируй подцель конкретнее и достижимость, учтя причину провала. Верни JSON:
{"subGoal": "новая формулировка подцели (1 предложение)"}`,
    300
  );
  if (degraded) return fallback;
  const json = extractJson(text);
  if (!json || typeof json.subGoal !== 'string' || !json.subGoal.trim()) return fallback;
  return json.subGoal.trim().slice(0, 300);
}

// ---------- Действия человека во внешнем круге мета-лупа ----------

export async function metaHumanDecision(
  metaRunId: string,
  decision: 'accept' | 'stop'
): Promise<MetaState> {
  const state = await readMemoryFile<MetaState>(metaRunId, 'meta-state.json');
  if (!state) throw new Error('Состояние мета-лупа не найдено');

  if (decision === 'stop') {
    // Остановка надзирателя останавливает и управление детьми:
    // дети в терминальных статусах уже завершены сами (свои стоп-критерии),
    // незавершённые остаются как есть — их состояние зафиксировано в их state.json.
    state.status = 'stopped';
    state.stopReason = 'Мета-луп остановлен человеком во внешнем круге (финальное решение всегда за человеком).';
    await writeMemoryFile(metaRunId, 'meta-final.json', {
      finished: Date.now(),
      reason: 'stopped_by_human',
      detail: state.stopReason,
      bestAssemblyScore: state.bestAssemblyScore,
      bestAssembly: state.bestAssembly,
      totalTokens: state.debts.tokens,
    });
  } else {
    state.status = 'running';
  }
  state.updated = Date.now();
  await writeMemoryFile(metaRunId, 'meta-state.json', state);
  return state;
}
