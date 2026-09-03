// ============================================================
// ФОРТОРИУМ v6.2 — Экспорт сборки одиночного лупа
//
// Аналог экспорта надзирателя (supervisor-export.ts), но для
// одного цикла: задача со стоп-критериями, журнал витков
// (план → черновик → скрипт-проверки → критик), лучший черновик,
// три долга и файловая память «чистого агента».
//
// Форматы:
//   JSON — машина-читаемая полная сборка (fortorium-loop-assembly v1)
//   Markdown — человек-читаемый паспорт цикла
//
// Экспорт + импорт делают run ПОРТАТИВНЫМ: скачал на одной машине —
// восстановил на другой и продолжил крутить цикл с того же места.
// ============================================================

import { LoopState, LoopTask } from './types';
import { readMemoryFile, listMemoryFiles, MemoryFileMeta } from './memory-store';
import { CLIENT_VERSION } from '@/lib/version';

export const LOOP_EXPORT_FORMAT = 'fortorium-loop-assembly';
export const LOOP_EXPORT_FORMAT_VERSION = 1;

// Файлы памяти больше этого размера экспортируются метаданными (без содержимого)
const MAX_INLINE_FILE_BYTES = 256 * 1024;

export interface ExportedMemoryFile extends MemoryFileMeta {
  content: string | unknown | null;
  truncated: boolean;
}

export interface LoopExport {
  format: string;
  formatVersion: number;
  engine: string;
  appVersion: string;
  exportedAt: string;
  runId: string;
  status: string;
  stopReason: string | null;
  task: LoopTask;
  result: {
    best: string | null;
    bestScore: number;
    lastCritique: LoopState['lastCritique'];
  };
  debts: LoopState['debts'];
  iterations: LoopState['iterations'];
  memoryFiles: ExportedMemoryFile[];
  stats: {
    iterations: number;
    wallTimeMs: number;
    memoryFilesTotal: number;
    estimatedRub: number;
  };
}

/** Собрать полную сборку одиночного лупа из файловой памяти */
export async function buildLoopAssembly(runId: string): Promise<LoopExport> {
  const state = await readMemoryFile<LoopState>(runId, 'state.json');
  if (!state) {
    throw new Error('Состояние цикла не найдено (state.json) — нечего экспортировать');
  }

  const files = await listMemoryFiles(runId);
  const memoryFiles: ExportedMemoryFile[] = await Promise.all(
    files.map(async (f) => {
      if (f.size > MAX_INLINE_FILE_BYTES) {
        return { ...f, content: null, truncated: true };
      }
      const content = await readMemoryFile(runId, f.name);
      return { ...f, content, truncated: false };
    })
  );

  return {
    format: LOOP_EXPORT_FORMAT,
    formatVersion: LOOP_EXPORT_FORMAT_VERSION,
    engine: 'fortorium-loop-v6',
    appVersion: CLIENT_VERSION,
    exportedAt: new Date().toISOString(),
    runId: state.runId,
    status: state.status,
    stopReason: state.stopReason,
    task: state.task,
    result: {
      best: state.bestDraft,
      bestScore: state.bestScore,
      lastCritique: state.lastCritique,
    },
    debts: state.debts,
    iterations: state.iterations,
    memoryFiles,
    stats: {
      iterations: state.iterations.length,
      wallTimeMs: Math.max(0, state.updated - state.created),
      memoryFilesTotal: memoryFiles.length,
      estimatedRub: state.debts.moneyRub,
    },
  };
}

// ============================================================
// Markdown-паспорт цикла (человек-читаемый отчёт)
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
};

function fmtRub(rub: number): string {
  return `${rub.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ₽`;
}

