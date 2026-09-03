// ============================================================
// ФОРТОРИУМ v6.0 — Файловая память цикла (фасад совместимости)
//
// v5.x: реализация жила здесь и писала в локальную ФС.
// v6.0: реализация переехала в memory-store.ts — память хранится
// в Vercel Blob (персистентно на проде), с автоматическим фоллбэком
// на локальную ФС для локальной разработки.
//
// Все экспортируемые имена сохранены, поэтому потребители
// (loop-engine, meta-loop, API-роуты) не меняются.
// ============================================================

export {
  writeMemoryFile,
  readMemoryFile,
  listMemoryFiles,
  initRun,
  deleteRun,
  memoryBackend,
  getMemoryDir,
  sanitizeRunId,
} from './memory-store';

export type { MemoryBackend, MemoryFileMeta } from './memory-store';
