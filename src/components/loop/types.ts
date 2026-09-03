// Клиентские типы вкладки LOOP (зеркало серверных типов из src/lib/loop)
export type { LoopTask, LoopState, IterationRecord, ScriptCheck, Critique, LoopPlan, DebtReport, GraphRouteResult } from '@/lib/loop/types';

export interface LoopStepResponse {
  ok: boolean;
  error?: string;
  state?: LoopState;
  iteration?: IterationRecord;
  stopDecision?: { stopped: boolean; reason: string; detail: string };
}

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ready: { label: 'Готов', color: 'bg-slate-500' },
  running: { label: 'Виток выполняется', color: 'bg-blue-500' },
  waiting_approval: { label: 'Ждёт одобрения (внешний круг)', color: 'bg-amber-500' },
  done: { label: 'Порог качества достигнут', color: 'bg-green-500' },
  stopped: { label: 'Остановлен человеком', color: 'bg-orange-500' },
  limit_reached: { label: 'Лимит витков исчерпан', color: 'bg-purple-500' },
  budget_exceeded: { label: 'Бюджет токенов исчерпан', color: 'bg-red-500' },
  error: { label: 'Ошибка', color: 'bg-red-600' },
};
