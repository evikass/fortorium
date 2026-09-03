// ============================================================
// ФОРТОРИУМ v5.0 — Граф-инженеринг (будущее из видео, 00:29:32)
//
// Следующий уровень после лупа: не линейные цепочки и не одиночные
// циклы, а ветвящийся граф специализированных агентов. Система
// маршрутизации (роутер) решает, по какому пути пойти, в зависимости
// от ПРОМЕЖУТОЧНЫХ РЕЗУЛЬТАТОВ узлов.
//
// Узлы графа (каждый — узкий специалист):
//   analyst  — классифицирует задачу
//   router   — маршрутизатор (виртуальный узел, выбирает рёбра)
//   writer   — сценарная ветка
//   concept  — визуальная ветка
//   critic   — контроль качества (может отправить узел на переделку)
//   director — финальная сборка результата
//
// Рёбра самокоррекции: critic --(score < 7)--> writer/concept
// Передача данных между узлами — через переменные трассы (мини-файлы),
// каждый узел видит только выход предыдущего узла.
// ============================================================

import ZAI from 'z-ai-web-dev-sdk';
import { GraphRouteResult, GraphTraceStep, GraphNodeId } from './types';
import { estimateTokens } from './debts';

// Описание графа для UI-визуализации
export const GRAPH_NODES = [
  { id: 'analyst', name: 'Аналитик', icon: '🧭', description: 'Классифицирует задачу и готовит данные для маршрутизации', x: 100, y: 160 },
  { id: 'router', name: 'Маршрутизатор', icon: '🔀', description: 'Выбирает ребро графа по промежуточному результату', x: 250, y: 160 },
  { id: 'writer', name: 'Сценарист', icon: '📝', description: 'Сценарная ветка: сюжет, логлайн, текст', x: 420, y: 70 },
  { id: 'concept', name: 'Концепт-художник', icon: '🎨', description: 'Визуальная ветка: образ, палитра, атмосфера', x: 420, y: 250 },
  { id: 'critic', name: 'Критик', icon: '🔍', description: 'Оценивает результат ветки; score < 7 → ребро переделки', x: 580, y: 160 },
  { id: 'director', name: 'Дирижёр', icon: '🎼', description: 'Финальная сборка: сводит результаты в решение', x: 730, y: 160 },
] as const;

export const GRAPH_EDGES = [
  { from: 'analyst', to: 'router', label: 'данные задачи', condition: 'всегда' },
  { from: 'router', to: 'writer', label: 'сценарная ветка', condition: 'kind = narrative | mixed' },
  { from: 'router', to: 'concept', label: 'визуальная ветка', condition: 'kind = visual | mixed' },
  { from: 'writer', to: 'critic', label: 'текст на проверку', condition: 'после узла writer' },
  { from: 'concept', to: 'critic', label: 'образ на проверку', condition: 'после узла concept' },
  { from: 'critic', to: 'writer', label: 'ребро самокоррекции', condition: 'score < 7 (макс. 1 раз)' },
  { from: 'critic', to: 'concept', label: 'ребро самокоррекции', condition: 'score < 7 (макс. 1 раз)' },
  { from: 'critic', to: 'director', label: 'результат принят', condition: 'score ≥ 7 или лимит коррекций' },
] as const;

// ---------- LLM-хелпер ----------

async function llmCall(systemPrompt: string, userPrompt: string, maxTokens = 700): Promise<{ text: string; degraded: boolean }> {
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
    console.error('[GraphRouter] LLM error, fallback:', e);
    return { text: '', degraded: true };
  }
}

type TaskKind = 'narrative' | 'visual' | 'mixed';

interface Analysis {
  kind: TaskKind;
  notes: string;
  degraded: boolean;
}

// ---------- Узел: Аналитик ----------

async function nodeAnalyst(task: string): Promise<Analysis> {
  const { text, degraded } = await llmCall(
    'Ты аналитик задач анимационной студии. Отвечай строго JSON без markdown.',
    `Классифицируй задачу: ${task}

Виды:
- narrative — нужен текст/сюжет/сценарий
- visual — нужен визуальный образ/описание кадра
- mixed — нужно и то, и другое

Верни JSON: {"kind": "narrative"|"visual"|"mixed", "notes": "1 фраза — что именно нужно"}`,
    300
  );
  if (degraded) {
    // Эвристический фоллбэк по ключевым словам
    const visualHints = /(визуальн|рисунок|картин|пейзаж|цвет|палитр|образ|кадр|стил)/i;
    const narrativeHints = /(сюжет|сценар|истори|текст|логлайн|диалог|синопсис|персонаж)/i;
    const kind: TaskKind = visualHints.test(task) && narrativeHints.test(task) ? 'mixed' : visualHints.test(task) ? 'visual' : 'narrative';
    return { kind, notes: 'Классификация по ключевым словам (LLM недоступен)', degraded: true };
  }
  const m = text.match(/\{[\s\S]*\}/);
  try {
    const json = JSON.parse(m![0]);
    const kind = ['narrative', 'visual', 'mixed'].includes(json.kind) ? json.kind as TaskKind : 'narrative';
    return { kind, notes: typeof json.notes === 'string' ? json.notes : '', degraded: false };
  } catch {
    return { kind: 'narrative', notes: '', degraded: true };
  }
}

