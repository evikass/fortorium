import { NextRequest, NextResponse } from 'next/server';
import { listMemoryFiles, readMemoryFile, memoryBackend } from '@/lib/loop/file-memory';

export const runtime = 'nodejs';

/**
 * API памяти цикла (v5.0 → v6.0: бэкенд — Vercel Blob или локальная ФС).
 *
 * GET ?runId=...                 — список файлов памяти run'а (name, size, mtime) + активный backend
 * GET ?runId=...&file=state.json — содержимое конкретного файла
 */

export async function GET(req: NextRequest) {
  try {
    const runId = req.nextUrl.searchParams.get('runId') || '';
    if (!runId) return NextResponse.json({ ok: false, error: 'Нет runId' }, { status: 400 });

    const file = req.nextUrl.searchParams.get('file');
    if (file) {
      // Читаем содержимое одного файла (name уже path.basename-безопасен внутри readMemoryFile)
      const content = await readMemoryFile(runId, file);
      if (content === null) {
        return NextResponse.json({ ok: false, error: 'Файл не найден' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, name: file, content, backend: memoryBackend() });
    }

    const files = await listMemoryFiles(runId);
    return NextResponse.json({ ok: true, files, backend: memoryBackend() });
  } catch (error) {
    console.error('[API/loop/memory] error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
