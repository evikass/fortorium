'use client';

// ============================================================
// ФОРТОРИУМ v6.3 — Подвкладка «Галерея сборок»
//
// Публичная библиотека портативных run-ов. Сборка (экспортный JSON
// одиночного цикла или надзирателя) публикуется на сервер и доступна
// всем посетителям: скачать, восстановить в памяти и продолжить,
// вернуть лучший текст в демо-режим как сцену.
//
// Принцип луп-инженеринга не меняется: состояние агента — его файлы.
// Галерея — это полка готовых «файловых состояний», которые можно
// снять с полки и оживить одним кликом (восстановление = импорт).
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STATUS_LABELS } from './types';
import { ARTIFACT_LABELS } from '@/lib/loop/types';

// Метаданные записи галереи (лёгкая карточка списка)
interface GallerySummary {
  id: string;
  kind: 'loop' | 'supervisor';
  publishedAt: number;
  runId: string;
  goal: string;
  artifactType: string;
  status: string;
  bestScore: number;
  sceneRef?: { sceneNumber: number; sceneTitle: string };
  tokens: number;
  moneyRub: number;
  iterations: number;
  bytes: number;
  appVersion: string;
}

// Информация о восстановленном run-е (для открытия в подвкладке цикла/мета-лупа)
export interface RestoredRunInfo {
  kind: 'loop' | 'supervisor';
  state: Record<string, unknown>;
}

const fmtRub = (rub: number): string =>
  `${rub.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ₽`;