// ---------- Узлы веток: Сценарист / Концепт-художник ----------

async function nodeWriter(task: string, extra: string, correction?: string): Promise<{ output: string; degraded: boolean }> {
  const { text, degraded } = await llmCall(
    'Ты сценарист анимационной студии. Только сам текст, без markdown и пояснений.',
    `Задача: ${task}
${extra ? `Контекст: ${extra}` : ''}
${correction ? `ЗАМЕЧАНИЕ КРИТИКА (переделай, исправив это): ${correction}` : ''}

Напиши короткий сценарный фрагмент: логлайн (1-2 предложения) и мини-сцену (3-5 предложений с одной репликой).`,
    700
  );
  if (degraded || !text.trim()) {
    const base = `Логлайн: история о том, как ${task.replace(/^(создай|напиши|придумай)\s*/i, '')}. Сцена: утро, мягкий свет, герой делает первый шаг навстречу неизвестному. Реплика: «Если не сейчас — то никогда».`;
    return { output: correction ? `${base} (исправлено: ${correction.slice(0, 80)})` : base, degraded: true };
  }
  return { output: text.trim(), degraded };
}

async function nodeConcept(task: string, extra: string, correction?: string): Promise<{ output: string; degraded: boolean }> {
  const { text, degraded } = await llmCall(
    'Ты концепт-художник анимационной студии. Описываешь визуальное решение словами. Без markdown.',
    `Задача: ${task}
${extra ? `Контекст: ${extra}` : ''}
${correction ? `ЗАМЕЧАНИЕ КРИТИКА (переделай, исправив это): ${correction}` : ''}

Создай визуальный концепт: палитра (3-4 цвета), освещение, композиция кадра, ключевая метафора образа (4-6 предложений).`,
    700
  );
  if (degraded || !text.trim()) {
    const base = `Палитра: тёплый янтарный #F4A261, глубокий индиго #264653, мятный акцент #2A9D8F, кремовый фон #FAF3E0. Освещение: контровый свет заката. Композиция: герой в левой трети, взгляд ведёт в пустую правую часть — пространство будущего. Метафора: мост из света между обыденностью и мечтой.`;
    return { output: correction ? `${base} (исправлено: ${correction.slice(0, 80)})` : base, degraded: true };
  }
  return { output: text.trim(), degraded };
}

// ---------- Узел: Критик (возвращает score + замечание) ----------

async function nodeCritic(task: string, output: string): Promise<{ score: number; note: string; degraded: boolean }> {
  const { text, degraded } = await llmCall(
    'Ты критик анимационной студии. Строгий, но конструктивный. Отвечай строго JSON.',
    `Задача: ${task}

Результат узла:
${output}

Оцени по 10-балльной шкале. Верни JSON: {"score": 0-10, "note": "что улучшить, 1 фраза"}`,
    300
  );
  if (degraded) {
    return { score: 7, note: 'Эвристическая оценка (LLM недоступен): результат структурно полный', degraded: true };
  }
  const m = text.match(/\{[\s\S]*\}/);
  try {
    const json = JSON.parse(m![0]);
    return {
      score: Math.max(0, Math.min(10, Math.round(Number(json.score) || 6))),
      note: typeof json.note === 'string' ? json.note : '',
      degraded: false,
    };
  } catch {
    return { score: 6, note: '', degraded: true };
  }
}

// ---------- Узел: Дирижёр (финальная сборка) ----------

async function nodeDirector(task: string, branchOutputs: string[], score: number): Promise<{ output: string; degraded: boolean }> {
  const { text, degraded } = await llmCall(
    'Ты дирижёр оркестра агентов: собираешь финальное решение из результатов узлов графа. Кратко, по делу, без markdown.',
    `Исходная задача: ${task}

Результаты узлов графа:
${branchOutputs.map((o, i) => `${i + 1}. ${o}`).join('\n\n')}

Оценка критика: ${score}/10.

Собери финальный ответ: 2-4 предложения — что сделано и как выглядит решение задачи.`,
    500
  );
  if (degraded || !text.trim()) {
    return { output: `Решение по задаче «${task}»: ${branchOutputs.join(' ')} (оценка качества: ${score}/10).`, degraded: true };
  }
  return { output: text.trim(), degraded };
}

