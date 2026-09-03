// ============================================================
// ФОРТОРИУМ v5.0 — Движок Луп-инженеринга (Этап 4 из видео, 00:18:40)
//
// Цикл: План → Действие → Наблюдение → (Ошибка) → Новый план
//
// Ключевые принципы из видео:
//  1. ЧИСТЫЕ АГЕНТЫ: каждый виток стартует с нулевым контекстом.
//     Единственный источник памяти — файл состояния state.json на диске.
//     Экономит токены и предотвращает галлюцинации от переполненного контекста.
//  2. ФАЙЛОВАЯ ПАМЯТЬ: итоги витков записываются на диск
//     (iteration-N.json), следующий агент читает файлы, а не диалог.
//  3. СТОП-КРИТЕРИИ (условие №1): лимит витков, порог качества, бюджет токенов.
//  4. ВАЛИДАТОР (условие №3): скрипт-проверки + отдельный LLM-критик.
//  5. ВНЕШНИЙ КРУГ (00:28:36): если autoMode выключен, после каждого витка
//     цикл останавливается и ждёт решения человека.
// ============================================================

import ZAI from 'z-ai-web-dev-sdk';
import {
  LoopState, LoopTask, LoopPlan, Critique, IterationRecord,
  ARTIFACT_INSTRUCTIONS, ARTIFACT_LABELS,
} from './types';
import { writeMemoryFile, readMemoryFile } from './file-memory';
import { runScriptChecks, countFailed } from './validator';
import { estimateTokens, accumulateDebts, EMPTY_DEBTS } from './debts';

// Создать новое состояние цикла
export function createInitialState(runId: string, task: LoopTask): LoopState {
  return {
    runId,
    task,
    iteration: 0,
    attempt: 1,
    status: 'ready',
    stopReason: null,
    bestScore: 0,
    bestDraft: null,
    lastCritique: null,
    debts: { ...EMPTY_DEBTS },
    iterations: [],
    created: Date.now(),
    updated: Date.now(),
  };
}

// ---------- LLM-хелпер (модель = "мозг", обвязка = "руки") ----------
// Экспортируется для мета-лупа (meta-loop.ts) — тот же принцип graceful degradation

export async function llmCall(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1200
): Promise<{ text: string; degraded: boolean }> {
  try {
    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });
    const text = response.choices[0]?.message?.content || '';
    if (!text.trim()) return { text: '', degraded: true };
    return { text, degraded: false };
  } catch (e) {
    console.error('[LoopEngine] LLM error, switching to fallback:', e);
    return { text: '', degraded: true };
  }
}

export function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ---------- Агент 1: Планировщик (чистый, читает только файл) ----------

async function planIteration(state: LoopState): Promise<LoopPlan> {
  const t = state.task;

  // Фоллбэк-план без LLM (graceful degradation)
  const fallbackPlan = (): LoopPlan => {
    const crit = state.lastCritique;
    const focus = crit?.improvements ? 'Устранить замечания критика' : 'Первичное написание артефакта';
    return {
      focus,
      changes: crit?.improvements
        ? [crit.improvements]
        : ['Создать первую версию артефакта по цели цикла'],
      notes: 'План сгенерирован эвристикой (LLM недоступен)',
      degraded: true,
    };
  };

  const sys = 'Ты планировщик в цикле автоматической доработки текстов. Отвечай строго JSON без markdown.';
  const prompt = `Цикл доработки. Виток №${state.iteration + 1}.

ЦЕЛЬ ЦИКЛА: ${t.goal}
ТИП АРТЕФАКТА: ${ARTIFACT_LABELS[t.artifactType]} — ${ARTIFACT_INSTRUCTIONS[t.artifactType]}

${state.lastCritique
  ? `КРИТИКА ПРЕДЫДУЩЕГО ВИТКА (балл ${state.lastCritique.score}/10):
Слабые стороны: ${state.lastCritique.weaknesses}
Что улучшить: ${state.lastCritique.improvements}`
  : 'Это первый виток: предыдущей версии нет.'}

Составь короткий план этого витка. Верни JSON:
{"focus": "на чём сосредоточиться (1 фраза)", "changes": ["изменение 1", "изменение 2"], "notes": "заметка исполнителю"}`;

  const { text, degraded } = await llmCall(sys, prompt, 500);
  if (degraded) return fallbackPlan();
  const json = extractJson(text);
  if (!json || typeof json.focus !== 'string') return fallbackPlan();
  return {
    focus: String(json.focus),
    changes: Array.isArray(json.changes) ? json.changes.map(String).slice(0, 5) : [],
    notes: typeof json.notes === 'string' ? json.notes : '',
  };
}

