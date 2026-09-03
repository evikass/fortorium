// ============================================================
// ФОРТОРИУМ v5.0 — Луп-инженеринг и Граф-инженеринг
// Типы ядра цикла (План → Действие → Наблюдение → Коррекция)
// Философия: память живёт в ФАЙЛАХ, а не в диалоге.
// Каждый агент — "чистый": нулевой контекст, читает только файлы.
// ============================================================

// Тип артефакта, который производит цикл
export type ArtifactType = 'logline' | 'scene' | 'synopsis';

// Задача для лупа
export interface LoopTask {
  goal: string;               // цель цикла (что нужно достичь)
  artifactType: ArtifactType; // тип артефакта
  maxIterations: number;      // стоп-критерий №1: лимит витков
  qualityThreshold: number;   // стоп-критерий №2: порог качества (0-10)
  maxTokens: number;          // стоп-критерий №3: бюджет в токенах
  autoMode: boolean;          // true = цикл без остановок (внешний круг отключён)
}

// Результат детерминированной скрипт-проверки
export interface ScriptCheck {
  name: string;
  passed: boolean;
  message: string;
}

// Вердикт LLM-критика
export interface Critique {
  score: number;                                    // 0-10
  verdict: 'accept' | 'redo';                       // принять / переделать
  strengths: string;                                // что хорошо
  weaknesses: string;                               // что плохо
  improvements: string;                             // что улучшить в следующем витке
  degraded?: boolean;                               // true = критик-фоллбэк (без LLM)
}

// План витка от агента-планировщика
export interface LoopPlan {
  focus: string;          // на чём сосредоточиться
  changes: string[];      // конкретные изменения
  notes: string;          // заметки исполнителю
  degraded?: boolean;     // true = фоллбэк-план без LLM
}

// "Три долга" луп-инженеринга (цена автономности)
export interface DebtReport {
  tokens: number;        // долг по токенам: накопленный расход
  moneyRub: number;      // тот же долг в условных рублях (демо-тариф)
  timeMs: number;        // долг по времени: суммарный латенси
  techDebt: number;      // технический долг: 0-100%
  retries: number;       // сколько витков переделано человеком/циклом
  failedChecks: number;  // сколько скрипт-проверок провалено за историю
}

// Полная запись одного витка цикла
export interface IterationRecord {
  n: number;                       // номер витка
  attempt: number;                 // попытка этого витка (1 = первая, 2+ = переделки)
  plan: LoopPlan | null;           // план от планировщика
  draft: string;                   // черновик артефакта от исполнителя
  scriptChecks: ScriptCheck[];     // детерминированные проверки
  critique: Critique | null;       // вердикт критика
  tokens: number;                  // токены, потраченные на виток
  ms: number;                      // время витка
  degraded: boolean;               // работа в оффлайн-режиме
  timestamp: number;               // когда записан
}

// Статус цикла
export type LoopStatus =
  | 'ready'             // создан, ни одного витка
  | 'running'           // виток выполняется
  | 'waiting_approval'  // ворота одобрения: ждём решения человека (внешний круг)
  | 'done'              // достигнут порог качества
  | 'stopped'           // остановлен человеком
  | 'limit_reached'     // лимит витков исчерпан
  | 'budget_exceeded'   // бюджет токенов исчерпан
  | 'error';

// Состояние цикла — ТО, ЧТО ПЕРЕДАЁТСЯ ЧЕРЕЗ ФАЙЛ МЕЖДУ АГЕНТАМИ
export interface LoopState {
  runId: string;
  task: LoopTask;
  iteration: number;               // последний завершённый виток
  attempt: number;                 // текущая попытка витка
  status: LoopStatus;
  stopReason: string | null;       // почему цикл остановился
  bestScore: number;               // лучший балл за историю
  bestDraft: string | null;        // лучший черновик
  lastCritique: Critique | null;   // последняя критика (вход для планировщика)
  debts: DebtReport;               // три долга
  iterations: IterationRecord[];   // история витков
  created: number;
  updated: number;
}

// Ответ API /api/loop на шаг цикла
export interface LoopStepResponse {
  ok: boolean;
  error?: string;
  state?: LoopState;
  iteration?: IterationRecord;
  stopDecision?: {
    stopped: boolean;
    reason: string;
    detail: string;
  };
}

// ---------- Граф-инженеринг (будущее: ветвящиеся графы агентов) ----------

export type GraphNodeId = 'analyst' | 'router' | 'writer' | 'concept' | 'critic' | 'director';

export interface GraphNodeInfo {
  id: GraphNodeId;
  name: string;
  icon: string;
  description: string;
  x: number;  // координаты для SVG-визуализации
  y: number;
}

export interface GraphEdgeInfo {
  from: GraphNodeId;
  to: GraphNodeId;
  label: string;
  condition: string;   // условие, по которому маршрутизатор выбирает ребро
}

export interface GraphTraceStep {
  node: GraphNodeId;
  nodeName: string;
  icon: string;
  inputSummary: string;
  outputSummary: string;
  outputFull: string;
  ms: number;
  tokens: number;
  degraded: boolean;
}

export interface GraphRouteResult {
  ok: boolean;
  error?: string;
  task: string;
  analysis: {
    kind: 'narrative' | 'visual' | 'mixed';
    kindLabel: string;
    notes: string;
    degraded: boolean;
  };
  path: GraphNodeId[];          // фактический путь по графу
  steps: GraphTraceStep[];      // трассировка узлов
  branchDecisions: string[];    // решения маршрутизатора на развилках
  correctionLoops: number;      // сколько рёбер самокоррекции сработало
  final: string;                // финальная сборка дирижёра
  score: number;                // оценка критика
  totalMs: number;
  tokens: number;
}

// Промпты-инструкции для исполнителя по типу артефакта
export const ARTIFACT_INSTRUCTIONS: Record<ArtifactType, string> = {
  logline: 'Логлайн мультфильма: 1-3 предложения, интригующая завязка + эмоциональный посыл + намёк на конфликт.',
  scene: 'Описание одной сцены: локация, время суток, действие, атмосферные детали, 1-2 реплики диалога, настроение.',
  synopsis: 'Синопсис истории: 5-8 предложений, завязка-развитие-кульминация-развязка, главные герои и конфликт.',
};

export const ARTIFACT_LABELS: Record<ArtifactType, string> = {
  logline: 'Логлайн',
  scene: 'Сцена',
  synopsis: 'Синопсис',
};

// Демо-тариф: условные рубли за 1000 токенов (для наглядности долга по деньгам)
export const DEMO_RUB_PER_1K_TOKENS = 2.5;