// ---------- Маршрутизация по графу ----------

export async function routeThroughGraph(task: string): Promise<GraphRouteResult> {
  const steps: GraphTraceStep[] = [];
  const branchDecisions: string[] = [];
  const path: GraphNodeId[] = [];
  let correctionLoops = 0;
  let totalTokens = 0;
  const routeStart = Date.now();

  const pushStep = (node: GraphNodeId, input: string, output: string, ms: number, degraded: boolean) => {
    const info = GRAPH_NODES.find(n => n.id === node)!;
    steps.push({
      node,
      nodeName: info.name,
      icon: info.icon,
      inputSummary: input.slice(0, 140),
      outputSummary: output.slice(0, 140),
      outputFull: output,
      ms,
      tokens: estimateTokens(input, output),
      degraded,
    });
    path.push(node);
    totalTokens += estimateTokens(input, output);
  };

  // 1. Аналитик
  let t0 = Date.now();
  const analysis = await nodeAnalyst(task);
  pushStep('analyst', task, `kind=${analysis.kind}; ${analysis.notes}`, Date.now() - t0, analysis.degraded);

  // 2. Маршрутизатор: выбор ветки по промежуточному результату аналитика
  const kindLabel = analysis.kind === 'narrative' ? 'сценарная ветка' : analysis.kind === 'visual' ? 'визуальная ветка' : 'обе ветки (mixed)';
  branchDecisions.push(`Маршрутизатор: анализ → «${analysis.kind}» → выбран путь: ${kindLabel}.`);
  path.push('router');

  // 3. Выполнение ветки (для mixed — последовательно, выход writer передаётся concept)
  const branchOutputs: string[] = [];
  const runBranch = async (branch: 'writer' | 'concept', extra: string): Promise<{ output: string; score: number; note: string }> => {
    let output = '';
    let degraded = false;
    let note = '';
    let score = 0;
    let attempts = 0;

    // Выполнение узла ветки + ребро самокоррекции при score < 7
    while (attempts < 2) {
      attempts++;
      t0 = Date.now();
      const res = branch === 'writer'
        ? await nodeWriter(task, extra, attempts > 1 ? note : undefined)
        : await nodeConcept(task, extra, attempts > 1 ? note : undefined);
      output = res.output;
      degraded = degraded || res.degraded;
      pushStep(branch, task + (extra ? ' | ' + extra : ''), output, Date.now() - t0, res.degraded);

      // Критик проверяет результат ветки
      t0 = Date.now();
      const crit = await nodeCritic(task, output);
      score = crit.score;
      note = crit.note;
      pushStep('critic', output.slice(0, 100), `score=${score}; ${note}`, Date.now() - t0, crit.degraded);

      if (score >= 7 || attempts >= 2) break;

      // Ребро самокоррекции: critic → writer/concept
      correctionLoops++;
      branchDecisions.push(`Критик: score ${score}/10 < 7 → ребро самокоррекции назад в узел «${branch === 'writer' ? 'Сценарист' : 'Концепт-художник'}» (попытка ${attempts + 1}).`);
    }
    if (score >= 7) {
      branchDecisions.push(`Критик: score ${score}/10 ≥ 7 → результат принят, ребро к узлу «Дирижёр».`);
    }
    return { output, score, note };
  };

  let totalScore = 0;
  let scoreCount = 0;

  if (analysis.kind === 'narrative' || analysis.kind === 'mixed') {
    const r = await runBranch('writer', '');
    branchOutputs.push(`Сценарная ветка: ${r.output}`);
    totalScore += r.score;
    scoreCount++;
  }
  if (analysis.kind === 'visual' || analysis.kind === 'mixed') {
    const extra = analysis.kind === 'mixed' ? branchOutputs[0] : '';
    const r = await runBranch('concept', extra);
    branchOutputs.push(`Визуальная ветка: ${r.output}`);
    totalScore += r.score;
    scoreCount++;
  }

  const finalScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  // 4. Дирижёр
  t0 = Date.now();
  const dir = await nodeDirector(task, branchOutputs, finalScore);
  pushStep('director', branchOutputs.join(' | ').slice(0, 200), dir.output, Date.now() - t0, dir.degraded);

  return {
    ok: true,
    task,
    analysis: {
      kind: analysis.kind,
      kindLabel,
      notes: analysis.notes,
      degraded: analysis.degraded,
    },
    path,
    steps,
    branchDecisions,
    correctionLoops,
    final: dir.output,
    score: finalScore,
    totalMs: Date.now() - routeStart,
    tokens: totalTokens,
  };
}