// ---------- Агент 2: Исполнитель (чистый, получает план + критику из файла) ----------

async function executeIteration(state: LoopState, plan: LoopPlan): Promise<{ draft: string; degraded: boolean }> {
  const t = state.task;
  const prev = state.bestDraft;
  const crit = state.lastCritique;
  // v5.1: если это первый виток и задан стартовый текст (например, сцена из демо-режима) —
  // цикл не пишет с нуля, а ДОРАБАТЫВАЕТ существующий артефакт
  const initialDraft = t.initialDraft?.trim() || null;

  const fallbackDraft = (): string => {
    // Эвристика: применяем критику текстуально, чтобы цикл двигался даже без LLM
    const base = prev || initialDraft || `Черновик «${ARTIFACT_LABELS[t.artifactType]}» по цели: ${t.goal}.`;
    const fix = crit?.improvements ? `\n\nУчтено замечание критика: ${crit.improvements}.` : '';
    return `${base}\n\n(Виток ${state.iteration + 1}: ${plan.focus})${fix}`;
  };

  const sys = 'Ты сценарист анимационной студии. Пиши живой, конкретный текст на русском. Без markdown, без пояснений — только сам артефакт.';
  const prompt = `ЦЕЛЬ: ${t.goal}
АРТЕФАКТ: ${ARTIFACT_LABELS[t.artifactType]} — ${ARTIFACT_INSTRUCTIONS[t.artifactType]}

ПЛАН ВИТКА: ${plan.focus}
${plan.changes.length ? 'ИЗМЕНЕНИЯ: ' + plan.changes.join('; ') : ''}

${prev
  ? `ПРЕДЫДУЩАЯ ВЕРСИЯ (балл ${state.bestScore}/10):
${prev}

КРИТИКА: ${crit ? crit.weaknesses + ' ' + crit.improvements : ''}
Напиши УЛУЧШЕННУЮ версию, исправив указанные слабости.`
  : initialDraft
  ? `ИСХОДНАЯ ВЕРСИЯ (черновик из демо-режима, требует доработки):
${initialDraft}

Напиши УЛУЧШЕННУЮ версию этого артефакта по плану витка, сохранив суть, но подняв качество.`
  : 'Напиши первую версию артефакта.'}`;

  const { text, degraded } = await llmCall(sys, prompt, 1500);
  if (degraded || !text.trim()) return { draft: fallbackDraft(), degraded: true };
  return { draft: text.trim(), degraded };
}

// ---------- Агент 3: Критик (независимый второй агент — барьер качества) ----------

async function critiqueDraft(state: LoopState, draft: string, failedChecks: number): Promise<Critique> {
  const t = state.task;

  const fallbackCritique = (): Critique => {
    // Эвристика: балл растёт с витками, штраф за проваленные проверки
    const base = Math.min(9, 4 + state.iteration + (failedChecks === 0 ? 1 : 0));
    const score = Math.max(2, base - failedChecks);
    return {
      score,
      verdict: score >= t.qualityThreshold ? 'accept' : 'redo',
      strengths: 'Текст соответствует цели по объёму и структуре (эвристическая оценка)',
      weaknesses: failedChecks > 0 ? `Провалено проверок: ${failedChecks}` : 'Требуется уточнение деталей и эмоциональных акцентов',
      improvements: state.iteration < 1 ? 'Усилить конфликт и добавить конкретные визуальные детали' : 'Отшлифовать формулировки, убрать общие слова',
      degraded: true,
    };
  };

  const sys = 'Ты строгий, но конструктивный редактор анимационной студии. Оцениваешь текст по 10-балльной шкале. Отвечай строго JSON без markdown.';
  const prompt = `ЦЕЛЬ ЦИКЛА: ${t.goal}
АРТЕФАКТ (${ARTIFACT_LABELS[t.artifactType]}): ${ARTIFACT_INSTRUCTIONS[t.artifactType]}

ТЕКСТ ДЛЯ ОЦЕНКИ:
${draft}

${failedChecks > 0 ? `ВНИМАНИЕ: скрипт-проверки провалены: ${failedChecks} шт. — учти это в оценке.` : ''}

Оцени текст. Верни JSON:
{"score": 0-10, "verdict": "accept"|"redo", "strengths": "1 фраза", "weaknesses": "1 фраза", "improvements": "1 фраза — конкретное улучшение"}`;

  const { text, degraded } = await llmCall(sys, prompt, 600);
  if (degraded) return fallbackCritique();
  const json = extractJson(text);
  if (!json || typeof json.score !== 'number') return fallbackCritique();
  const score = Math.max(0, Math.min(10, Math.round(json.score)));
  return {
    score,
    verdict: json.verdict === 'accept' || score >= t.qualityThreshold ? 'accept' : 'redo',
    strengths: typeof json.strengths === 'string' ? json.strengths : '',
    weaknesses: typeof json.weaknesses === 'string' ? json.weaknesses : '',
    improvements: typeof json.improvements === 'string' ? json.improvements : 'Продолжить доработку',
  };
}

