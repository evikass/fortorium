import { NextRequest, NextResponse } from 'next/server';
import { listMemoryFiles, readMemoryFile } from '@/lib/loop/file-memory';

export const runtime = 'nodejs';

/**
 * API файловой памяти цикла (v5.0 → починено в v5.1: файл существовал не во всех деплоях).
 *
 * GET ?runId=...                 — список файлов памяти run'а (name, size, mtime)
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
      return NextResponse.json({ ok: true, name: file, content });
    }

    const files = await listMemoryFiles(runId);
    return NextResponse.json({ ok: true, files });
  } catch (error) {
    console.error('[API/loop/memory] error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
