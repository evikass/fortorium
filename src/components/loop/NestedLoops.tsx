'use client';

// ============================================================
// ФОРТОРИУМ v6.0 — Подвкладка «Вложенные лупы» (луп над лупом)
// Мета-луп = надзиратель: сам текст не пишет, а управляет дочерними лупами.
//   План → дети делают по витку → агрегация → мета-критик решает: продолжать /
//   перезапустить слабого ребёнка / собрать финал.
// Внутренний круг — ИИ (дети автономны), внешний круг — человек (ворота мета-лупа).
// v6.0: живое SVG-дерево вложенности (MetaLoopTree) + персистентная память Vercel Blob.
// v6.1: экспорт сборки надзирателя — портативный JSON-документ + Markdown-паспорт (GET ?export=json|md).
// v6.2: импорт сборки — воспроизведение мета-run из JSON (восстанавливаются файлы памяти мета-лупа и всех детей).
// v6.3: публикация сборки надзирателя в галерею + приём run-а, восстановленного из галереи (restoredMeta).
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MetaStepResponse, MetaState, STATUS_LABELS, ArtifactType } from './types';
import { ARTIFACT_LABELS } from '@/lib/loop/types';
import DebtMeters from './DebtMeters';
import MetaLoopTree from './MetaLoopTree';

// Запрос из демо-режима: улучшить сцену через вложенный луп (развёртывание в микросцены)
export interface MetaSceneRequest {
  sceneNumber: number;
  sceneTitle: string;
  goal: string;
  applyDraft: (draft: string) => void;
  onRunCreated?: (info: { kind: 'single' | 'meta'; runId: string }) => void; // v6.2: демо запоминает run для экспорта с карточки сцены
}

const EXAMPLE_GOALS = [
  'Эпизод «Мурзик находит ракету»: развить в последовательность микросцен с эскалацией',
  'Развернуть сцену погони в полный эпизод: завязка, развитие, кульминация, развязка',
];

