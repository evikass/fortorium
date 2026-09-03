// ============================================================
// ФОРТОРИУМ v5.0 — Файловая память цикла
// Идея из видео (Луп-инженеринг): память передаётся НЕ внутри диалога
// (контекст переполняется), а через файлы на диске.
// Каждый новый виток — "чистый агент": нулевой контекст,
// загружает только последний сохранённый файл состояния.
// ============================================================

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Каталог памяти: cwd/memory, а если запись невозможна — /tmp/fortorium-memory
export function getMemoryDir(): string {
  return path.join(process.cwd(), 'memory');
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

// Резолв пути с учётом фоллбэка: пробуем cwd/memory, при ошибке — tmp
async function resolveRunDir(runId: string): Promise<{ dir: string; fallback: boolean }> {
  const primary = path.join(getMemoryDir(), runId);
  try {
    await ensureDir(primary);
    // тестовая запись
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

// Записать файл памяти для run'а. name вида "state.json", "iteration-1.json"
export async function writeMemoryFile(runId: string, name: string, data: unknown): Promise<{ file: string; fallback: boolean }> {
  const safeName = path.basename(name);
  const { dir, fallback } = await resolveRunDir(runId);
  const file = path.join(dir, safeName);
  const payload = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  await fs.writeFile(file, payload, 'utf-8');
  return { file: `${runId}/${safeName}`, fallback };
}

// Прочитать файл памяти (возвращает null, если файла нет)
export async function readMemoryFile<T = unknown>(runId: string, name: string): Promise<T | null> {
  const safeName = path.basename(name);
  const candidates = [
    path.join(getMemoryDir(), runId, safeName),
    path.join(os.tmpdir(), 'fortorium-memory', runId, safeName),
  ];
  for (const file of candidates) {
    try {
      const raw = await fs.readFile(file, 'utf-8');
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T; // не-JSON текст
      }
    } catch {
      // пробуем следующий путь
    }
  }
  return null;
}

// Список файлов памяти run'а с метаданными
export async function listMemoryFiles(runId: string): Promise<Array<{ name: string; size: number; mtime: number }>> {
  const candidates = [path.join(getMemoryDir(), runId), path.join(os.tmpdir(), 'fortorium-memory', runId)];
  for (const dir of candidates) {
    try {
      const entries = await fs.readdir(dir);
      const files: Array<{ name: string; size: number; mtime: number }> = [];
      for (const entry of entries) {
        if (entry.startsWith('.')) continue;
        const stat = await fs.stat(path.join(dir, entry));
        if (stat.isFile()) {
          files.push({ name: entry, size: stat.size, mtime: stat.mtimeMs });
        }
      }
      // state.json первым, итерации по порядку
      files.sort((a, b) => {
        if (a.name === 'run.json') return -1;
        if (b.name === 'run.json') return 1;
        if (a.name === 'state.json') return -1;
        if (b.name === 'state.json') return 1;
        if (a.name === 'final.json') return 1;
        if (b.name === 'final.json') return -1;
        return a.name.localeCompare(b.name);
      });
      return files;
    } catch {
      // пробуем следующий путь
    }
  }
  return [];
}

// Создать новый run: файл run.json с задачей и меткой времени
export async function initRun(runId: string, task: unknown): Promise<void> {
  await writeMemoryFile(runId, 'run.json', {
    runId,
    task,
    created: Date.now(),
    engine: 'fortorium-loop-v5',
    concept: 'clean-agents: zero dialog context, memory via files only',
  });
}

// Удалить run (полный сброс)
export async function deleteRun(runId: string): Promise<void> {
  const candidates = [path.join(getMemoryDir(), runId), path.join(os.tmpdir(), 'fortorium-memory', runId)];
  for (const dir of candidates) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
