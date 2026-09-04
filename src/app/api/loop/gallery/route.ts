import { NextRequest, NextResponse } from 'next/server';
import { sanitizeRunId } from '@/lib/loop/file-memory';
import {
  publishToGallery, listGallery, readGalleryEntry, deleteGalleryEntry,
  galleryEntryToMarkdown, galleryBackend, GALLERY_NAMESPACE,
} from '@/lib/loop/gallery';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * API галереи сборок (v6.3) — публичная библиотека портативных run-ов.
 *
 * Хранилище: memory-store, псевдо-run «gallery» (Vercel Blob или локальная ФС).
 * ВАЖНО: id записи прогоняется через sanitizeRunId — он попадает в имя файла.
 *
 * GET                                — список сборок (лёгкие карточки-метаданные)
 * GET ?id=…                          — полная запись (документ сборки) для импорта
 * GET ?id=…&download=json           — скачать сборку файлом
 * GET ?id=…&download=md             — скачать Markdown-паспорт сборки
 * POST { runId }                     — опубликовать сборку одиночного лупа
 * POST { metaRunId }                 — опубликовать сборку надзирателя
 * POST { doc }                       — опубликовать готовый документ (загрузка файла)
 * DELETE ?id=…                       — убрать сборку из галереи
 */

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const download = req.nextUrl.searchParams.get('download');

    // Список
    if (!id) {
      const entries = await listGallery();
      return NextResponse.json({ ok: true, backend: galleryBackend(), entries });
    }

    const safeId = sanitizeRunId(id);
    const entry = await readGalleryEntry(safeId);
    if (!entry) {
      return NextResponse.json({ ok: false, error: 'Запись галереи не найдена' }, { status: 404 });
    }

    // Скачивание файлом
    if (download) {
      if (!['json', 'md'].includes(download)) {
        return NextResponse.json({ ok: false, error: `Неизвестный формат: ${download}` }, { status: 400 });
      }
      if (download === 'md') {
        return new NextResponse(galleryEntryToMarkdown(entry), {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="fortorium-gallery-${safeId}.md"`,
          },
        });
      }
      return new NextResponse(JSON.stringify(entry.doc, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="fortorium-gallery-${safeId}.json"`,
        },
      });
    }

    // Полная запись (для восстановления run через /api/loop | /api/loop/meta action=import)
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    console.error('[API/loop/gallery] GET error:', error);
    return NextResponse.json({ ok: false, error: String(error instanceof Error ? error.message : error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Безопасность: входные id попадают в сборку → путь/ключ хранилища
    if (typeof body.runId === 'string') body.runId = sanitizeRunId(body.runId);
    if (typeof body.metaRunId === 'string') body.metaRunId = sanitizeRunId(body.metaRunId);

    const result = await publishToGallery(body);
    return NextResponse.json({
      ok: true,
      publish: result,
      note: result.replaced
        ? `Сборка run ${result.runId} обновлена в галерее (запись ${result.entryId})`
        : `Сборка опубликована в галерее (запись ${result.entryId})`,
    });
  } catch (error) {
    console.error('[API/loop/gallery] POST error:', error);
    return NextResponse.json({ ok: false, error: String(error instanceof Error ? error.message : error) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'Нет id записи' }, { status: 400 });

    const safeId = sanitizeRunId(id);
    const deleted = await deleteGalleryEntry(safeId);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'Запись галереи не найдена' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted: safeId, namespace: GALLERY_NAMESPACE });
  } catch (error) {
    console.error('[API/loop/gallery] DELETE error:', error);
    return NextResponse.json({ ok: false, error: String(error instanceof Error ? error.message : error) }, { status: 500 });
  }
}