export default function NestedLoops({
  sceneRequest,
  restoredMeta,
  onRestoredMetaConsumed,
}: {
  sceneRequest?: MetaSceneRequest | null;
  // v6.3: мета-run, восстановленный из галереи сборок (LoopStudio передаёт состояние из импорта)
  restoredMeta?: Record<string, unknown> | null;
  onRestoredMetaConsumed?: () => void;
}) {
  // Форма задачи
  const [goal, setGoal] = useState('');
  const [artifactType, setArtifactType] = useState<ArtifactType>('scene');
  const [childCount, setChildCount] = useState(3);
  const [maxMetaIterations, setMaxMetaIterations] = useState(2);
  const [childMaxIterations, setChildMaxIterations] = useState(2);
  const [childQualityThreshold, setChildQualityThreshold] = useState(7);
  const [metaQualityThreshold, setMetaQualityThreshold] = useState(8);
  const [maxTokens, setMaxTokens] = useState(90000);
  const [autoMode, setAutoMode] = useState(true);

  // Состояние мета-лупа
  const [meta, setMeta] = useState<MetaState | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stopInfo, setStopInfo] = useState<{ reason: string; detail: string } | null>(null);
  const [expandedChild, setExpandedChild] = useState<number | null>(null);
  const autoAborted = useRef(false);
  const importFileRef = useRef<HTMLInputElement>(null); // v6.2: импорт сборки надзирателя из JSON

  // v6.3: галерея сборок
  const [pubNote, setPubNote] = useState<string | null>(null);
  const [galleryBusy, setGalleryBusy] = useState(false);

  // v6.3: публикация сборки надзирателя в галерею (upsert по metaRunId).
  // Как и в одиночном цикле — через ДОКУМЕНТ: сначала /api/loop/meta?export=json
  // (свой роут видит свою память на эфемерном хранилище), затем POST doc в галерею.
  const publishMetaRun = async () => {
    if (!meta || galleryBusy) return;
    setPubNote(null);
    setGalleryBusy(true);
    try {
      const docRes = await fetch(`/api/loop/meta?metaRunId=${meta.metaRunId}&export=json`);
      const doc = await docRes.json();
      if (!doc || doc.format !== 'fortorium-supervisor-assembly') {
        throw new Error('Не удалось получить сборку надзирателя для публикации');
      }
      const res = await fetch('/api/loop/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc }),
      });
      const json = await res.json();
      setPubNote(json.ok ? (json.note || 'Опубликовано в галерее') : (json.error || 'Не удалось опубликовать'));
    } catch (e) {
      setPubNote(`Ошибка публикации: ${e instanceof Error ? e.message : String(e)}`);
    }
    setGalleryBusy(false);
  };

  // Связка с демо-режимом: предзаполнение при поступлении запроса
  useEffect(() => {
    if (sceneRequest) {
      setGoal(sceneRequest.goal);
      setArtifactType('scene');
      setError(null);
      setStopInfo(null);
    }
  }, [sceneRequest]);

  // v6.3: мета-run, восстановленный из галереи, — открываем его и заполняем форму задачи
  useEffect(() => {
    if (restoredMeta) {
      const m = restoredMeta as unknown as MetaState;
      setMeta(m);
      setGoal(m.task?.goal || '');
      setArtifactType(m.task?.artifactType || 'scene');
      setChildCount(m.task?.childCount || 3);
      setMaxMetaIterations(m.task?.maxMetaIterations || 2);
      setChildMaxIterations(m.task?.childMaxIterations || 2);
      setChildQualityThreshold(m.task?.childQualityThreshold || 7);
      setMetaQualityThreshold(m.task?.metaQualityThreshold || 8);
      setMaxTokens(m.task?.maxTokens || 90000);
      setAutoMode(Boolean(m.task?.autoMode));
      setError(null);
      setStopInfo(null);
      onRestoredMetaConsumed?.();
    }
  }, [restoredMeta, onRestoredMetaConsumed]);

  // ---- API ----
  const call = useCallback(async (body: Record<string, unknown>): Promise<MetaStepResponse> => {
    const res = await fetch('/api/loop/meta', {
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
        goal, artifactType, childCount, maxMetaIterations,
        childMaxIterations, childQualityThreshold, metaQualityThreshold,
        maxTokens, autoMode,
        // v6.2: структурная ссылка на сцену — попадает в экспорт сборки надзирателя
        sceneRef: sceneRequest ? { sceneNumber: sceneRequest.sceneNumber, sceneTitle: sceneRequest.sceneTitle } : undefined,
      },
    });
    if (json.ok && json.state) {
      setMeta(json.state);
      // v6.2: сообщаем демо-режиму runId — на карточке сцены появится ссылка на экспорт сборки
      sceneRequest?.onRunCreated?.({ kind: 'meta', runId: json.state.metaRunId });
      if (autoMode) {
        setAutoRunning(true);
        let current = json.state;
        while (current.status === 'running' && !autoAborted.current) {
          await new Promise((r) => setTimeout(r, 600));
          const step = await call({ action: 'step', metaRunId: current.metaRunId });
          if (step.ok && step.state) {
            current = step.state;
            setMeta(current);
            if (step.stopDecision) setStopInfo(step.stopDecision);
          } else {
            setError(step.error || 'Ошибка мета-витка');
            break;
          }
        }
        setAutoRunning(false);
      }
    } else {
      setError(json.error || 'Не удалось создать мета-луп');
    }
    setBusy(false);
  };

  const runStep = async () => {
    if (!meta || busy) return;
    setError(null);
    setBusy(true);
    const json = await call({ action: 'step', metaRunId: meta.metaRunId });
    if (json.ok && json.state) {
      setMeta(json.state);
      setStopInfo(json.stopDecision || null);
    } else {
      setError(json.error || 'Ошибка мета-витка');
    }
    setBusy(false);
  };

  const decide = async (decision: 'accept' | 'stop') => {
    if (!meta || busy) return;
    setBusy(true);
    const json = await call({ action: decision, metaRunId: meta.metaRunId });
    if (json.ok && json.state) {
      setMeta(json.state);
      if (decision === 'stop') {
        setStopInfo({ reason: 'stopped_by_human', detail: json.state.stopReason || 'Остановлено человеком' });
      }
    } else {
      setError(json.error || 'Ошибка решения');
    }
    setBusy(false);
  };

  const resetRun = async () => {
    if (!meta) return;
    autoAborted.current = true;
    await fetch('/api/loop/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset', metaRunId: meta.metaRunId }),
    });
    setMeta(null);
    setStopInfo(null);
    setError(null);
  };

  // v6.2: импорт сборки надзирателя — воспроизведение мета-run из экспортного JSON.
  // Восстанавливаются файлы памяти мета-лупа И всех детей: состояние агента это его файлы.
  const importAssembly = async (file: File) => {
    setError(null);
    setStopInfo(null);
    setBusy(true);
    try {
      const doc = JSON.parse(await file.text());
      const res = await fetch('/api/loop/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', doc }),
      });
      const json = await res.json();
      if (json.ok && json.state) {
        setMeta(json.state);
        // Подставляем параметры задачи в форму — надзирателя можно продолжить
        setGoal(json.state.task.goal);
        setArtifactType(json.state.task.artifactType);
        setChildCount(json.state.task.childCount);
        setMaxMetaIterations(json.state.task.maxMetaIterations);
        setChildMaxIterations(json.state.task.childMaxIterations);
        setChildQualityThreshold(json.state.task.childQualityThreshold);
        setMetaQualityThreshold(json.state.task.metaQualityThreshold);
        setMaxTokens(json.state.task.maxTokens);
        setAutoMode(json.state.task.autoMode);
      } else {
        setError(json.error || 'Не удалось импортировать сборку');
      }
    } catch (e) {
      setError(`Импорт не удался: ${e instanceof Error ? e.message : String(e)}`);
    }
    setBusy(false);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const status = meta ? STATUS_LABELS[meta.status] : null;
  const canDecide = meta?.status === 'waiting_approval';
  const isFinished = meta && ['done', 'stopped', 'limit_reached', 'budget_exceeded'].includes(meta.status);
  const latestRecord = meta && meta.history.length > 0 ? meta.history[meta.history.length - 1] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Левая колонка: постановка задачи */}
      <div className="space-y-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">🪆 Глобальная задача надзирателя</CardTitle>
            <CardDescription className="text-white/50 text-xs">
              Мета-луп не пишет текст сам — он разбивает цель на подцели и управляет дочерними лупами
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Связка с демо-режимом */}
            {sceneRequest && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 text-xs">
                <span className="text-cyan-300 font-semibold">🔗 Связано с демо-режимом: </span>
                <span className="text-white/70">
                  Сцена №{sceneRequest.sceneNumber} «{sceneRequest.sceneTitle}» — результат сборки вернётся в сцену
                </span>
              </div>
            )}

            <div>
              <label className="text-white/70 text-xs mb-1 block">Глобальная цель</label>
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Что должен достичь надзиратель…"
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
              <label className="text-white/70 text-xs mb-1 block">Тип артефакта каждого ребёнка</label>
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

            {/* Стоп-критерии мета-уровня */}
            <div className="pt-1">
              <div className="text-white/70 text-xs font-semibold mb-2">
                🛑 Стоп-критерии (двухуровневые)
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs w-40 flex-shrink-0">Дочерних лупов (2-4)</span>
                  <Input
                    type="number" min={2} max={4}
                    value={childCount}
                    onChange={(e) => setChildCount(Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs w-40 flex-shrink-0">Мета-витков (макс)</span>
                  <Input
                    type="number" min={1} max={4}
                    value={maxMetaIterations}
                    onChange={(e) => setMaxMetaIterations(Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs w-40 flex-shrink-0">Витков у ребёнка</span>
                  <Input
                    type="number" min={1} max={6}
                    value={childMaxIterations}
                    onChange={(e) => setChildMaxIterations(Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs w-40 flex-shrink-0">Порог ребёнка (0-10)</span>
                  <Input
                    type="number" min={1} max={10}
                    value={childQualityThreshold}
                    onChange={(e) => setChildQualityThreshold(Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs w-40 flex-shrink-0">Порог сборки (0-10)</span>
                  <Input
                    type="number" min={1} max={10}
                    value={metaQualityThreshold}
                    onChange={(e) => setMetaQualityThreshold(Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs w-40 flex-shrink-0">Общий бюджет, ток.</span>
                  <Input
                    type="number" min={5000} max={800000} step={5000}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
                className="mt-0.5 accent-amber-500"
              />
              <span className="text-xs">
                <span className="text-white/70 group-hover:text-white">Авто-режим надзирателя</span>
                <span className="text-amber-400/80 block text-[11px]">
                  ⚠️ Без него после каждого мета-витка ждём решения человека (внешний круг)
                </span>
              </span>
            </label>

            <div className="flex gap-2 pt-1">
              {!meta || isFinished ? (
                <Button
                  onClick={createRun}
                  disabled={busy || !goal.trim() || autoRunning}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white"
                >
                  {busy ? <span className="animate-pulse">Создание…</span> : '▶ Запустить мета-луп'}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={runStep}
                    disabled={busy || autoRunning || canDecide || !!isFinished}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white"
                  >
                    {busy ? 'Мета-виток идёт…' : '▶ Один мета-виток'}
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
                <span className="text-amber-300 text-xs animate-pulse">🪆 Надзиратель управляет детьми…</span>
                <button
                  onClick={() => { autoAborted.current = true; }}
                  className="text-amber-300 text-xs underline hover:text-amber-200"
                >
                  прервать наблюдение
                </button>
              </div>
            )}

            {/* v6.2: импорт сборки надзирателя — воспроизведение мета-run из JSON */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-1">
              <input
                ref={importFileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importAssembly(f); }}
              />
              <button
                onClick={() => importFileRef.current?.click()}
                disabled={busy || autoRunning}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition disabled:opacity-40"
                title="Восстановить мета-run из экспортного JSON (fortorium-supervisor-assembly): дерево детей, журнал мета-витков и сборка вернутся на место"
              >
                ⬆️ Импорт сборки из JSON
              </button>
              <span className="text-[10px] text-white/30">
                восстановит детей, журнал и сборку
              </span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-2 text-xs">{error}</div>
            )}
          </CardContent>
        </Card>

        {/* Схема вложенности */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">🔁 Как устроен луп над лупом</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2">
              <div className="text-cyan-300 font-semibold">Мета-луп (надзиратель)</div>
              <div className="text-white/60">План → Действие → Наблюдение → Коррекция — но на уровне ЦИКЛОВ, а не текстов</div>
            </div>
            <div className="text-center text-white/30 text-lg leading-none">↓ управляет</div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: childCount }).map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-2">
                  <div className="text-purple-300 font-semibold text-[11px]">♾️ Дочерний луп №{i + 1}</div>
                  <div className="text-white/40 text-[10px]">свой план · исполнитель · валидатор · критик</div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-white/10 text-white/50">
              <span className="text-white/70 font-medium">Круги ответственности:</span> дети крутятся
              автономно (внутренний круг — ИИ), а человек стоит у ворот мета-лупа (внешний круг) —
              финальное решение всегда за человеком.
            </div>
          </CardContent>
        </Card>

        {/* Агрегированные долги */}
        {meta && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <DebtMeters
                debts={meta.debts}
                maxTokens={meta.task.maxTokens}
                iterations={meta.history.length}
                maxIterations={meta.task.maxMetaIterations}
              />
              <div className="text-[10px] text-white/40 mt-2">
                Долги агрегированы по всем дочерним лупам + накладные расходы надзирателя
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Правая колонка: дети, журнал, сборка */}
      <div className="lg:col-span-2 space-y-4">
        {/* Статус */}
        {meta && status && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${status.color}`}>
              {status.label}
            </span>
            <span className="text-white/40 text-xs font-mono">{meta.metaRunId}</span>
            <span className="text-white/40 text-xs">
              мета-виток {meta.metaIteration}/{meta.task.maxMetaIterations}
            </span>
          </div>
        )}

        {/* v6.1: экспорт сборки надзирателя — портативный документ всего run-а */}
        {meta && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/40">📦 Экспорт сборки надзирателя:</span>
            <a
              href={`/api/loop/meta?metaRunId=${meta.metaRunId}&export=json`}
              className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 hover:text-cyan-200 hover:border-cyan-500/40 transition"
            >
              ⬇️ JSON (полная сборка + память)
            </a>
            <a
              href={`/api/loop/meta?metaRunId=${meta.metaRunId}&export=md`}
              className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 hover:text-cyan-200 hover:border-cyan-500/40 transition"
            >
              ⬇️ Markdown-паспорт
            </a>
            <button
              onClick={publishMetaRun}
              disabled={galleryBusy}
              className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/40 transition disabled:opacity-40"
              title="Опубликовать сборку надзирателя в галерее (повторная публикация обновит запись)"
            >
              {galleryBusy ? 'публикация…' : '↗️ В галерею'}
            </button>
            {meta.task.sceneRef && (
              <span className="text-[10px] text-cyan-300/70">
                🔗 сцена №{meta.task.sceneRef.sceneNumber} «{meta.task.sceneRef.sceneTitle}»
              </span>
            )}
            {pubNote && <span className="w-full text-[10px] text-emerald-300/90">{pubNote}</span>}
          </div>
        )}

        {stopInfo && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
            <div className="text-cyan-300 text-xs font-semibold mb-1">🛑 Критерий остановки мета-лупа сработал</div>
            <div className="text-white/70 text-sm">{stopInfo.detail}</div>
          </div>
        )}

        {/* Ворота одобрения внешнего круга */}
        {meta && canDecide && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="text-amber-300 text-sm font-semibold mb-1">
              🚪 Внешний круг: мета-виток завершён, ждём решения человека
            </div>
            <div className="text-white/60 text-xs mb-3">
              ИИ предлагает продолжить надзор. Финальное решение — за вами.
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => decide('accept')}
                disabled={busy}
                className="bg-green-600 hover:bg-green-500 text-white text-xs h-8"
              >
                ✓ Продолжить надзор
              </Button>
              <Button
                onClick={() => decide('stop')}
                disabled={busy}
                variant="outline"
                className="border-red-500/40 text-red-300 hover:text-red-200 text-xs h-8"
              >
                ✋ Остановить всё
              </Button>
            </div>
          </div>
        )}

        {/* v6.0: живое дерево вложенных лупов (корень-надзиратель → ветви-дети) */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">🌳 Дерево вложенных лупов</CardTitle>
            <CardDescription className="text-white/50 text-xs">
              На корне — надзиратель, на ветвях — дочерние циклы со своим План → Действие → Наблюдение → Коррекция.
              Цвет ребра — статус ветви, «↻ N» — рёбра самокоррекции надзирателя
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetaLoopTree
              meta={meta}
              plannedCount={childCount}
              selectedChild={expandedChild}
              onChildClick={(i) => setExpandedChild(expandedChild === i ? null : i)}
            />
          </CardContent>
        </Card>

        {/* Дочерние лупы */}
        {meta && meta.children.length > 0 && (
          <div>
            <h4 className="text-white font-semibold text-sm mb-2">
              ♾️ Дочерние лупы под надзором ({meta.children.filter(c => ['done', 'limit_reached', 'budget_exceeded', 'stopped'].includes(c.status)).length}/{meta.children.length} завершены)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {meta.children.map((child) => {
                const childStatus = STATUS_LABELS[child.status];
                const snapshot = latestRecord?.children.find(c => c.index === child.index);
                const expanded = expandedChild === child.index;
                return (
                  <Card key={child.index} className={`bg-white/5 border ${child.needsRestart ? 'border-red-500/40' : 'border-white/10'}`}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-purple-300 font-semibold text-sm">♾️ Луп №{child.index + 1}</div>
                        {child.needsRestart ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-300 border border-red-500/30">
                            ↻ перезапуск
                          </span>
                        ) : childStatus ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] text-white ${childStatus.color}`}>
                            {childStatus.label}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-white/70 text-xs leading-snug">{child.subGoal}</div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/50">
                        <span>🏆 балл: <b className="text-white/80">{child.lastScore || 0}/10</b></span>
                        <span>🔁 витков: {snapshot?.iterations || 0}</span>
                        <span>🪙 ток.: {(snapshot?.tokens || 0).toLocaleString('ru-RU')}</span>
                        {child.reformulations > 0 && (
                          <span className="text-amber-400">↻ переформулирован ×{child.reformulations}</span>
                        )}
                      </div>
                      {child.needsRestart && child.restartReason && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-1.5 text-[10px] text-red-300">
                          Причина перезапуска: {child.restartReason}
                        </div>
                      )}
                      {snapshot?.bestDraft && (
                        <>
                          <button
                            onClick={() => setExpandedChild(expanded ? null : child.index)}
                            className="text-[11px] text-cyan-300 hover:text-cyan-200 underline"
                          >
                            {expanded ? '▾ скрыть лучший черновик' : '▸ показать лучший черновик'}
                          </button>
                          {expanded && (
                            <div className="bg-black/30 rounded-lg p-2 text-[11px] text-white/70 whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {snapshot.bestDraft}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Финальная сборка */}
        {meta?.bestAssembly && (
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">📦 Сборка надзирателя</CardTitle>
                <span className="text-cyan-300 font-bold">{meta.bestAssemblyScore}/10</span>
              </div>
              <CardDescription className="text-white/50 text-xs">
                Лучшие черновики всех дочерних лупов, собранные в единый артефакт
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/85 text-sm whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {meta.bestAssembly}
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                  <span>👤 Публикация сборки — решение человека (внешний круг)</span>
                  <a
                    href={`/api/loop/meta?metaRunId=${meta.metaRunId}&export=md`}
                    className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 hover:text-cyan-200 hover:border-cyan-500/40 transition"
                  >
                    ⬇️ экспорт
                  </a>
                </div>
                {sceneRequest && isFinished && (
                  <Button
                    onClick={() => {
                      sceneRequest.applyDraft(meta.bestAssembly || '');
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white text-xs h-8"
                  >
                    ↩ Вернуть сборку в сцену №{sceneRequest.sceneNumber}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Журнал мета-витков */}
        {meta && meta.history.length > 0 && (
          <div>
            <h4 className="text-white font-semibold text-sm mb-2">📖 Журнал надзирателя ({meta.history.length})</h4>
            <div className="space-y-2">
              {[...meta.history].reverse().map((rec) => (
                <div key={rec.n} className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/80 font-semibold">Мета-виток №{rec.n}</span>
                    <span className="text-white/40">
                      решение: <b className="text-purple-300">{
                        rec.decision === 'finish' ? 'собрать финал' :
                        rec.decision === 'restart_weak' ? 'перезапустить слабого' : 'продолжить'
                      }</b>
                      {' · '}🪙 {rec.tokens.toLocaleString('ru-RU')} · ⏱ {(rec.ms / 1000).toFixed(1)}с
                    </span>
                  </div>
                  <div className="text-white/60">{rec.plan?.strategy}</div>
                  {rec.critique && (
                    <div className="text-white/40 mt-1">
                      Мета-критик: {rec.critique.score}/10 — {rec.critique.weaknesses}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {!meta && (
          <div className="text-white/40 text-sm p-6 border border-dashed border-white/10 rounded-xl text-center">
            Луп над лупом: надзиратель разобьёт глобальную цель на {childCount} подцелей,
            для каждой запустит собственный полный цикл (план → действие → наблюдение → коррекция),
            а затем соберёт финальный артефакт из лучших версий детей.
          </div>
        )}
      </div>
    </div>
  );
}