// ---------- Оценка стоп-критериев (условие №1 из видео) ----------

export function evaluateStopCriteria(state: LoopState): { stopped: boolean; reason: string; detail: string } | null {
  const t = state.task;
  const last = state.iterations[state.iterations.length - 1];
  if (!last) return null;

  // Критерий 1: достигнут порог качества
  if (last.critique && last.critique.score >= t.qualityThreshold && last.critique.verdict === 'accept') {
    return {
      stopped: true,
      reason: 'quality_reached',
      detail: `Критерий остановки выполнен: балл ${last.critique.score}/10 ≥ порога ${t.qualityThreshold}. Цикл завершился сам, не уходя в бесконечность.`,
    };
  }

  // Критерий 2: лимит витков
  if (state.iteration >= t.maxIterations) {
    return {
      stopped: true,
      reason: 'limit_reached',
      detail: `Достигнут лимит витков (${t.maxIterations}). Остановка защищает от бесконечного цикла.`,
    };
  }

  // Критерий 3: бюджет токенов
  if (state.debts.tokens >= t.maxTokens) {
    return {
      stopped: true,
      reason: 'budget_exceeded',
      detail: `Бюджет исчерпан: ${state.debts.tokens} токенов ≥ лимита ${t.maxTokens}. Долг по токенам достиг предела.`,
    };
  }

  return null;
}

// ---------- ОДИН ВИТОК ЦИКЛА ----------
// Каждый вызов — новый набор чистых агентов с нулевым контекстом.
// Вся память — только через файлы state.json / iteration-N.json.

