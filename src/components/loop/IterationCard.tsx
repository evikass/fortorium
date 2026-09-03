'use client';

import { useState } from 'react';
import { IterationRecord } from './types';
import { ARTIFACT_LABELS } from '@/lib/loop/types';

// ============================================================
// Карточка одного витка цикла: План → Действие → Наблюдение
// ============================================================

function scoreColor(score: number): string {
  return score >= 8 ? 'text-green-400' : score >= 5 ? 'text-amber-400' : 'text-red-400';
}

function scoreBg(score: number): string {
  return score >= 8 ? 'bg-green-500/20 border-green-500/40' : score >= 5 ? 'bg-amber-500/20 border-amber-500/40' : 'bg-red-500/20 border-red-500/40';
}

export default function IterationCard({
  record,
  isLatest,
  canDecide,
  onAccept,
  onRedo,
  onStop,
  deciding,
}: {
  record: IterationRecord;
  isLatest: boolean;
  canDecide: boolean;
  onAccept: () => void;
  onRedo: () => void;
  onStop: () => void;
  deciding: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const failed = record.scriptChecks.filter((c) => !c.passed).length;

  return (
    <div
      className={`rounded-xl border transition ${
        isLatest ? 'border-purple-500/50 bg-purple-500/5 ring-1 ring-purple-500/30' : 'border-white/10 bg-white/5'
      }`}
    >
      {/* Заголовок витка */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition rounded-t-xl"
      >
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {record.n}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-medium">Виток {record.n}</span>
            {record.attempt > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                попытка {record.attempt} (переделка)
              </span>
            )}
            {record.degraded && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">fallback</span>
            )}
            {failed > 0 ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">скрипт: −{failed}</span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300">скрипт: ✓</span>
            )}
          </div>
          <div className="text-white/50 text-xs truncate mt-0.5">
            {record.plan ? `🎯 ${record.plan.focus}` : '—'} · {(record.ms / 1000).toFixed(1)}с · ~{record.tokens} ток.
          </div>
        </div>
        {record.critique && (
          <div className={`px-2.5 py-1 rounded-lg border text-sm font-bold ${scoreBg(record.critique.score)}`}>
            <span className={scoreColor(record.critique.score)}>{record.critique.score}/10</span>
          </div>
        )}
        <span className="text-white/30 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Развёрнутое содержимое */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* План */}
          {record.plan && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <div className="text-blue-300 text-xs font-semibold mb-1.5">🧭 ПЛАН — планировщик (чистый агент)</div>
              <div className="text-white/80 text-sm mb-1">{record.plan.focus}</div>
              {record.plan.changes.length > 0 && (
                <ul className="text-white/60 text-xs space-y-0.5 list-disc list-inside">
                  {record.plan.changes.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Действие: черновик */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-white/70 text-xs font-semibold mb-1.5">⚙️ ДЕЙСТВИЕ — черновик исполнителя</div>
            <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{record.draft}</p>
          </div>

          {/* Наблюдение: скрипт-проверки */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-white/70 text-xs font-semibold mb-1.5">🔬 НАБЛЮДЕНИЕ — скрипт-валидатор (барьер 1)</div>
            <div className="space-y-1">
              {record.scriptChecks.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={c.passed ? 'text-green-400' : 'text-red-400'}>{c.passed ? '✓' : '✗'}</span>
                  <span className="text-white/70 font-medium flex-shrink-0">{c.name}:</span>
                  <span className="text-white/50">{c.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Наблюдение: LLM-критик */}
          {record.critique && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-white/70 text-xs font-semibold mb-1.5">
                🔍 НАБЛЮДЕНИЕ — LLM-критик, независимый агент (барьер 2)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-green-500/5 rounded p-2">
                  <div className="text-green-300 mb-0.5">Сильное</div>
                  <div className="text-white/60">{record.critique.strengths}</div>
                </div>
                <div className="bg-red-500/5 rounded p-2">
                  <div className="text-red-300 mb-0.5">Слабое</div>
                  <div className="text-white/60">{record.critique.weaknesses}</div>
                </div>
                <div className="bg-amber-500/5 rounded p-2">
                  <div className="text-amber-300 mb-0.5">Улучшить</div>
                  <div className="text-white/60">{record.critique.improvements}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-white/50">
                Вердикт: <b className={record.critique.verdict === 'accept' ? 'text-green-400' : 'text-amber-400'}>
                  {record.critique.verdict === 'accept' ? 'принять' : 'переделать'}
                </b>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ворота одобрения — только для последнего витка в статусе waiting_approval */}
      {canDecide && (
        <div className="mx-3 mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-300 text-xs font-semibold">🚪 ВНЕШНИЙ КРУГ (00:28:36)</span>
            <span className="text-amber-200/60 text-[11px]">
              ИИ предложил — человек решает. Публикацию одобряет только человек.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onAccept}
              disabled={deciding}
              className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium transition"
            >
              ✓ Принять и продолжить
            </button>
            <button
              onClick={onRedo}
              disabled={deciding}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition"
            >
              ↻ Переделать виток
            </button>
            <button
              onClick={onStop}
              disabled={deciding}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white/80 text-sm font-medium transition"
            >
              ⛔ Остановить цикл
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
