'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GraphRouteResult } from './types';

// ============================================================
// Граф-инженеринг (будущее из видео, 00:29:32):
// не линейные цепочки и не одиночные циклы, а ветвящиеся графы
// специализированных агентов + маршрутизатор, выбирающий рёбра
// по промежуточным результатам.
// ============================================================

const NODES = [
  { id: 'analyst', name: 'Аналитик', icon: '🧭', x: 90, y: 150, desc: 'классифицирует задачу' },
  { id: 'router', name: 'Маршрутизатор', icon: '🔀', x: 235, y: 150, desc: 'выбирает ребро по результату' },
  { id: 'writer', name: 'Сценарист', icon: '📝', x: 405, y: 65, desc: 'сценарная ветка' },
  { id: 'concept', name: 'Концепт-художник', icon: '🎨', x: 405, y: 235, desc: 'визуальная ветка' },
  { id: 'critic', name: 'Критик', icon: '🔍', x: 560, y: 150, desc: 'score < 7 → на переделку' },
  { id: 'director', name: 'Дирижёр', icon: '🎼', x: 715, y: 150, desc: 'финальная сборка' },
];

const EDGES: Array<{ from: string; to: string; label: string; correction?: boolean }> = [
  { from: 'analyst', to: 'router', label: '' },
  { from: 'router', to: 'writer', label: 'narrative' },
  { from: 'router', to: 'concept', label: 'visual' },
  { from: 'writer', to: 'critic', label: '' },
  { from: 'concept', to: 'critic', label: '' },
  { from: 'critic', to: 'writer', label: 'score<7', correction: true },
  { from: 'critic', to: 'concept', label: 'score<7', correction: true },
  { from: 'critic', to: 'director', label: 'accepted' },
];

function nodeById(id: string) {
  return NODES.find((n) => n.id === id)!;
}

