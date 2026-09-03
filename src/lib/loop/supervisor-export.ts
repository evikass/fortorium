// ============================================================
// ФОРТОРИУМ v6.1 — Экспорт сборки надзирателя (мета-лупа)
//
// «Сборка надзирателя» — это не только текстовый артефакт
// (bestAssembly), но и вся обвязка, которая его произвела:
//   • глобальная задача и стоп-критерии (условие №1 лупа)
//   • дерево дочерних лупов: подцели, статусы, баллы, перезапуски
//   • журнал мета-витков (план → действие → наблюдение → коррекция)
//   • три долга (токены/деньги, время, техдолг) — агрегированные
//   • файловая память мета-лупа и всех детей (чистые агенты)
//
// Экспорт делает запуск ПОРТАТИВНЫМ: документ можно скачать,
// положить в архив, передать другому агенту или воспроизвести
// задачу в новой системе — вся необходимая информация в одном файле.
//
// Два формата:
//   JSON — полная машина-читаемая сборка (formatVersion: 1)
//   Markdown — человек-читаемый «паспорт сборки» для отчётов
// ============================================================

import {
  MetaState, LoopState,
} from './types';
import { readMemoryFile, listMemoryFiles, MemoryFileMeta } from './memory-store';
import { CLIENT_VERSION } from '@/lib/version';

export const SUPERVISOR_EXPORT_FORMAT = 'fortorium-supervisor-assembly';
export const SUPERVISOR_EXPORT_FORMAT_VERSION = 1;

// Файлы памяти больше этого размера экспортируются метаданными (без содержимого)
const MAX_INLINE_FILE_BYTES = 256 * 1024;

export interface ExportedMemoryFile extends MemoryFileMeta {
  /** Содержимое файла; null, если файл слишком велик для инлайна */
  content: string | unknown | null;
  truncated: boolean;
}

export interface ExportedChild {
  index: number;
  childRunId: string;
  subGoal: string;
  status: string;
  reformulations: number;
  needsRestart: boolean;
  restartReason: string | null;
  lastScore: number;
  iterations: number;
  tokens: number;
  moneyRub: number;
  timeMs: number;
  bestDraft: string | null;
  /** Полное состояние дочернего лупа (state.json), если доступно */
  state: LoopState | null;
  memoryFiles: ExportedMemoryFile[];
}

export interface SupervisorExport {
  format: string;
  formatVersion: number;
  engine: string;
  appVersion: string;
  exportedAt: string;
  metaRunId: string;
  status: string;
  stopReason: string | null;
  task: MetaState['task'];
  assembly: {
    best: string | null;
    bestScore: number;
    last: string | null;
  };
  children: ExportedChild[];
  debts: MetaState['debts'];
  history: MetaState['history'];
  metaMemoryFiles: ExportedMemoryFile[];
  stats: {
    childrenTotal: number;
    childrenDone: number;
    totalChildIterations: number;
    metaIterations: number;
    wallTimeMs: number;
    memoryFilesTotal: number;
    estimatedRub: number;
  };
}

const CHILD_TERMINAL = ['done', 'stopped', 'limit_reached', 'budget_exceeded', 'error'];

function safeIso(ms: number | undefined): string {
  return ms ? new Date(ms).toISOString() : '';
}

