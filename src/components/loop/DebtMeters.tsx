'use client';

import { DebtReport } from './types';

// ============================================================
// "Три долга" луп-инженеринга (00:25:20) — цена автономности:
//  1. Долг по токенам/деньгам
//  2. Долг по времени (латенси)
//  3. Технический долг
// ============================================================

function levelColor(level: string): string {
  return level === 'danger' ? 'text-red-400' : level === 'warn' ? 'text-amber-400' : 'text-green-400';
}

function levelBar(level: string): string {
  return level === 'danger' ? 'bg-red-500' : level === 'warn' ? 'bg-amber-500' : 'bg-green-500';
}

export default function DebtMeters({
  debts,
  maxTokens,
  iterations,
  maxIterations,
}: {
  debts: DebtReport;
  maxTokens: number;
  iterations: number;
  maxIterations: number;
}) {
  const tokenPct = Math.min(100, (debts.tokens / Math.max(1, maxTokens)) * 100);
  const timeSec = Math.round(debts.timeMs / 1000);
  const timeLevel = timeSec >= 120 ? 'danger' : timeSec >= 45 ? 'warn' : 'ok';
  const techLevel = debts.techDebt >= 70 ? 'danger' : debts.techDebt >= 40 ? 'warn' : 'ok';
  const tokenLevel = tokenPct >= 90 ? 'danger' : tokenPct >= 60 ? 'warn' : 'ok';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-semibold text-sm">⚖️ Три долга луп-инженеринга</h4>
        <span className="text-[10px] text-white/40">цена автономности (00:25:20)</span>
      </div>

      {/* Долг по токенам/деньгам */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/70">💰 Токены / деньги</span>
          <span className={levelColor(tokenLevel)}>
            {debts.tokens.toLocaleString('ru-RU')} ток · ≈{debts.moneyRub.toFixed(2)} ₽
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${levelBar(tokenLevel)}`}
            style={{ width: `${tokenPct}%` }}
          />
        </div>
        <div className="text-[10px] text-white/30 mt-0.5">
          циклы тратят бюджет в десятки раз быстрее промптинга · лимит {maxTokens.toLocaleString('ru-RU')}
        </div>
      </div>

      {/* Долг по времени */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/70">⏱️ Время (латенси)</span>
          <span className={levelColor(timeLevel)}>
            {timeSec >= 60 ? `${Math.floor(timeSec / 60)} мин ${timeSec % 60} с` : `${timeSec} с`}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${levelBar(timeLevel)}`}
            style={{ width: `${Math.min(100, (timeSec / 180) * 100)}%` }}
          />
        </div>
        <div className="text-[10px] text-white/30 mt-0.5">
          ждать ответа приходится минутами, а не секундами
        </div>
      </div>

      {/* Технический долг */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/70">🔧 Технический долг</span>
          <span className={levelColor(techLevel)}>{debts.techDebt}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${levelBar(techLevel)}`}
            style={{ width: `${debts.techDebt}%` }}
          />
        </div>
        <div className="text-[10px] text-white/30 mt-0.5">
          переделок: {debts.retries} · проваленных проверок: {debts.failedChecks} · ошибки недетерминированы
        </div>
      </div>

      {/* Витки */}
      <div className="flex justify-between items-center pt-1 border-t border-white/10">
        <span className="text-xs text-white/70">🔁 Витки</span>
        <span className="text-xs text-white/90 font-mono">{iterations} / {maxIterations}</span>
      </div>
    </div>
  );
}