export default function GraphView() {
  const [task, setTask] = useState('');
  const [result, setResult] = useState<GraphRouteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState<number | null>(null);

  const run = async () => {
    if (!task.trim() || running) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setOpenStep(null);
    try {
      const res = await fetch('/api/loop/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const json = await res.json();
      if (json.ok) {
        setResult(json);
      } else {
        setError(json.error || 'Ошибка маршрутизации');
      }
    } catch (e) {
      setError(String(e));
    }
    setRunning(false);
  };

  // Активные рёбра трассы: строим множество пар (from,to) из path
  const activeEdges = new Set<string>();
  const activeNodes = new Set<string>();
  if (result) {
    result.path.forEach((p) => activeNodes.add(p));
    for (let i = 0; i < result.path.length - 1; i++) {
      const a = result.path[i];
      const b = result.path[i + 1];
      if (a === 'router' || b === 'router') continue; // виртуальный узел не рисуем рёбра path
      activeEdges.add(`${a}->${b}`);
    }
    // соединим аналитика с первой веткой через роутер визуально всегда
  }

  const activeEdgeList = EDGES.filter((e) => activeEdges.has(`${e.from}->${e.to}`));

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-white font-semibold mb-1">🕸️ Граф-инженеринг — следующий уровень</h4>
        <p className="text-white/50 text-sm">
          Не линейная цепочка и не одиночный цикл, а ветвящийся граф специалистов. Маршрутизатор
          выбирает путь по промежуточным результатам, а рёбра самокоррекции возвращают работу
          на переделку при score &lt; 7.
        </p>
      </div>

      {/* SVG граф */}
      <div className="bg-black/30 border border-white/10 rounded-xl p-2 overflow-x-auto">
        <svg viewBox="0 0 820 320" className="w-full min-w-[640px]">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.35)" />
            </marker>
            <marker id="arrowActive" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#22d3ee" />
            </marker>
            <marker id="arrowCorrection" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
            </marker>
          </defs>

          {EDGES.map((e, idx) => {
            const a = nodeById(e.from);
            const b = nodeById(e.to);
            const isActive = activeEdgeList.some((ae) => ae.from === e.from && ae.to === e.to);
            const isCorrection = !!e.correction;
            const stroke = isActive
              ? isCorrection ? '#f59e0b' : '#22d3ee'
              : isCorrection ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.18)';
            const width = isActive ? 3 : 1.5;
            const marker = isActive
              ? isCorrection ? 'url(#arrowCorrection)' : 'url(#arrowActive)'
              : 'url(#arrow)';

            // Рёбра самокоррекции рисуем дугами, обычные — прямыми
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            // Перпендикулярное смещение для дуги
            const nx = -dy;
            const ny = dx;
            const len = Math.sqrt(nx * nx + ny * ny) || 1;
            const arc = isCorrection ? 46 : 0;
            const cx = mx + (nx / len) * arc;
            const cy = my + (ny / len) * arc;

            return (
              <path
                key={idx}
                d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                fill="none"
                stroke={stroke}
                strokeWidth={width}
                markerEnd={marker}
                strokeDasharray={isCorrection && !isActive ? '5 5' : undefined}
              />
            );
          })}

          {/* Подписи условий на рёбрах */}
          {EDGES.filter((e) => e.label).map((e, idx) => {
            const a = nodeById(e.from);
            const b = nodeById(e.to);
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - (e.correction ? 40 : 12);
            const isActive = activeEdgeList.some((ae) => ae.from === e.from && ae.to === e.to);
            return (
              <text
                key={`lbl-${idx}`}
                x={mx}
                y={my}
                textAnchor="middle"
                fontSize="10"
                fill={isActive ? '#67e8f9' : 'rgba(255,255,255,0.35)'}
                fontFamily="monospace"
              >
                {e.label}
              </text>
            );
          })}

          {/* Узлы */}
          {NODES.map((n) => {
            const isActive = activeNodes.has(n.id);
            const r = n.id === 'router' ? 26 : 34;
            return (
              <g key={n.id}>
                {isActive && (
                  <circle cx={n.x} cy={n.y} r={r + 6} fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.5">
                    <animate attributeName="r" values={`${r + 4};${r + 10};${r + 4}`} dur="1.6s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={isActive ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.05)'}
                  stroke={isActive ? '#22d3ee' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="20">{n.icon}</text>
                <text x={n.x} y={n.y + r + 16} textAnchor="middle" fontSize="12" fill={isActive ? '#fff' : 'rgba(255,255,255,0.6)'} fontWeight={isActive ? 700 : 400}>
                  {n.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Форма задачи */}
      <div className="flex gap-2">
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Например: придумай персонажа и его среду обитания…"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400/50"
          onKeyDown={(e) => e.key === 'Enter' && run()}
        />
        <Button
          onClick={run}
          disabled={running || !task.trim()}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white"
        >
          {running ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Маршрут…
            </span>
          ) : (
            '🔀 Пустить по графу'
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm">{error}</div>
      )}

      {/* Результаты маршрутизации */}
      {result && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ветка: {result.analysis.kindLabel}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              оценка: {result.score}/10
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              самокоррекций: {result.correctionLoops}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/60 border border-white/20">
              {(result.totalMs / 1000).toFixed(1)} с · ~{result.tokens} ток.
            </span>
          </div>

          {/* Решения маршрутизатора */}
          {result.branchDecisions.length > 0 && (
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 space-y-1.5">
              <div className="text-cyan-300 text-xs font-semibold uppercase tracking-wide">🔀 Решения маршрутизатора</div>
              {result.branchDecisions.map((d, i) => (
                <div key={i} className="text-white/70 text-xs">• {d}</div>
              ))}
            </div>
          )}

          {/* Трасса узлов */}
          <div className="space-y-2">
            {result.steps.map((s, i) => (
              <div key={i} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                <button
                  onClick={() => setOpenStep(openStep === i ? null : i)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition"
                >
                  <span className="text-lg">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{s.nodeName}</div>
                    <div className="text-white/50 text-xs truncate">{s.outputSummary}</div>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono flex-shrink-0">{(s.ms / 1000).toFixed(1)}с · ~{s.tokens}т</span>
                  {s.degraded && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">fallback</span>}
                  <span className="text-white/30 text-xs">{openStep === i ? '▲' : '▼'}</span>
                </button>
                {openStep === i && (
                  <div className="px-3 pb-3 text-xs">
                    <div className="text-white/40 mb-1">Вход:</div>
                    <div className="bg-black/30 rounded p-2 text-white/60 font-mono text-[10px] mb-2 whitespace-pre-wrap">{s.inputSummary}…</div>
                    <div className="text-white/40 mb-1">Выход:</div>
                    <div className="bg-black/30 rounded p-2 text-green-200/80 font-mono text-[10px] whitespace-pre-wrap">{s.outputFull}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Финальная сборка дирижёра */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="text-green-300 text-xs font-semibold uppercase tracking-wide mb-2">🎼 Финальная сборка дирижёра</div>
            <p className="text-white/80 text-sm whitespace-pre-wrap">{result.final}</p>
          </div>
        </div>
      )}
    </div>
  );
}
