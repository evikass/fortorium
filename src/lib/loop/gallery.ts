// ============================================================
// ФОРТОРИУМ v6.3 — Галерея сборок: публичная библиотека run-ов
//
// Идея: экспортные документы (fortorium-loop-assembly и
// fortorium-supervisor-assembly) уже портативны — их можно скачать
// и восстановить на другой машине. Галерея делает следующий шаг:
// сборки публикуются ВНУТРИ сайта, и любой посетитель может
//   • посмотреть паспорт сборки (цель, балл, долги, происхождение)
//   • скачать JSON / Markdown-паспорт
//   • восстановить run в памяти (импорт) и продолжить цикл
//   • вернуть лучший текст обратно в демо-режим как сцену
//
// Хранилище: тот же memory-store (Vercel Blob при наличии токена,
// иначе локальная ФС). Записи живут в псевдо-run «gallery» —
// файлы <entryId>.json. Это значит, что на проде с local-fs
// галерея эфемерна так же, как run-память, и вылечится подключением
// Blob Store — отдельной инфраструктуры не нужно.
//
// Upsert: повторная публикация сборки того же run обновляет запись
// (по doc.runId / doc.metaRunId), а не плодит дубликаты.
// ============================================================

import { readMemoryFile, listMemoryFiles, writeMemoryFile, deleteMemoryFile, memoryBackend, MemoryBackend } from './memory-store';
import { buildLoopAssembly, LoopExport, loopExportToMarkdown } from './loop-export';
import { buildSupervisorAssembly, SupervisorExport, supervisorExportToMarkdown } from './supervisor-export';
import { isValidLoopDoc, isValidSupervisorDoc } from './assembly-import';

export const GALLERY_NAMESPACE = 'gallery'; // псевдо-run в memory-store
export const MAX_GALLERY_DOC_BYTES = 5 * 1024 * 1024; // разумный потолок размера сборки

export type GalleryKind = 'loop' | 'supervisor';

// Форма записи в хранилище
export interface GalleryEntry {
  id: string;
  kind: GalleryKind;
  publishedAt: number;
  doc: LoopExport | SupervisorExport | Record<string, unknown>;
}

// Строка списка (без полного документа — список должен быть лёгким)
export interface GallerySummary {
  id: string;
  kind: GalleryKind;
  publishedAt: number;
  runId: string;
  goal: string;
  artifactType: string;
  status: string;
  bestScore: number;
  sceneRef?: { sceneNumber: number; sceneTitle: string };
  tokens: number;
  moneyRub: number;
  iterations: number;
  bytes: number;
  appVersion: string;
}

