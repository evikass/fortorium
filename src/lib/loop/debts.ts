// ============================================================
// ФОРТОРИУМ v5.0 — Счётчик "трёх долгов" луп-инженеринга
// Из видео (00:25:20) — цена, которую платят за автономность:
//   1. Долг по токенам/деньгам — циклы жрут бюджет в десятки раз быстрее промптинга
//   2. Долг по времени — латенси измеряется минутами, а не секундами
//   3. Технический долг — обвязка усложняется, ошибки недетерминированы
// ============================================================

import { DebtReport } from './types';
import { DEMO_RUB_PER_1K_TOKENS } from './types';

export const EMPTY_DEBTS: DebtReport = {
  tokens: 0,
  moneyRub: 0,
  timeMs: 0,
  techDebt: 0,
  retries: 0,
  failedChecks: 0,
};

// Оценка числа токенов: для русского текста ~3.5 символа на токен
export function estimateTokens(...texts: Array<string | null | undefined>): number {
  const chars = texts.reduce((acc, t) => acc + (t ? t.length : 0), 0);
  return Math.ceil(chars / 3.5);
}

// Стоимость в условных рублях
export function tokensToRub(tokens: number): number {
  return Math.round((tokens / 1000) * DEMO_RUB_PER_1K_TOKENS * 100) / 100;
}

// Добавить расход одного шага в общий отчёт по долгам
export function accumulateDebts(
  debts: DebtReport,
  spend: { tokens: number; ms: number; failedChecks?: number; retry?: boolean }
): DebtReport {
  const next: DebtReport = {
    tokens: debts.tokens + spend.tokens,
    moneyRub: tokensToRub(debts.tokens + spend.tokens),
    timeMs: debts.timeMs + spend.ms,
    techDebt: debts.techDebt,
    retries: debts.retries + (spend.retry ? 1 : 0),
    failedChecks: debts.failedChecks + (spend.failedChecks || 0),
  };
  next.techDebt = computeTechDebt(next);
  return next;
}

// Технический долг: растёт от переделок и проваленных проверок,
// снижается от стабильных витков (стабильная история = обвязка предсказуема)
export function computeTechDebt(debts: DebtReport): number {
  const totalLoad = debts.retries * 12 + debts.failedChecks * 8;
  // насыщение к 100: 100 * load / (load + 90)
  const raw = (100 * totalLoad) / (totalLoad + 90);
  return Math.min(100, Math.round(raw));
}

// Уровень тревоги по долгам (для цветовой индикации в UI)
export function debtLevel(tokens: number, maxTokens: number, timeMs: number, techDebt: number): {
  tokens: 'ok' | 'warn' | 'danger';
  time: 'ok' | 'warn' | 'danger';
  tech: 'ok' | 'warn' | 'danger';
} {
  const tokenRatio = maxTokens > 0 ? tokens / maxTokens : 0;
  return {
    tokens: tokenRatio >= 0.9 ? 'danger' : tokenRatio >= 0.6 ? 'warn' : 'ok',
    time: timeMs >= 120000 ? 'danger' : timeMs >= 45000 ? 'warn' : 'ok',
    tech: techDebt >= 70 ? 'danger' : techDebt >= 40 ? 'warn' : 'ok',
  };
}
