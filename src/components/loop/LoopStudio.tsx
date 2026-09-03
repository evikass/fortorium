'use client';

// ============================================================
// ФОРТОРИУМ v6.0 — Вкладка LOOP
// Луп-инженеринг: цикл План → Действие → Наблюдение → Коррекция.
// Реализует ключевые идеи видео:
//  • Чистые агенты с нулевым контекстом и файловой памятью (v6.0: Vercel Blob — персистентно)
//  • 3 обязательных условия: стоп-критерии, песочница, валидатор
//  • Три долга (токены/деньги, время, техдолг) в реальном времени
//  • Правило внутреннего/внешнего круга (ворота одобрения)
//  • Граф-инженеринг как следующий уровень
//  • Шкала делегирования: человек — Дирижёр оркестра
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoopStepResponse, LoopState, STATUS_LABELS, ArtifactType } from './types';
import { ARTIFACT_LABELS } from '@/lib/loop/types';
import IterationCard from './IterationCard';
import DebtMeters from './DebtMeters';
import MemoryViewer from './MemoryViewer';
import GraphView from './GraphView';
import DelegationScale from './DelegationScale';
import NestedLoops from './NestedLoops';

type SubTab = 'loop' | 'nested' | 'graph' | 'scale';

// Запрос из демо-режима: прогнать сцену через луп
export interface SceneLoopRequest {
  mode: 'single' | 'meta';                       // одиночный цикл или вложенный луп
  sceneNumber: number;
  sceneTitle: string;
  goal: string;                                  // цель, собранная из сцены
  initialDraft: string;                          // текущий текст сцены — цикл ДОРАБАТЫВАЕТ его
  applyDraft: (draft: string) => void;           // обратная запись результата в сцену демо-режима
}

const EXAMPLE_GOALS = [
  'Логлайн для мультфильма про робота, который научился мечтать',
  'Открытая сцена: ночной город, грустный лисёнок и фонарь',
  'Синопсис истории о дружбе ежика и облака',
];