const newEntryId = (): string =>
  `gal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function docRunId(doc: Record<string, unknown>): string {
  return String(doc.runId || doc.metaRunId || '');
}

function summarize(id: string, kind: GalleryKind, publishedAt: number, bytes: number, doc: Record<string, unknown>): GallerySummary {
  const task = (doc.task || {}) as Record<string, unknown>;
  const debts = (doc.debts || {}) as Record<string, number>;

  // балл: у одиночного лупа result.bestScore, у надзирателя assembly.bestScore
  let bestScore = 0;
  if (kind === 'loop') {
    bestScore = Number((doc.result as Record<string, unknown> | undefined)?.bestScore) || 0;
  } else {
    bestScore = Number((doc.assembly as Record<string, unknown> | undefined)?.bestScore) || 0;
  }

  const iterations =
    kind === 'loop'
      ? Array.isArray(doc.iterations) ? doc.iterations.length : 0
      : Array.isArray(doc.history) ? doc.history.length : 0;

  return {
    id,
    kind,
    publishedAt,
    runId: docRunId(doc),
    goal: String(task.goal || '').slice(0, 300),
    artifactType: String(task.artifactType || ''),
    status: String(doc.status || ''),
    bestScore,
    sceneRef: task.sceneRef as GallerySummary['sceneRef'],
    tokens: Number(debts.tokens) || 0,
    moneyRub: Number(debts.moneyRub) || 0,
    iterations,
    bytes,
    appVersion: String(doc.appVersion || ''),
  };
}

// ---------- Публикация ----------

/**
 * Опубликовать сборку в галерее.
 *  - { runId }     → собрать сборку одиночного лупа и опубликовать
 *  - { metaRunId } → собрать сборку надзирателя и опубликовать
 *  - { doc }       → опубликовать готовый документ (загрузка файла)
 * Повторная публикация того же run обновляет существующую запись (upsert).
 */
export async function publishToGallery(
  input: { runId?: string; metaRunId?: string; doc?: unknown }
): Promise<{ entryId: string; kind: GalleryKind; runId: string; replaced: boolean; bytes: number }> {
  let doc: Record<string, unknown>;
  let kind: GalleryKind;

  if (input.doc !== undefined) {
    const d = input.doc as Record<string, unknown>;
    if (isValidSupervisorDoc(d)) {
      kind = 'supervisor';
    } else if (isValidLoopDoc(d)) {
      kind = 'loop';
    } else {
      throw new Error('Документ не распознан: ожидался fortorium-loop-assembly или fortorium-supervisor-assembly');
    }
    doc = d;
  } else if (input.metaRunId) {
    doc = (await buildSupervisorAssembly(input.metaRunId)) as unknown as Record<string, unknown>;
    kind = 'supervisor';
  } else if (input.runId) {
    doc = (await buildLoopAssembly(input.runId)) as unknown as Record<string, unknown>;
    kind = 'loop';
  } else {
    throw new Error('Нечего публиковать: передайте runId, metaRunId или doc');
  }

  const runId = docRunId(doc);
  if (!runId) throw new Error('В документе нет runId/metaRunId — публикация невозможна');

  const payload = JSON.stringify({ doc, kind, publishedAt: 0 });
  if (payload.length > MAX_GALLERY_DOC_BYTES) {
    throw new Error(`Сборка слишком велика для галереи: ${(payload.length / 1024 / 1024).toFixed(1)} МБ (лимит 5 МБ)`);
  }

  // Upsert по runId: повторная публикация того же run обновляет СУЩЕСТВУЮЩУЮ запись
  // (id сохраняется — ссылки на скачивание остаются живыми)
  let entryId = newEntryId();
  let replaced = false;
  const existing = await listGallery();
  for (const s of existing) {
    if (s.runId === runId && s.kind === kind) {
      entryId = s.id;
      replaced = true;
      break;
    }
  }

  const entry: GalleryEntry = { id: entryId, kind, publishedAt: Date.now(), doc };
  await writeMemoryFile(GALLERY_NAMESPACE, `${entryId}.json`, entry);

  return { entryId, kind, runId, replaced, bytes: JSON.stringify(entry).length };
}

// ---------- Чтение ----------

export async function listGallery(): Promise<GallerySummary[]> {
  const files = await listMemoryFiles(GALLERY_NAMESPACE);
  const summaries: GallerySummary[] = [];

  for (const f of files) {
    if (!f.name.endsWith('.json')) continue;
    const entry = await readMemoryFile<GalleryEntry>(GALLERY_NAMESPACE, f.name);
    if (!entry || typeof entry !== 'object' || !entry.doc || !entry.id) continue;
    const kind: GalleryKind = entry.kind === 'supervisor' ? 'supervisor' : 'loop';
    try {
      summaries.push(summarize(entry.id, kind, entry.publishedAt || f.mtime, f.size, entry.doc as Record<string, unknown>));
    } catch {
      // битая запись — пропускаем, не роняя весь список
    }
  }

  // свежие сверху
  summaries.sort((a, b) => b.publishedAt - a.publishedAt);
  return summaries;
}

export async function readGalleryEntry(id: string): Promise<GalleryEntry | null> {
  return readMemoryFile<GalleryEntry>(GALLERY_NAMESPACE, `${id}.json`);
}

export async function deleteGalleryEntry(id: string): Promise<boolean> {
  const entry = await readGalleryEntry(id);
  if (!entry) return false;
  await deleteMemoryFile(GALLERY_NAMESPACE, `${id}.json`);
  return true;
}

// ---------- Markdown-паспорт записи галереи ----------

export function galleryEntryToMarkdown(entry: GalleryEntry): string {
  const header = [
    `# 🗂 Галерея сборок — ФОРТОРИУМ`,
    '',
    `> Запись галереи: \`${entry.id}\` · опубликовано: ${new Date(entry.publishedAt).toISOString()}`,
    '',
  ].join('\n');

  const doc = entry.doc as Record<string, unknown>;
  if (entry.kind === 'supervisor') {
    return header + supervisorExportToMarkdown(doc as unknown as SupervisorExport);
  }
  return header + loopExportToMarkdown(doc as unknown as LoopExport);
}

export function galleryBackend(): MemoryBackend {
  return memoryBackend();
}
