// ============================================================
// ФОРТОРИУМ v6.2 — Импорт сборки: воспроизведение run из JSON
//
// Экспортный документ (fortorium-supervisor-assembly или
// fortorium-loop-assembly) содержит ВСЮ файловую память run-а
// инлайном. Импорт записывает эти файлы обратно в хранилище
// (Vercel Blob или локальную ФС) под теми же runId — run
// восстанавливается в исходном виде:
//   • история витков и мета-витков на месте
//   • дерево детей восстановлено (их state.json, iteration-*.json)
//   • завершённый run снова виден в UI и повторно экспортируем
//   • НЕзавершённый run можно ПРОДОЛЖИТЬ: следующий виток
//     читает восстановленное состояние и идёт дальше (чистые
//     агенты не видят разницы — они всегда читают только файлы)
//
// Обоснование из философии луп-инженеринга: состояние агента —
// это его файлы. Переносишь файлы — переносишь агента.
// ============================================================

import { writeMemoryFile } from './memory-store';

export interface ImportableMemoryFile {
  name: string;
  content: string | unknown | null;
  truncated?: boolean;
}

export interface RestoreResult {
  restored: number;
  skipped: number;
}

/** Восстановить файлы памяти одного run-а из экспортного документа */
export async function restoreMemoryFiles(
  runId: string,
  files: ImportableMemoryFile[] | undefined
): Promise<RestoreResult> {
  let restored = 0;
  let skipped = 0;
  if (!Array.isArray(files)) return { restored, skipped };

  for (const f of files) {
    // Файлы, экспортированные только метаданными (content=null), восстановить нельзя
    if (!f || typeof f.name !== 'string' || f.content === null || f.content === undefined) {
      skipped++;
      continue;
    }
    try {
      await writeMemoryFile(runId, f.name, f.content);
      restored++;
    } catch (e) {
      console.error(`[AssemblyImport] Не удалось восстановить ${runId}/${f.name}:`, e);
      skipped++;
    }
  }
  return { restored, skipped };
}

// ---------- Валидация экспортных документов ----------

export function isValidSupervisorDoc(doc: unknown): doc is Record<string, unknown> {
  return (
    !!doc && typeof doc === 'object' &&
    (doc as Record<string, unknown>).format === 'fortorium-supervisor-assembly'
  );
}

export function isValidLoopDoc(doc: unknown): doc is Record<string, unknown> {
  return (
    !!doc && typeof doc === 'object' &&
    (doc as Record<string, unknown>).format === 'fortorium-loop-assembly'
  );
}
