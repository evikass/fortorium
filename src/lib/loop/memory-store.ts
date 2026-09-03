// ============================================================
// ФОРТОРИУМ v6.0 — Хранилище памяти цикла: Vercel Blob + локальная ФС
//
// Проблема v5.x: память жила в локальной ФС (cwd/memory или /tmp).
// На Vercel серверлес-функции эфемерны — файлы исчезали между вызовами,
// и история витков «чистых агентов» умирала вместе с контейнером.
//
// v6.0: память переехала в Vercel Blob — персистентное объектное хранилище.
// Стабильные ключи: fortorium-memory/<runId>/<name> (без случайных суффиксов),
// поэтому read-after-write и перезапуски деплоя ничего не ломают.
//
// Надёжность:
//  • BLOB_READ_WRITE_TOKEN задан  → пишем в Blob; при ошибке — фоллбэк на ФС;
//  • токена нет (локальная разработка) → работаем на ФС как в v5.x.
//
// Философия луп-инженеринга не меняется: память передаётся НЕ внутри диалога
// (контекст переполняется), а через ФАЙЛЫ. Каждый агент — «чистый»:
// нулевой контекст, читает только последний сохранённый файл состояния.
// ============================================================

import { put, get, list, del } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export type MemoryBackend = 'vercel-blob' | 'local-fs';

export interface MemoryFileMeta {
  name: string;
  size: number;
  mtime: number;
}

const BLOB_PREFIX = 'fortorium-memory';

const blobConfigured = (): boolean => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Какой бэкенд памяти активен прямо сейчас (для бейджа в UI)
export function memoryBackend(): MemoryBackend {
  return blobConfigured() ? 'vercel-blob' : 'local-fs';
}

// ---------- Локальная ФС: фоллбэк и режим локальной разработки ----------

export function getMemoryDir(): string {
  return path.join(process.cwd(), 'memory');
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

// cwd/memory, а если запись невозможна — /tmp/fortorium-memory
async function resolveRunDir(runId: string): Promise<{ dir: string; fallback: boolean }> {
  const primary = path.join(getMemoryDir(), runId);
  try {
    await ensureDir(primary);
    const probe = path.join(primary, '.probe');
    await fs.writeFile(probe, 'ok');
    await fs.unlink(probe);
    return { dir: primary, fallback: false };
  } catch {
    const fb = path.join(os.tmpdir(), 'fortorium-memory', runId);
    await ensureDir(fb);
    return { dir: fb, fallback: true };
  }
}

const runDirs = (runId: string): string[] => [
  path.join(getMemoryDir(), runId),
  path.join(os.tmpdir(), 'fortorium-memory', runId),
];

// ---------- Ключи Blob и сортировка списка файлов ----------

const blobKey = (runId: string, name: string): string => `${BLOB_PREFIX}/${runId}/${name}`;

// run.json/state.json первыми, финальные файлы последними, итерации по номеру
const sortMemoryFiles = (a: MemoryFileMeta, b: MemoryFileMeta): number => {
  const head = (n: string): number => (n === 'run.json' ? 0 : n === 'state.json' || n === 'meta-state.json' ? 1 : 2);
  const tail = (n: string): number => (n === 'final.json' || n === 'meta-final.json' ? 1 : 0);
  if (head(a.name) !== head(b.name)) return head(a.name) - head(b.name);
  if (tail(a.name) !== tail(b.name)) return tail(a.name) - tail(b.name);
  return a.name.localeCompare(b.name, undefined, { numeric: true });
};

// ---------- Публичный API (совместим с файловой памятью v5.x) ----------

// Записать файл памяти для run'а. name вида "state.json", "iteration-1.json", "meta-state.json"
export async function writeMemoryFile(
  runId: string,
  name: string,
  data: unknown
): Promise<{ file: string; fallback: boolean }> {
  const safeName = path.basename(name);
  const payload = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  // 1) Vercel Blob — персистентное хранилище (прод)
  if (blobConfigured()) {
    try {
      await put(blobKey(runId, safeName), payload, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json; charset=utf-8',
      });
      return { file: `${runId}/${safeName}`, fallback: false };
    } catch (e) {
      console.error('[MemoryStore] Ошибка записи в Blob, фоллбэк на локальную ФС:', e);
    }
  }

  // 2) Локальная ФС — локальная разработка / аварийный фоллбэк
  const { dir, fallback } = await resolveRunDir(runId);
  await fs.writeFile(path.join(dir, safeName), payload, 'utf-8');
  return { file: `${runId}/${safeName}`, fallback: blobConfigured() ? true : fallback };
}