const fmtDate = (ts: number): string =>
  new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AssemblyGallery({
  onRestoreScene,
  onRestoredRun,
}: {
  onRestoreScene?: (doc: Record<string, unknown>) => void;
  onRestoredRun?: (info: RestoredRunInfo) => void;
} = {}) {
  const [entries, setEntries] = useState<GallerySummary[]>([]);
  const [backend, setBackend] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, { best: string | null; files: string[]; children?: number }>>({});
  const publishFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/loop/gallery');
      const json = await res.json();
      if (json.ok) {
        setEntries(json.entries || []);
        setBackend(json.backend || '');
      } else {
        setError(json.error || 'Не удалось загрузить галерею');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Публикация готового документа из файла (например, чужая сборка)
  const publishFile = async (file: File) => {
    setError(null);
    setNote(null);
    setBusyId('_upload');
    try {
      const doc = JSON.parse(await file.text());
      const res = await fetch('/api/loop/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc }),
      });
      const json = await res.json();
      if (json.ok) {
        setNote(json.note);
        await load();
      } else {
        setError(json.error || 'Не удалось опубликовать сборку');
      }
    } catch (e) {
      setError(`Публикация не удалась: ${e instanceof Error ? e.message : String(e)}`);
    }
    setBusyId(null);
    if (publishFileRef.current) publishFileRef.current.value = '';
  };

  // Полная запись галереи (документ сборки)
  const fetchDoc = async (id: string): Promise<Record<string, unknown> | null> => {
    const res = await fetch(`/api/loop/gallery?id=${id}`);
    const json = await res.json();
    if (!json.ok) {
      setError(json.error || 'Запись не найдена');
      return null;
    }
    return json.entry?.doc || null;
  };

  // Восстановить run в памяти: импорт сборки → run снова жив, открываем его в подвкладке
  const restoreRun = async (s: GallerySummary) => {
    setError(null);
    setNote(null);
    setBusyId(s.id);
    try {
      const doc = await fetchDoc(s.id);
      if (!doc) return;
      const res = await fetch(s.kind === 'loop' ? '/api/loop' : '/api/loop/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', doc }),
      });
      const json = await res.json();
      if (json.ok && json.state) {
        const restored = json.import?.restored ?? json.import?.meta?.restored ?? 0;
        setNote(
          `✅ Run ${s.runId} восстановлен в памяти (файлов: ${restored})` +
          ` — открыт в подвкладке «${s.kind === 'loop' ? '♾️ Цикл' : '🪆 Вложенные лупы'}»`
        );
        onRestoredRun?.({ kind: s.kind, state: json.state });
      } else {
        setError(json.error || 'Не удалось восстановить run');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusyId(null);
  };

  // Вернуть лучший текст сборки в демо-режим как сцену
  const restoreScene = async (s: GallerySummary) => {
    setError(null);
    setNote(null);
    setBusyId(s.id);
    try {
      const doc = await fetchDoc(s.id);
      if (!doc) return;
      onRestoreScene?.(doc);
      setNote(`↩️ Лучший текст сборки ${s.runId} передан в демо-режим (раскадровка)`);
    } finally {
      setBusyId(null);
    }
  };

  // Удалить запись из галереи
  const remove = async (s: GallerySummary) => {
    setError(null);
    setNote(null);
    setBusyId(s.id);
    try {
      const res = await fetch(`/api/loop/gallery?id=${s.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        setNote(`🗑 Запись ${s.id} удалена из галереи`);
        await load();
      } else {
        setError(json.error || 'Не удалось удалить запись');
      }
    } finally {
      setBusyId(null);
    }
  };

  // Развернуть карточку: лучший текст + файловая память
  const toggleDetails = async (s: GallerySummary) => {
    if (expandedId === s.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(s.id);
    if (!details[s.id]) {
      const doc = await fetchDoc(s.id);
      if (!doc) return;
      const best =
        s.kind === 'loop'
          ? ((doc.result as Record<string, unknown> | undefined)?.best as string | null) ?? null
          : ((doc.assembly as Record<string, unknown> | undefined)?.best as string | null) ?? null;
      const files = (
        (s.kind === 'loop'
          ? (doc.memoryFiles as Array<Record<string, unknown>> | undefined)
          : (doc.metaMemoryFiles as Array<Record<string, unknown>> | undefined)) || []
      ).map((f) => String(f.name));
      const children = s.kind === 'supervisor' ? (Array.isArray(doc.children) ? doc.children.length : undefined) : undefined;
      setDetails((prev) => ({ ...prev, [s.id]: { best, files, children } }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Шапка */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-white text-base">🗂 Галерея сборок</CardTitle>
              <CardDescription className="text-white/50 text-xs">
                Публичная библиотека портативных run-ов: любая сборка — это файловое состояние агента,
                которое можно снять с полки и оживить (восстановить и продолжить цикл)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-mono">
                хранилище: {backend === 'vercel-blob' ? 'Vercel Blob (персистентно)' : backend || '…'}
              </span>
              <button
                onClick={load}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition"
              >
                {loading ? '…' : '⟳ обновить'}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={publishFileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) publishFile(f); }}
            />
            <button
              onClick={() => publishFileRef.current?.click()}
              disabled={busyId !== null}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition disabled:opacity-40"
              title="Опубликовать в галерее сборку из экспортного JSON-файла"
            >
              ⬆️ Опубликовать сборку из файла
            </button>
            <span className="text-[10px] text-white/30">
              Публикация из лупа — кнопка «↗️ В галерею» рядом с экспортом сборки
            </span>
          </div>

          {backend === 'local-fs' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-[11px] text-amber-300/90">
              ⚠️ Галерея живёт в эфемерном хранилище (local-fs) — на серверлесе записи исчезают между инстансами.
              Подключите Vercel Blob Store — и галерея станет по-настоящему постоянной, код менять не нужно.
            </div>
          )}

          {note && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-[11px] text-green-300">{note}</div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-[11px] text-red-300">{error}</div>
          )}
        </CardContent>
      </Card>

      {/* Список записей */}
      {loading ? (
        <div className="text-white/40 text-sm p-6 border border-dashed border-white/10 rounded-xl text-center">Загрузка галереи…</div>
      ) : entries.length === 0 ? (
        <div className="text-white/40 text-sm p-6 border border-dashed border-white/10 rounded-xl text-center">
          Галерея пуста. Запустите цикл или мета-луп и нажмите «↗️ В галерею» рядом с экспортом сборки —
          или загрузите чужой экспортный JSON кнопкой выше.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {entries.map((s) => {
            const st = STATUS_LABELS[s.status];
            const expanded = expandedId === s.id;
            const d = details[s.id];
            return (
              <Card key={s.id} className={`bg-white/5 border ${expanded ? 'border-cyan-500/40' : 'border-white/10'}`}>
                <CardContent className="pt-4 space-y-2">
                  {/* Заголовок карточки */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${s.kind === 'loop' ? 'bg-purple-500/80' : 'bg-cyan-600/80'}`}>
                        {s.kind === 'loop' ? '♾️ Цикл' : '🪆 Надзиратель'}
                      </span>
                      {st && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] text-white ${st.color}`}>{st.label}</span>
                      )}
                      {s.bestScore > 0 && (
                        <span className="text-green-300 text-xs font-bold">🏆 {s.bestScore}/10</span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/30 font-mono">{s.runId}</span>
                  </div>

                  {/* Цель */}
                  <div className="text-white/80 text-sm leading-snug">{s.goal || <span className="text-white/40">без цели</span>}</div>

                  {/* Метаданные */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/50">
                    {s.artifactType && <span>{ARTIFACT_LABELS[s.artifactType as keyof typeof ARTIFACT_LABELS] || s.artifactType}</span>}
                    <span>🔁 {s.iterations} витк(ов)</span>
                    <span>🪙 {s.tokens.toLocaleString('ru-RU')}</span>
                    <span>💳 {fmtRub(s.moneyRub)}</span>
                    <span>💾 {(s.bytes / 1024).toFixed(1)} КБ</span>
                    <span>📅 {fmtDate(s.publishedAt)}</span>
                    {s.appVersion && <span className="text-white/30">v{s.appVersion}</span>}
                    {s.sceneRef && (
                      <span className="text-cyan-300/70">🔗 сцена №{s.sceneRef.sceneNumber} «{s.sceneRef.sceneTitle}»</span>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <a
                      href={`/api/loop/gallery?id=${s.id}&download=json`}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 hover:text-cyan-200 hover:border-cyan-500/40 transition text-[11px]"
                    >
                      ⬇️ JSON
                    </a>
                    <a
                      href={`/api/loop/gallery?id=${s.id}&download=md`}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 hover:text-cyan-200 hover:border-cyan-500/40 transition text-[11px]"
                    >
                      ⬇️ паспорт .md
                    </a>
                    <button
                      onClick={() => restoreRun(s)}
                      disabled={busyId !== null}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition text-[11px] disabled:opacity-40"
                      title="Восстановить файлы памяти run-а из сборки и открыть его (можно продолжить витки)"
                    >
                      {busyId === s.id ? '…' : '⬆️ Восстановить run'}
                    </button>
                    {onRestoreScene && (
                      <button
                        onClick={() => restoreScene(s)}
                        disabled={busyId !== null}
                        className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition text-[11px] disabled:opacity-40"
                        title="Лучший текст сборки станет сценой в раскадровке демо-режима"
                      >
                        ↩️ В демо-сцену
                      </button>
                    )}
                    <button
                      onClick={() => toggleDetails(s)}
                      disabled={busyId !== null}
                      className="text-[11px] text-cyan-300 hover:text-cyan-200 underline disabled:opacity-40"
                    >
                      {expanded ? 'свернуть' : 'подробнее'}
                    </button>
                    <button
                      onClick={() => remove(s)}
                      disabled={busyId !== null}
                      className="ml-auto text-[11px] text-red-400/60 hover:text-red-300 transition disabled:opacity-40"
                      title="Удалить запись из галереи"
                    >
                      🗑
                    </button>
                  </div>

                  {/* Развёрнутая карточка: лучший текст + файловая память */}
                  {expanded && (
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      {d ? (
                        <>
                          <div>
                            <div className="text-[10px] text-white/40 font-semibold mb-1">📦 Лучший текст сборки</div>
                            {d.best ? (
                              <pre className="text-white/80 text-xs whitespace-pre-wrap max-h-60 overflow-y-auto bg-white/5 rounded-lg p-2 leading-relaxed">{d.best}</pre>
                            ) : (
                              <div className="text-white/40 text-xs">в сборке нет финального текста (run остановился до первого витка)</div>
                            )}
                          </div>
                          <div>
                            <div className="text-[10px] text-white/40 font-semibold mb-1">
                              🗂 Файловая память ({d.files.length} файлов){d.children !== undefined ? ` · дочерних лупов: ${d.children}` : ''}
                            </div>
                            <div className="text-[11px] text-white/50 font-mono break-all">
                              {d.files.join(', ') || '—'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-white/40 text-xs">загрузка деталей…</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Философия */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-4 text-xs text-white/50 space-y-1">
          <div className="text-white/70 font-medium">Почему это работает</div>
          <div>
            Сборка содержит НЕ только результат, но и всю файловую память: журнал витков, долги,
            состояние агентов. Поэтому «Восстановить run» — это не копия текста, а настоящее
            воскрешение процесса: чистые агенты снова читают свои файлы и продолжают с того же места.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