export async function runLoopStep(runId: string, redo = false): Promise<{
  state: LoopState;
  iteration: IterationRecord | null;
  stopDecision: { stopped: boolean; reason: string; detail: string } | null;
}> {
  // 1. ЧИСТЫЙ СТАРТ: читаем единственный файл состояния
  const state = await readMemoryFile<LoopState>(runId, 'state.json');
  if (!state) throw new Error('Состояние цикла не найдено — сначала создайте run (action=init)');
  if (['done', 'stopped', 'limit_reached', 'budget_exceeded'].includes(state.status)) {
    throw new Error(`Цикл уже завершён (статус: ${state.status}). Создайте новый run.`);
  }

  const t = state.task;
  const stepStart = Date.now();

  // Номер витка: при redo переделываем последний виток (тот же номер, новая попытка)
  const n = redo ? Math.max(1, state.iteration) : state.iteration + 1;
  const attempt = redo ? state.attempt + 1 : 1;

  // 2. ПЛАН (агент-планировщик читает критику из файла состояния)
  const plan = await planIteration(state);

  // 3. ДЕЙСТВИЕ (агент-исполнитель пишет черновик)
  const { draft, degraded: execDegraded } = await executeIteration(state, plan);

  // 4. НАБЛЮДЕНИЕ: скрипт-валидатор (барьер 1)
  // v5.1: на первом витке эталоном служит initialDraft — цикл обязан улучшить исходник,
  // а не выдать его обратно без изменений
  const sameIterPrev = state.iterations
    .filter(i => i.n === n)
    .sort((a, b) => b.attempt - a.attempt)[0];
  const previousDraft = sameIterPrev?.draft
    ?? (n === 1 && attempt === 1 ? t.initialDraft?.trim() || null : null);
  const scriptChecks = runScriptChecks(draft, t.artifactType, previousDraft);
  const failed = countFailed(scriptChecks);

  // 5. НАБЛЮДЕНИЕ: LLM-критик (барьер 2, независимый агент)
  const critique = await critiqueDraft(state, draft, failed);

  // 6. Учёт долгов
  const iterTokens = estimateTokens(
    t.goal, plan.focus, plan.changes.join(' '), plan.notes,
    draft, critique.strengths, critique.weaknesses, critique.improvements
  );
  const iterMs = Date.now() - stepStart;
  const debts = accumulateDebts(state.debts, {
    tokens: iterTokens,
    ms: iterMs,
    failedChecks: failed,
    retry: redo,
  });

  // 7. Запись витка в историю и на диск (файловая память)
  const record: IterationRecord = {
    n, attempt, plan, draft, scriptChecks, critique,
    tokens: iterTokens, ms: iterMs,
    degraded: execDegraded || critique.degraded === true || plan.degraded === true,
    timestamp: Date.now(),
  };
  state.iterations = state.iterations.filter(i => !(i.n === n && i.attempt >= attempt));
  state.iterations.push(record);
  state.iteration = Math.max(state.iteration, n);
  state.attempt = attempt;
  state.debts = debts;

  if (!state.bestDraft || critique.score > state.bestScore) {
    state.bestScore = critique.score;
    state.bestDraft = draft;
  }
  state.lastCritique = critique;

  await writeMemoryFile(runId, `iteration-${n}${attempt > 1 ? `-try${attempt}` : ''}.json`, {
    iteration: n, attempt, plan, draft, scriptChecks, critique,
    tokens: iterTokens, ms: iterMs, timestamp: record.timestamp,
  });

  // 8. Стоп-критерии (условие №1 из видео: цикл обязан знать, когда остановиться)
  const stopDecision = evaluateStopCriteria(state);
  if (stopDecision) {
    state.status =
      stopDecision.reason === 'quality_reached' ? 'done' :
      stopDecision.reason === 'limit_reached' ? 'limit_reached' :
      'budget_exceeded';
    state.stopReason = stopDecision.detail;
    await writeMemoryFile(runId, 'final.json', {
      finished: Date.now(),
      reason: stopDecision.reason,
      detail: stopDecision.detail,
      bestScore: state.bestScore,
      bestDraft: state.bestDraft,
      totalTokens: debts.tokens,
      totalTimeMs: debts.timeMs,
      iterations: state.iterations.length,
    });
  } else {
    // 9. ВНЕШНИЙ КРУГ (00:28:36): человек контролирует каждый виток,
    // если autoMode выключен. В autoMode цикл продолжает сам (с предупреждением).
    state.status = t.autoMode ? 'running' : 'waiting_approval';
  }

  state.updated = Date.now();
  await writeMemoryFile(runId, 'state.json', state);
  return { state, iteration: record, stopDecision };
}

// Действия человека во внешнем круге
export async function humanDecision(
  runId: string,
  decision: 'accept' | 'stop'
): Promise<LoopState> {
  const state = await readMemoryFile<LoopState>(runId, 'state.json');
  if (!state) throw new Error('Состояние цикла не найдено');

  if (decision === 'stop') {
    state.status = 'stopped';
    state.stopReason = 'Цикл остановлен человеком во внешнем круге (контроль финальной точки выхода).';
    await writeMemoryFile(runId, 'final.json', {
      finished: Date.now(),
      reason: 'stopped_by_human',
      detail: state.stopReason,
      bestScore: state.bestScore,
      bestDraft: state.bestDraft,
      totalTokens: state.debts.tokens,
      iterations: state.iterations.length,
    });
  } else {
    // Одобрение витка: цикл может продолжаться
    state.status = 'running';
  }
  state.updated = Date.now();
  await writeMemoryFile(runId, 'state.json', state);
  return state;
}