export function loopExportToMarkdown(doc: LoopExport): string {
  const L: string[] = [];
  const t = doc.task;

  L.push(`# ♾️ Сборка луп-цикла — ФОРТОРИУМ`);
  L.push('');
  L.push(`> Формат: \`${doc.format} v${doc.formatVersion}\` · движок: \`${doc.engine}\` · приложение: v${doc.appVersion}`);
  L.push(`> Экспортировано: ${doc.exportedAt} · run: \`${doc.runId}\` · статус: **${STATUS_RU[doc.status] || doc.status}**`);
  if (doc.stopReason) {
    L.push(`> Причина остановки: ${doc.stopReason}`);
  }
  L.push('');

  // ---- Происхождение задачи (связка с демо-режимом) ----
  if (t.source && t.source !== 'manual') {
    L.push(`## 🔗 Источник задачи`);
    L.push('');
    if (t.sceneRef) {
      L.push(`Демо-режим, сцена №${t.sceneRef.sceneNumber} «${t.sceneRef.sceneTitle}». Цикл стартовал с её текста и дорабатывал его.`);
    } else if (t.sourceLabel) {
      L.push(`${t.sourceLabel}.`);
    } else {
      L.push(`Источник: \`${t.source}\`.`);
    }
    L.push('');
  }

  // ---- Цель и паспорт задачи ----
  L.push(`## 🎯 Цель цикла`);
  L.push('');
  L.push(t.goal);
  L.push('');
  L.push(`## 📋 Паспорт задачи (стоп-критерии)`);
  L.push('');
  L.push(`| Параметр | Значение |`);
  L.push(`|---|---|`);
  L.push(`| Тип артефакта | ${t.artifactType} |`);
  L.push(`| Лимит витков | ${t.maxIterations} |`);
  L.push(`| Порог качества | ${t.qualityThreshold}/10 |`);
  L.push(`| Бюджет | ${t.maxTokens.toLocaleString('ru-RU')} токенов |`);
  L.push(`| Авто-режим | ${t.autoMode ? 'включён (внешний круг отключён)' : 'выключен — ворота одобрения'} |`);
  if (t.initialDraft) {
    L.push(`| Стартовый текст | есть (${t.initialDraft.length} симв. — цикл дорабатывал) |`);
  }
  L.push('');

  // ---- Лучший результат ----
  L.push(`## 🏆 Лучший черновик${doc.result.bestScore ? ` — ${doc.result.bestScore}/10` : ''}`);
  L.push('');
  if (doc.result.best) {
    L.push(doc.result.best);
  } else {
    L.push(`_Черновиков ещё нет — цикл не завершил ни одного витка._`);
  }
  if (doc.result.lastCritique) {
    L.push('');
    L.push(`**Вердикт критика:** ${doc.result.lastCritique.score}/10 — ${doc.result.lastCritique.weaknesses}`);
  }
  L.push('');

  // ---- Три долга ----
  L.push(`## 💳 Три долга`);
  L.push('');
  L.push(`| Долг | Значение |`);
  L.push(`|---|---|`);
  L.push(`| Токены | ${doc.debts.tokens.toLocaleString('ru-RU')} |`);
  L.push(`| Деньги (демо-тариф) | ${fmtRub(doc.debts.moneyRub)} |`);
  L.push(`| Время | ${(doc.debts.timeMs / 1000).toFixed(1)} с (витки) · ${(doc.stats.wallTimeMs / 1000).toFixed(1)} с (полное время run) |`);
  L.push(`| Техдолг | ${doc.debts.techDebt}% |`);
  L.push(`| Переделки | ${doc.debts.retries} · проваленных проверок: ${doc.debts.failedChecks} |`);
  L.push('');

  // ---- Журнал витков ----
  L.push(`## 🔁 Журнал витков (${doc.iterations.length})`);
  L.push('');
  if (doc.iterations.length === 0) {
    L.push(`_Витков ещё не было._`);
  } else {
    for (const rec of doc.iterations) {
      const attempt = rec.attempt > 1 ? ` (переделка №${rec.attempt - 1})` : '';
      L.push(`### Виток №${rec.n}${attempt}`);
      L.push('');
      if (rec.plan?.strategy) L.push(`**План:** ${rec.plan.strategy}`);
      if (rec.draft) L.push(`**Черновик:** ${rec.draft.length > 600 ? `${rec.draft.slice(0, 600)}…` : rec.draft}`);
      const failed = (rec.scriptChecks || []).filter((c) => !c.passed);
      const passedCount = (rec.scriptChecks || []).length - failed.length;
      L.push(`**Скрипт-проверки:** ${passedCount}/${(rec.scriptChecks || []).length} пройдено${failed.length ? ` — провалены: ${failed.map((f) => f.name).join(', ')}` : ''}`);
      if (rec.critique) {
        L.push(`**Критик:** ${rec.critique.score}/10 (${rec.critique.verdict === 'accept' ? 'принять' : 'переделать'}) — ${rec.critique.weaknesses}`);
      }
      L.push(`_🪙 ${rec.tokens.toLocaleString('ru-RU')} токенов · ⏱ ${(rec.ms / 1000).toFixed(1)} с_`);
      L.push('');
    }
  }

  // ---- Файловая память ----
  L.push(`## 🗂 Файловая память (${doc.memoryFiles.length} файлов)`);
  L.push('');
  L.push(`Память «чистых агентов»: цикл читает состояние из файлов, а не из диалога.`);
  L.push('');
  L.push(doc.memoryFiles.map((f) => `\`${f.name}\``).join(', ') || '—');
  L.push('');
  L.push(`_Полное содержимое файлов памяти — в JSON-версии экспорта (\`${doc.format} v${doc.formatVersion}\`)._`);

  return L.join('\n');
}