/** Собрать полную сборку надзирателя из файловой памяти */
export async function buildSupervisorAssembly(metaRunId: string): Promise<SupervisorExport> {
  const state = await readMemoryFile<MetaState>(metaRunId, 'meta-state.json');
  if (!state) {
    throw new Error('Состояние мета-лупа не найдено (meta-state.json) — нечего экспортировать');
  }

  // ---- Файловая память мета-лупа ----
  const metaFiles = await listMemoryFiles(metaRunId);
  const metaMemoryFiles: ExportedMemoryFile[] = await Promise.all(
    metaFiles.map(async (f) => {
      if (f.size > MAX_INLINE_FILE_BYTES) {
        return { ...f, content: null, truncated: true };
      }
      const content = await readMemoryFile(metaRunId, f.name);
      return { ...f, content, truncated: false };
    })
  );

  // ---- Дочерние лупы ----
  const children: ExportedChild[] = await Promise.all(
    state.children.map(async (slot) => {
      const childState = await readMemoryFile<LoopState>(slot.childRunId, 'state.json');
      const files = await listMemoryFiles(slot.childRunId);
      const memoryFiles: ExportedMemoryFile[] = await Promise.all(
        files.map(async (f) => {
          if (f.size > MAX_INLINE_FILE_BYTES) {
            return { ...f, content: null, truncated: true };
          }
          const content = await readMemoryFile(slot.childRunId, f.name);
          return { ...f, content, truncated: false };
        })
      );
      return {
        index: slot.index,
        childRunId: slot.childRunId,
        subGoal: slot.subGoal,
        status: childState?.status || slot.status,
        reformulations: slot.reformulations,
        needsRestart: slot.needsRestart,
        restartReason: slot.restartReason,
        lastScore: childState?.bestScore ?? slot.lastScore,
        iterations: childState?.iteration ?? 0,
        tokens: childState?.debts.tokens ?? 0,
        moneyRub: childState?.debts.moneyRub ?? 0,
        timeMs: childState?.debts.timeMs ?? 0,
        bestDraft: childState?.bestDraft ?? null,
        state: childState,
        memoryFiles,
      };
    })
  );

  const memoryFilesTotal =
    metaMemoryFiles.length + children.reduce((acc, c) => acc + c.memoryFiles.length, 0);

  return {
    format: SUPERVISOR_EXPORT_FORMAT,
    formatVersion: SUPERVISOR_EXPORT_FORMAT_VERSION,
    engine: 'fortorium-meta-loop-v6',
    appVersion: CLIENT_VERSION,
    exportedAt: new Date().toISOString(),
    metaRunId: state.metaRunId,
    status: state.status,
    stopReason: state.stopReason,
    task: state.task,
    assembly: {
      best: state.bestAssembly,
      bestScore: state.bestAssemblyScore,
      last: state.assembly,
    },
    children,
    debts: state.debts,
    history: state.history,
    metaMemoryFiles,
    stats: {
      childrenTotal: children.length,
      childrenDone: children.filter((c) => CHILD_TERMINAL.includes(c.status)).length,
      totalChildIterations: children.reduce((acc, c) => acc + c.iterations, 0),
      metaIterations: state.history.length,
      wallTimeMs: Math.max(0, state.updated - state.created),
      memoryFilesTotal,
      estimatedRub: state.debts.moneyRub,
    },
  };
}

// ============================================================
// Markdown-паспорт сборки (человек-читаемый отчёт)
// ============================================================

const STATUS_RU: Record<string, string> = {
  ready: 'готов',
  running: 'крутится',
  waiting_approval: 'ждёт одобрения',
  done: 'порог достигнут',
  stopped: 'остановлен человеком',
  limit_reached: 'лимит витков',
  budget_exceeded: 'бюджет исчерпан',
  error: 'ошибка',
  not_created: 'не создан',
};

function fmtRub(rub: number): string {
  return `${rub.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ₽`;
}