// Прочитать файл памяти (возвращает null, если файла нет)
export async function readMemoryFile<T = unknown>(runId: string, name: string): Promise<T | null> {
  const safeName = path.basename(name);

  if (blobConfigured()) {
    try {
      const blob = await get(blobKey(runId, safeName));
      if (blob) {
        const raw = await blob.text();
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T; // не-JSON текст
        }
      }
      // в Blob файла нет — возможно, он остался с локальной ФС; проверим ниже
    } catch (e) {
      console.error('[MemoryStore] Ошибка чтения из Blob, пробуем локальную ФС:', e);
    }
  }

  for (const dir of runDirs(runId)) {
    try {
      const raw = await fs.readFile(path.join(dir, safeName), 'utf-8');
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch {
      // пробуем следующий путь
    }
  }
  return null;
}

// Список файлов памяти run'а с метаданными
export async function listMemoryFiles(runId: string): Promise<MemoryFileMeta[]> {
  if (blobConfigured()) {
    try {
      const result = await list({ prefix: `${BLOB_PREFIX}/${runId}/`, limit: 1000 });
      const files: MemoryFileMeta[] = result.blobs
        .map((b) => ({
          name: b.pathname.slice(b.pathname.lastIndexOf('/') + 1),
          size: b.size,
          mtime: new Date(b.uploadedAt).getTime(),
        }))
        .filter((f) => f.name && !f.name.startsWith('.'));
      files.sort(sortMemoryFiles);
      return files;
    } catch (e) {
      console.error('[MemoryStore] Ошибка списка Blob, пробуем локальную ФС:', e);
    }
  }

  // Локальная ФС: объединяем оба каталога, дедуп по имени (берём самую свежую версию)
  const byName = new Map<string, MemoryFileMeta>();
  for (const dir of runDirs(runId)) {
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      try {
        const st = await fs.stat(path.join(dir, entry));
        if (!st.isFile()) continue;
        const prev = byName.get(entry);
        if (!prev || st.mtimeMs > prev.mtime) {
          byName.set(entry, { name: entry, size: st.size, mtime: st.mtimeMs });
        }
      } catch {
        // ignore
      }
    }
  }
  const files = [...byName.values()];
  files.sort(sortMemoryFiles);
  return files;
}

// Создать новый run: файл run.json с задачей и меткой времени
export async function initRun(runId: string, task: unknown): Promise<void> {
  await writeMemoryFile(runId, 'run.json', {
    runId,
    task,
    created: Date.now(),
    engine: 'fortorium-loop-v6',
    storage: memoryBackend(),
    concept: 'clean-agents: zero dialog context, memory via files only',
  });
}

// Удалить run (полный сброс): чистим Blob и локальные каталоги
export async function deleteRun(runId: string): Promise<void> {
  if (blobConfigured()) {
    try {
      const result = await list({ prefix: `${BLOB_PREFIX}/${runId}/`, limit: 1000 });
      if (result.blobs.length) {
        await del(result.blobs.map((b) => b.url));
      }
    } catch (e) {
      console.error('[MemoryStore] Ошибка удаления из Blob:', e);
    }
  }
  for (const dir of runDirs(runId)) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