export default function LoopStudio({
  sceneRequest,
  onConsumeSceneRequest,
}: {
  sceneRequest?: SceneLoopRequest | null;
  onConsumeSceneRequest?: () => void;
} = {}) {
  const [subTab, setSubTab] = useState<SubTab>('loop');

  // Активная связка со сценой демо-режима (только для одиночного цикла)
  const [activeScene, setActiveScene] = useState<SceneLoopRequest | null>(null);

  // Форма задачи
  const [goal, setGoal] = useState('');
  const [artifactType, setArtifactType] = useState<ArtifactType>('logline');
  const [maxIterations, setMaxIterations] = useState(3);
  const [qualityThreshold, setQualityThreshold] = useState(8);
  const [maxTokens, setMaxTokens] = useState(30000);
  const [autoMode, setAutoMode] = useState(false);

  // Состояние цикла
  const [state, setState] = useState<LoopState | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stopInfo, setStopInfo] = useState<{ reason: string; detail: string } | null>(null);
  const autoAborted = useRef(false);

  // v5.1: запрос из демо-режима — предзаполняем задачу сценой и открываем нужную подвкладку
  useEffect(() => {
    if (sceneRequest) {
      if (sceneRequest.mode === 'single') {
        setSubTab('loop');
        setActiveScene(sceneRequest);
        setGoal(sceneRequest.goal);
        setArtifactType('scene');
      } else {
        setSubTab('nested');
      }
      setError(null);
      setStopInfo(null);
    }
  }, [sceneRequest]);

  const consumeSceneRequest = () => {
    setActiveScene(null);
    onConsumeSceneRequest?.();
  };

  // ---- API ----
  const call = useCallback(async (body: Record<string, unknown>): Promise<LoopStepResponse> => {
    const res = await fetch('/api/loop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }, []);

  const createRun = async () => {
    if (!goal.trim()) return;
    setError(null);
    setStopInfo(null);
    setBusy(true);
    autoAborted.current = false;
    const json = await call({
      action: 'init',
      task: {
        goal, artifactType, maxIterations, qualityThreshold, maxTokens, autoMode,
        // v5.1: связка со сценой демо-режима — цикл стартует из её текста
        initialDraft: activeScene?.initialDraft,
        source: activeScene ? 'demo-scene' : 'manual',
        sourceLabel: activeScene ? `Сцена №${activeScene.sceneNumber} «${activeScene.sceneTitle}»` : undefined,
      },
    });
    if (json.ok && json.state) {
      setState(json.state);
      // Автопрогон: цикл крутится сам, пока статус running (autoMode)
      if (autoMode) {
        setAutoRunning(true);
        let current = json.state;
        while (current.status === 'running' && !autoAborted.current) {
          await new Promise((r) => setTimeout(r, 600));
          const step = await call({ action: 'step', runId: current.runId });
          if (step.ok && step.state) {
            current = step.state;
            setState(current);
            if (step.stopDecision) setStopInfo(step.stopDecision);
          } else {
            setError(step.error || 'Ошибка витка');
            break;
          }
        }
        setAutoRunning(false);
      }
    } else {
      setError(json.error || 'Не удалось создать цикл');
    }
    setBusy(false);
  };

  const runStep = async (redo = false) => {
    if (!state || busy) return;
    setError(null);
    setBusy(true);
    const json = await call({ action: 'step', runId: state.runId, redo });
    if (json.ok && json.state) {
      setState(json.state);
      setStopInfo(json.stopDecision || null);
    } else {
      setError(json.error || 'Ошибка витка');
    }
    setBusy(false);
  };

  const decide = async (decision: 'accept' | 'stop') => {
    if (!state || busy) return;
    setBusy(true);
    const json = await call({ action: decision, runId: state.runId });
    if (json.ok && json.state) {
      setState(json.state);
      if (decision === 'stop') {
        setStopInfo({ reason: 'stopped_by_human', detail: json.state.stopReason || 'Остановлено человеком' });
      }
    } else {
      setError(json.error || 'Ошибка решения');
    }
    setBusy(false);
  };

  const resetRun = async () => {
    if (!state) return;
    autoAborted.current = true;
    await fetch('/api/loop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset', runId: state.runId }),
    });
    setState(null);
    setStopInfo(null);
    setError(null);
    consumeSceneRequest();
  };

  const status = state ? STATUS_LABELS[state.status] : null;
  const canDecide = state?.status === 'waiting_approval';
  const isFinished = state && ['done', 'stopped', 'limit_reached', 'budget_exceeded'].includes(state.status);
  const latest = state && state.iterations.length > 0 ? state.iterations[state.iterations.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* Заголовок вкладки */}
      <div>
        <h3 className="text-xl font-bold text-white mb-1">♾️ Луп-инженеринг</h3>
        <p className="text-white/50 text-sm">
          Этап 4 эволюции: ИИ работает в цикле <b className="text-white/70">План → Действие → Наблюдение → Новый план</b>.
          Память — через файлы, агенты — чистые, остановка — по чётким критериям.
        </p>
      </div>

      {/* Под-вкладки */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit flex-wrap">
        {([
          { id: 'loop', label: '♾️ Цикл' },
          { id: 'nested', label: '🪆 Вложенные лупы' },
          { id: 'graph', label: '🕸️ Граф' },
          { id: 'scale', label: '📊 Шкала делегирования' },
        ] as Array<{ id: SubTab; label: string }>).map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              subTab === t.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------- ПОДВКЛАДКА: ЦИКЛ ---------- */}
      {subTab === 'loop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Левая колонка: постановка задачи + 3 условия */}
          <div className="space-y-4">
            {/* Связка со сценой демо-режима (v5.1) */}
            {activeScene && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs">
                    <div className="text-cyan-300 font-semibold mb-0.5">🔗 Связано со сценой демо-режима</div>
                    <div className="text-white/70">
                      Сцена №{activeScene.sceneNumber} «{activeScene.sceneTitle}» — цикл стартует
                      с её текущего текста (initialDraft), а лучший результат можно вернуть в сцену.
                    </div>
                  </div>
                  <button
                    onClick={consumeSceneRequest}
                    className="text-white/40 hover:text-white text-xs flex-shrink-0"
                    title="Отвязать сцену"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">🎯 Постановка задачи цикла</CardTitle>
                <CardDescription className="text-white/50 text-xs">
                  Задача человека — спроектировать границы цикла и правила остановки
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-white/70 text-xs mb-1 block">Цель цикла</label>
                  <Input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Что должен достичь цикл…"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {EXAMPLE_GOALS.map((g, i) => (
                      <button
                        key={i}
                        onClick={() => setGoal(g)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition"
                      >
                        пример {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/70 text-xs mb-1 block">Тип артефакта</label>
                  <div className="flex gap-1">
                    {(Object.keys(ARTIFACT_LABELS) as ArtifactType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setArtifactType(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition border ${
                          artifactType === t
                            ? 'bg-purple-500/30 border-purple-400/50 text-purple-200'
                            : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                        }`}
                      >
                        {ARTIFACT_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Стоп-критерии — условие №1 */}
                <div className="pt-1">
                  <div className="text-white/70 text-xs font-semibold mb-2">
                    🛑 Стоп-критерии <span className="text-white/30 font-normal">(условие №1 из видео)</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 text-xs w-36 flex-shrink-0">Макс. витков</span>
                      <Input
                        type="number" min={1} max={10}
                        value={maxIterations}
                        onChange={(e) => setMaxIterations(Number(e.target.value))}
                        className="bg-white/5 border-white/10 text-white h-8 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 text-xs w-36 flex-shrink-0">Порог качества (0-10)</span>
                      <Input
                        type="number" min={1} max={10}
                        value={qualityThreshold}
                        onChange={(e) => setQualityThreshold(Number(e.target.value))}
                        className="bg-white/5 border-white/10 text-white h-8 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 text-xs w-36 flex-shrink-0">Бюджет, токенов</span>
                      <Input
                        type="number" min={1000} max={500000} step={1000}
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(Number(e.target.value))}
                        className="bg-white/5 border-white/10 text-white h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Авто-режим — переключатель внешнего круга */}
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={autoMode}
                    onChange={(e) => setAutoMode(e.target.checked)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <span className="text-xs">
                    <span className="text-white/70 group-hover:text-white">Авто-режим без остановок</span>
                    <span className="text-amber-400/80 block text-[11px]">
                      ⚠️ Отключает ворота одобрения — внешний круг не контролирует витки
                    </span>
                  </span>
                </label>

                <div className="flex gap-2 pt-1">
                  {!state || isFinished ? (
                    <Button
                      onClick={createRun}
                      disabled={busy || !goal.trim() || autoRunning}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white"
                    >
                      {busy ? <span className="animate-pulse">Создание…</span> : '▶ Запустить цикл'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => runStep(false)}
                        disabled={busy || autoRunning || canDecide || !!isFinished}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white"
                      >
                        {busy ? 'Виток идёт…' : '▶ Один виток'}
                      </Button>
                      <Button
                        onClick={resetRun}
                        disabled={busy || autoRunning}
                        variant="outline"
                        className="border-white/20 text-white/70 hover:text-white"
                      >
                        ⟲ Сброс
                      </Button>
                    </>
                  )}
                </div>

                {autoRunning && (
                  <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    <span className="text-amber-300 text-xs animate-pulse">♾️ Цикл крутится автономно…</span>
                    <button
                      onClick={() => { autoAborted.current = true; }}
                      className="text-amber-300 text-xs underline hover:text-amber-200"
                    >
                      прервать наблюдение
                    </button>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-2 text-xs">{error}</div>
                )}
              </CardContent>
            </Card>

            {/* Три обязательных условия */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">✅ 3 обязательных условия (00:21:06)</CardTitle>
                <CardDescription className="text-white/50 text-xs">
                  Иначе цикл сломает систему — проверьте перед запуском
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <div>
                    <div className="text-white/80 font-medium">Чёткий критерий остановки</div>
                    <div className="text-white/50">лимит {maxIterations} витков · порог {qualityThreshold}/10 · бюджет {maxTokens.toLocaleString('ru-RU')} ток.</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <div>
                    <div className="text-white/80 font-medium">Безопасная среда (песочница)</div>
                    <div className="text-white/50">цикл пишет только в файлы памяти проекта (v6.0: в Vercel Blob — переживают деплои) — никаких писем, платежей и продакшена</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <div>
                    <div className="text-white/80 font-medium">Валидатор</div>
                    <div className="text-white/50">двойной барьер: скрипт-проверки + независимый LLM-критик</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Три долга */}
            {state && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-4">
                  <DebtMeters
                    debts={state.debts}
                    maxTokens={state.task.maxTokens}
                    iterations={state.iterations.length}
                    maxIterations={state.task.maxIterations}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Правая колонка: журнал витков + результат + память */}
          <div className="lg:col-span-2 space-y-4">
            {/* Статус */}
            {state && status && (
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${status.color}`}>
                  {status.label}
                </span>
                <span className="text-white/40 text-xs font-mono">{state.runId}</span>
                {state.task.autoMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ⚠️ авто-режим: внешний круг отключён
                  </span>
                )}
              </div>
            )}

            {/* Причина остановки */}
            {stopInfo && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
                <div className="text-cyan-300 text-xs font-semibold mb-1">🛑 Критерий остановки сработал</div>
                <div className="text-white/70 text-sm">{stopInfo.detail}</div>
              </div>
            )}

            {/* Лучший результат */}
            {state?.bestDraft && (
              <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base">🏆 Лучший черновик цикла</CardTitle>
                    <span className="text-green-300 font-bold">{state.bestScore}/10</span>
                  </div>
                  <CardDescription className="text-white/50 text-xs">
                    {ARTIFACT_LABELS[state.task.artifactType]} · цель: {state.task.goal}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-white/85 text-sm whitespace-pre-wrap leading-relaxed">{state.bestDraft}</p>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[11px] text-white/40">
                      👤 Решение о «публикации» — за человеком (внешний круг). ИИ предлагает, человек утверждает.
                    </div>
                    {activeScene && isFinished && (
                      <Button
                        onClick={() => {
                          activeScene.applyDraft(state.bestDraft || '');
                          consumeSceneRequest();
                        }}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white text-xs h-8"
                      >
                        ↩ Вернуть улучшенный текст в сцену №{activeScene.sceneNumber}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Журнал витков */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-2">
                🔁 Журнал витков {state ? `(${state.iterations.length})` : ''}
              </h4>
              {state && state.iterations.length > 0 ? (
                <div className="space-y-2">
                  {state.iterations.map((rec, idx) => (
                    <IterationCard
                      key={`${rec.n}-${rec.attempt}`}
                      record={rec}
                      isLatest={idx === state.iterations.length - 1}
                      canDecide={canDecide && idx === state.iterations.length - 1 && !busy}
                      onAccept={() => decide('accept')}
                      onRedo={() => runStep(true)}
                      onStop={() => decide('stop')}
                      deciding={busy}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-white/40 text-sm p-6 border border-dashed border-white/10 rounded-xl text-center">
                  Витков ещё нет. Опишите цель слева и нажмите «Запустить цикл» —
                  планировщик, исполнитель и критик начнут цикл с чистого листа.
                </div>
              )}
            </div>

            {/* Файловая память */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4">
                <MemoryViewer runId={state?.runId || null} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ---------- ПОДВКЛАДКА: ВЛОЖЕННЫЕ ЛУПЫ (v5.1) ---------- */}
      {subTab === 'nested' && (
        <NestedLoops
          sceneRequest={
            sceneRequest && sceneRequest.mode === 'meta'
              ? {
                  sceneNumber: sceneRequest.sceneNumber,
                  sceneTitle: sceneRequest.sceneTitle,
                  goal: sceneRequest.goal,
                  applyDraft: sceneRequest.applyDraft,
                }
              : null
          }
        />
      )}

      {/* ---------- ПОДВКЛАДКА: ГРАФ ---------- */}
      {subTab === 'graph' && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <GraphView />
          </CardContent>
        </Card>
      )}

      {/* ---------- ПОДВКЛАДКА: ШКАЛА ---------- */}
      {subTab === 'scale' && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <DelegationScale />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