export function supervisorExportToMarkdown(doc: SupervisorExport): string {
  const L: string[] = [];
  const t = doc.task;

  L.push(`# 🪆 Сборка надзирателя — ФОРТОРИУМ`);
  L.push('');
  L.push(`> Формат: \`${doc.format} v${doc.formatVersion}\` · движок: \`${doc.engine}\` · приложение: v${doc.appVersion}`);
  L.push(`> Экспортировано: ${doc.exportedAt} · run: \`${doc.metaRunId}\` · статус: **${STATUS_RU[doc.status] || doc.status}**`);
  if (doc.stopReason) {
    L.push(`> Причина остановки: ${doc.stopReason}`);
  }
  L.push('');

  // ---- Глобальная цель и паспорт задачи ----
  L.push(`## 🎯 Глобальная цель`);
  L.push('');
  L.push(t.goal);
  L.push('');
  L.push(`## 📋 Паспорт задачи (стоп-критерии надзирателя)`);
  L.push('');
  L.push(`| Параметр | Значение |`);
  L.push(`|---|---|`);
  L.push(`| Тип артефакта детей | ${t.artifactType} |`);
  L.push(`| Дочерних лупов | ${t.childCount} |`);
  L.push(`| Лимит мета-витков | ${t.maxMetaIterations} |`);
  L.push(`| Витков у ребёнка | ${t.childMaxIterations} |`);
  L.push(`| Порог качества ребёнка | ${t.childQualityThreshold}/10 |`);
  L.push(`| Порог качества сборки | ${t.metaQualityThreshold}/10 |`);
  L.push(`| Общий бюджет | ${t.maxTokens.toLocaleString('ru-RU')} токенов |`);
  L.push(`| Авто-режим (внешний круг) | ${t.autoMode ? 'включён' : 'выключен — ворота одобрения'} |`);
  L.push('');

  // ---- Дерево детей ----
  L.push(`## 🌳 Дерево дочерних лупов (${doc.stats.childrenDone}/${doc.stats.childrenTotal} завершены)`);
  L.push('');
  if (doc.children.length === 0) {
    L.push(`_Дочерние лупы ещё не созданы._`);
  } else {
    L.push(`| № | Подцель | Статус | Балл | Витков | Перезапуски |`);
    L.push(`|---|---|---|---|---|---|`);
    for (const c of doc.children) {
      const restarts = c.reformulations > 0 ? `↻ ×${c.reformulations}` : '—';
      L.push(
        `| ${c.index + 1} | ${c.subGoal.replace(/\|/g, '/')} | ${STATUS_RU[c.status] || c.status} | ${c.lastScore}/10 | ${c.iterations} | ${restarts} |`
      );
    }
  }
  L.push('');

  // ---- Сборка ----
  L.push(`## 📦 Итоговая сборка${doc.assembly.bestScore ? ` — ${doc.assembly.bestScore}/10` : ''}`);
  L.push('');
  if (doc.assembly.best) {
    L.push(doc.assembly.best);
  } else {
    L.push(`_Сборка ещё не собрана (надзиратель не завершил работу)._`);
  }
  L.push('');

  // ---- Три долга ----
  L.push(`## 💳 Три долга (агрегировано: дети + надзиратель)`);
  L.push('');
  L.push(`| Долг | Значение |`);
  L.push(`|---|---|`);
  L.push(`| Токены | ${doc.debts.tokens.toLocaleString('ru-RU')} |`);
  L.push(`| Деньги (демо-тариф) | ${fmtRub(doc.debts.moneyRub)} |`);
  L.push(`| Время | ${(doc.debts.timeMs / 1000).toFixed(1)} с (чистое время витков) · ${(doc.stats.wallTimeMs / 1000).toFixed(1)} с (полное время run) |`);
  L.push(`| Техдолг | ${doc.debts.techDebt}% |`);
  L.push(`| Переделки | ${doc.debts.retries} · проваленных проверок: ${doc.debts.failedChecks} |`);
  L.push('');

  // ---- Журнал мета-витков ----
  L.push(`## 📖 Журнал мета-витков (${doc.history.length})`);
  L.push('');
  if (doc.history.length === 0) {
    L.push(`_Мета-витков ещё не было._`);
  } else {
    for (const rec of doc.history) {
      const decision =
        rec.decision === 'finish' ? 'собрать финал' :
        rec.decision === 'restart_weak' ? 'перезапустить слабого' : 'продолжить';
      L.push(`### Мета-виток №${rec.n} — решение: ${decision}`);
      L.push('');
      if (rec.plan?.strategy) L.push(`**Стратегия:** ${rec.plan.strategy}`);
      if (rec.plan?.notes) L.push(`**Заметка надзирателя:** ${rec.plan.notes}`);
      if (rec.critique) {
        L.push(`**Мета-критик:** ${rec.critique.score}/10 — ${rec.critique.weaknesses}`);
        if (rec.critique.improvements) L.push(`**Что улучшить:** ${rec.critique.improvements}`);
      }
      L.push(`_🪙 ${rec.tokens.toLocaleString('ru-RU')} токенов · ⏱ ${(rec.ms / 1000).toFixed(1)} с_`);
      L.push('');
    }
  }

  // ---- Лучшие черновики детей ----
  const withDrafts = doc.children.filter((c) => c.bestDraft);
  if (withDrafts.length > 0) {
    L.push(`## ✍️ Лучшие черновики дочерних лупов`);
    L.push('');
    for (const c of withDrafts) {
      L.push(`### Луп №${c.index + 1}: ${c.subGoal} (${c.lastScore}/10)`);
      L.push('');
      L.push(c.bestDraft as string);
      L.push('');
    }
  }

  // ---- Файловая память ----
  L.push(`## 🗂 Файловая память (${doc.stats.memoryFilesTotal} файлов)`);
  L.push('');
  L.push(`Память «чистых агентов»: каждый виток читает состояние из файлов, а не из диалога.`);
  L.push('');
  L.push(`**Мета-луп:** ${doc.metaMemoryFiles.map((f) => `\`${f.name}\``).join(', ') || '—'}`);
  for (const c of doc.children) {
    const names = c.memoryFiles.map((f) => `\`${f.name}\``).join(', ');
    L.push(`**Луп №${c.index + 1}** (\`${c.childRunId}\`): ${names || '—'}`);
  }
  L.push('');
  L.push(`_Полное содержимое файлов памяти — в JSON-версии экспорта (\`${doc.format} v${doc.formatVersion}\`)._`);

  return L.join('\n');
}
