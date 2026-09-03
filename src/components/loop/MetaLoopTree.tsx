'use client';

// ============================================================
// ФОРТОРИУМ v6.0 — SVG-визуализация ДЕРЕВА вложенных лупов
//
// Корень дерева — мета-луп (надзиратель): показывает статус, мета-виток,
// агрегированные долги и балл сборки. Ветви — дочерние лупы, каждый со своим
// полным циклом План → Действие → Наблюдение → Коррекция.
//
// Визуальный язык:
//  • цвет ребра = статус ребёнка; анимированный пунктир — ребёнок крутится;
//  • «↻ N» на ребре — сколько раз надзиратель переформулировал подцель
//    и перезапустил ветвь (рёбра самокоррекции мета-уровня);
//  • пунктирные «призрачные» узлы — ветви, запланированные до первого
//    мета-витка (дерево видно ещё до запуска надзирателя);
//  • точки прогресса внутри узла — витки ребёнка против его лимита.
// ============================================================

import { MetaState } from './types';
import { STATUS_LABELS } from './types';

const STATUS_HEX: Record<string, string> = {
  ready: '#64748b',
  not_created: '#475569',
  running: '#38bdf8',
  waiting_approval: '#fbbf24',
  done: '#34d399',
  stopped: '#fb923c',
  limit_reached: '#a78bfa',
  budget_exceeded: '#f87171',
  error: '#ef4444',
  needsRestart: '#fb7185',
};

const TERMINAL = ['done', 'stopped', 'limit_reached', 'budget_exceeded', 'error'];

const LEGEND: Array<{ color: string; label: string }> = [
  { color: '#34d399', label: 'завершён' },
  { color: '#38bdf8', label: 'крутится' },
  { color: '#fbbf24', label: 'на воротах' },
  { color: '#fb7185', label: 'на перезапуске' },
  { color: '#475569', label: 'ждёт запуска' },
];

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// Геометрия дерева (внутренний холст фиксирован, при узких экранах скроллится)
const W = 760;
const H = 352;
const ROOT_W = 250;
const ROOT_H = 78;
const ROOT_X = (W - ROOT_W) / 2;
const ROOT_Y = 18;
const CHILD_W = 168;
const CHILD_H = 112;
const CHILD_GAP = 22;
const CHILD_Y = 220;

