// ============================================================
// ФОРТОРИУМ v5.1 — Луп-инженеринг, Граф-инженеринг и Вложенные лупы
// Типы ядра цикла (План → Действие → Наблюдение → Коррекция)
// Философия: память живёт в ФАЙЛАХ, а не в диалоге.
// Каждый агент — "чистый": нулевой контекст, читает только файлы.
// v5.1: связка с демо-режимом (initialDraft из сцены) + мета-луп над дочерними лупами
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
  initialDraft?: string;      // v5.1: стартовый текст (например, текущая сцена из демо-режима) — цикл дорабатывает его
  source?: 'demo-scene' | 'manual' | 'meta-child'; // откуда пришла задача
  sourceLabel?: string;       // человекочитаемая метка источника ("Сцена №3 «Ночной город»")
  sceneRef?: SceneRef;        // v6.2: структурная связка со сценой демо-режима (попадает в экспорт сборки)
}

// v6.2: происхождение задачи — ссылка на сцену демо-режима (для трассировки сборок)
export interface SceneRef {
  sceneNumber: number;
  sceneTitle: string;
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

// ---------- Вложенные лупы (v5.1): мета-луп над дочерними лупами ----------
// Мета-луп = надзиратель: сам текст не пишет. Его витки:
//   План      — разбить глобальную цель на подцели (по одной на дочерний луп)
//   Действие  — продвинуть каждый дочерний луп на один виток
//   Наблюдение— агрегировать баллы, долги и черновики детей
//   Коррекция — мета-критик решает: продолжать / перезапустить слабого ребёнка / собрать финал
// Внутренний круг — ИИ (дочерние лупы крутятся сами), внешний круг — человек (ворота мета-лупа).

// Слот дочернего лупа внутри мета-лупа
export interface ChildLoopSlot {
  index: number;               // порядковый номер ребёнка
  childRunId: string;          // id дочернего run'а (файлы лежат отдельно)
  subGoal: string;             // подцель, назначенная мета-планировщиком
  status: LoopStatus | 'not_created'; // статус дочернего цикла
  reformulations: number;      // сколько раз мета-луп переформулировал подцель и перезапускал ребёнка
  needsRestart: boolean;       // флаг: ребёнок провалился, на следующем мета-витке перезапустить
  restartReason: string | null;
  lastScore: number;           // последний балл ребёнка
}

// План мета-витка: стратегия надзирателя
export interface MetaPlan {
  strategy: string;            // общая стратегия мета-витка
  subGoals: string[];          // подцели для детей (при первичном планировании или переформулировке)
  decision: 'continue' | 'restart_weak' | 'finish';
  notes: string;
  degraded?: boolean;
}

// Результат ребёнка за мета-виток (агрегированное наблюдение)
export interface MetaChildSnapshot {
  index: number;
  childRunId: string;
  subGoal: string;
  status: string;
  score: number;
  iterations: number;
  tokens: number;
  bestDraft: string | null;
  steppedThisIteration: boolean;
}

// Запись одного мета-витка
export interface MetaIterationRecord {
  n: number;
  plan: MetaPlan | null;
  children: MetaChildSnapshot[];
  assembly: string | null;     // черновая сборка из лучших черновиков детей
  critique: Critique | null;   // вердикт мета-критика над сборкой
  decision: string;            // что решил надзиратель
  tokens: number;              // токены мета-уровня (план/критика/сборка) за этот виток
  ms: number;
  timestamp: number;
}

// Задача мета-лупа
export interface MetaTask {
  goal: string;                        // глобальная цель (что должен достичь надзиратель)
  artifactType: ArtifactType;          // тип артефакта каждого ребёнка
  childCount: number;                  // сколько дочерних лупов (2-4)
  maxMetaIterations: number;           // стоп-критерий мета-уровня: лимит мета-витков (1-4)
  childMaxIterations: number;          // лимит витков каждого ребёнка
  childQualityThreshold: number;       // порог качества каждого ребёнка
  metaQualityThreshold: number;        // порог качества финальной сборки
  maxTokens: number;                   // общий бюджет в токенах (дети + мета-уровень)
  autoMode: boolean;                   // ворота одобрения после каждого мета-витка
  sceneRef?: SceneRef;                 // v6.2: связка со сценой демо-режима (для трассировки сборок)
}

export type MetaStatus =
  | 'ready'
  | 'running'
  | 'waiting_approval'
  | 'done'
  | 'stopped'
  | 'limit_reached'
  | 'budget_exceeded'
  | 'error';

// Состояние мета-лупа — живёт в файле meta-state.json
export interface MetaState {
  metaRunId: string;
  task: MetaTask;
  children: ChildLoopSlot[];
  metaIteration: number;              // последний завершённый мета-виток
  status: MetaStatus;
  stopReason: string | null;
  assembly: string | null;            // последняя сборка
  bestAssembly: string | null;        // лучшая сборка за историю
  bestAssemblyScore: number;
  debts: DebtReport;                  // агрегированные долги (дети + мета-уровень)
  history: MetaIterationRecord[];
  created: number;
  updated: number;
}

// Ответ API /api/loop/meta
export interface MetaStepResponse {
  ok: boolean;
  error?: string;
  state?: MetaState;
  record?: MetaIterationRecord;
  stopDecision?: { stopped: boolean; reason: string; detail: string };
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