export default function MetaLoopTree({
  meta,
  plannedCount,
  onChildClick,
  selectedChild,
}: {
  meta: MetaState | null;
  plannedCount: number;                       // сколько детей планирует надзиратель (до запуска)
  onChildClick?: (index: number) => void;     // клик по ветви — раскрыть детали ребёнка
  selectedChild?: number | null;
}) {
  const latest = meta && meta.history.length > 0 ? meta.history[meta.history.length - 1] : null;

  const childCount = meta?.children.length
    ? meta.children.length
    : meta?.task.childCount || plannedCount || 3;

  const totalW = childCount * CHILD_W + (childCount - 1) * CHILD_GAP;
  const startX = (W - totalW) / 2;
  const childX = (i: number): number => startX + i * (CHILD_W + CHILD_GAP);

  const rootStatus = meta?.status || 'ready';
  const rootColor = STATUS_HEX[rootStatus] || '#64748b';
  const rootPill = STATUS_LABELS[rootStatus];

  const doneCount = meta ? meta.children.filter((c) => TERMINAL.includes(c.status)).length : 0;

  const info = (i: number) => {
    const slot = meta?.children.find((c) => c.index === i);
    const snap = latest?.children.find((c) => c.index === i);
    const key = slot ? (slot.needsRestart ? 'needsRestart' : slot.status) : 'not_created';
    return { slot, snap, key, color: STATUS_HEX[key] || '#64748b' };
  };

  const childMaxIter = meta?.task.childMaxIterations || 0;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <div className="relative mx-auto" style={{ width: W, height: H }}>
          {/* ---------- SVG-слой: пульс корня и рёбра ---------- */}
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0">
            <defs>
              <linearGradient id="metaRootFill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0e7490" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.30" />
              </linearGradient>
            </defs>

            {/* Пульс надзирателя, пока мета-луп крутится */}
            {meta?.status === 'running' && (
              <circle cx={W / 2} cy={ROOT_Y + ROOT_H / 2} r={54} fill={rootColor} opacity={0.12}>
                <animate attributeName="r" values="50;68;50" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.16;0.04;0.16" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Рёбра: надзиратель → дочерние лупы */}
            {Array.from({ length: childCount }).map((_, i) => {
              const { key, color, snap, slot } = info(i);
              const cx = childX(i) + CHILD_W / 2;
              const midY = (ROOT_Y + ROOT_H + CHILD_Y) / 2;
              const isRunning = key === 'running' || Boolean(snap?.steppedThisIteration);
              const isGhost = key === 'not_created';
              const d = `M ${W / 2} ${ROOT_Y + ROOT_H} C ${W / 2} ${midY}, ${cx} ${midY + 4}, ${cx} ${CHILD_Y}`;
              return (
                <g key={i}>
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={isRunning ? 3 : 2}
                    opacity={isGhost ? 0.35 : 0.85}
                    strokeDasharray={isGhost ? '4 6' : isRunning ? '7 7' : key === 'needsRestart' ? '3 5' : undefined}
                  >
                    {isRunning && (
                      <animate attributeName="stroke-dashoffset" from="28" to="0" dur="0.9s" repeatCount="indefinite" />
                    )}
                  </path>
                  {/* Точка-индикатор на входе в ребёнка */}
                  <circle cx={cx} cy={CHILD_Y - 4} r={isRunning ? 5 : 3.5} fill={color} opacity={isGhost ? 0.4 : 1}>
                    {isRunning && (
                      <animate attributeName="r" values="4;7;4" dur="1s" repeatCount="indefinite" />
                    )}
                  </circle>
                  {/* Бейдж рёбра самокоррекции: сколько раз ребёнок перезапущен */}
                  {slot && slot.reformulations > 0 && (
                    <g>
                      <rect
                        x={(W / 2 + cx) / 2 - 16}
                        y={midY - 26}
                        width={32}
                        height={16}
                        rx={8}
                        fill="#1e1b4b"
                        stroke={STATUS_HEX.needsRestart}
                        strokeWidth={1}
                      />
                      <text
                        x={(W / 2 + cx) / 2}
                        y={midY - 14}
                        textAnchor="middle"
                        fontSize={10}
                        fill={STATUS_HEX.needsRestart}
                        fontFamily="monospace"
                      >
                        ↻{slot.reformulations}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* ---------- HTML-слой: узлы ---------- */}

          {/* Корень: мета-луп (надзиратель) */}
          <div
            className="absolute rounded-2xl border-2 bg-slate-950/90 backdrop-blur px-3 py-2 flex flex-col justify-center"
            style={{
              left: ROOT_X,
              top: ROOT_Y,
              width: ROOT_W,
              height: ROOT_H,
              borderColor: rootColor,
              boxShadow: `0 0 26px ${rootColor}44`,
            }}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-white font-bold text-[13px]">🎛️ МЕТА-ЛУП</span>
              {rootPill && (
                <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] text-white leading-none ${rootPill.color}`}>
                  {rootPill.label}
                </span>
              )}
            </div>
            {meta ? (
              <>
                <div className="text-white/55 text-[10.5px] mt-0.5">
                  надзиратель · мета-виток {meta.metaIteration}/{meta.task.maxMetaIterations}
                </div>
                <div className="text-white/70 text-[10.5px] mt-0.5 flex flex-wrap gap-x-2">
                  <span>♾️ дети: <b className="text-white">{doneCount}/{meta.children.length || childCount}</b></span>
                  {meta.bestAssemblyScore > 0 && (
                    <span className="text-cyan-300">📦 сборка: <b>{meta.bestAssemblyScore}/10</b></span>
                  )}
                </div>
                <div className="text-white/45 text-[9.5px] mt-0.5">
                  🪙 {meta.debts.tokens.toLocaleString('ru-RU')} ток. · ₽ {meta.debts.moneyRub.toFixed(1)} · ⏱ {(meta.debts.timeMs / 1000).toFixed(0)}с
                </div>
              </>
            ) : (
              <div className="text-white/40 text-[10.5px] mt-1 leading-snug">
                надзиратель ещё не запущен — задайте глобальную цель слева
              </div>
            )}
          </div>

          {/* Ветви: дочерние лупы */}
          {Array.from({ length: childCount }).map((_, i) => {
            const { slot, snap, color, key } = info(i);
            const selected = selectedChild === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChildClick?.(i)}
                className={`absolute text-left rounded-xl border bg-slate-950/90 backdrop-blur px-2.5 py-2 transition hover:bg-slate-900 ${
                  selected ? 'ring-2 ring-cyan-400/70' : ''
                }`}
                style={{
                  left: childX(i),
                  top: CHILD_Y,
                  width: CHILD_W,
                  minHeight: CHILD_H,
                  borderColor: key === 'not_created' ? 'rgba(255,255,255,0.12)' : `${color}99`,
                  borderStyle: key === 'not_created' ? 'dashed' : 'solid',
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-purple-300 font-semibold text-[11px]">♾️ Луп №{i + 1}</span>
                  {slot?.needsRestart ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[8.5px] bg-rose-500/20 text-rose-300 border border-rose-400/40 leading-none">
                      ↻ перезапуск
                    </span>
                  ) : slot ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                      title={STATUS_LABELS[slot.status]?.label || slot.status}
                    />
                  ) : null}
                </div>

                <div className={`text-[9.5px] leading-tight mt-1 ${slot ? 'text-white/70' : 'text-white/30 italic'}`}>
                  {slot ? truncate(slot.subGoal, 76) : 'ждёт мета-планировщика'}
                </div>

                {slot && (
                  <div className="text-white/50 text-[9.5px] mt-1 flex flex-wrap gap-x-1.5">
                    <span>🏆 <b className="text-white/85">{slot.lastScore || 0}/10</b></span>
                    <span>🔁 {snap?.iterations || 0}{childMaxIter ? `/${childMaxIter}` : ''}</span>
                    {snap && <span>🪙 {(snap.tokens / 1000).toFixed(1)}к</span>}
                  </div>
                )}

                {slot && childMaxIter > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {Array.from({ length: childMaxIter }).map((_, k) => (
                      <span
                        key={k}
                        className="w-4 h-1.5 rounded-full"
                        style={{
                          backgroundColor: k < (snap?.iterations || 0) ? color : 'rgba(255,255,255,0.10)',
                        }}
                      />
                    ))}
                    {slot.reformulations > 0 && (
                      <span className="text-rose-300 text-[9px] ml-1">↻×{slot.reformulations}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
        {LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1 text-[9px] text-white/40">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
        <span className="text-[9px] text-white/30 ml-auto">клик по ветви — детали ребёнка ниже</span>
      </div>
    </div>
  );
}
