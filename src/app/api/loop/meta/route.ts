import { NextRequest, NextResponse } from 'next/server';
import { MetaTask, ArtifactType } from '@/lib/loop/types';
import { createMetaState, runMetaStep, metaHumanDecision } from '@/lib/loop/meta-loop';
import { initRun, writeMemoryFile, readMemoryFile, deleteRun, sanitizeRunId } from '@/lib/loop/file-memory';
import { buildSupervisorAssembly, supervisorExportToMarkdown } from '@/lib/loop/supervisor-export';
import { restoreMemoryFiles, isValidSupervisorDoc } from '@/lib/loop/assembly-import';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * API вложенных лупов (луп над лупом, v5.1).
 *
 * POST { action: 'init' , task }                 — создать мета-run (надзиратель над дочерними лупами)
 * POST { action: 'step' , metaRunId }            — ОДИН мета-виток: план → шаги детей → агрегация → коррекция
 * POST { action: 'accept', metaRunId }           — человек одобрил мета-виток (внешний круг)
 * POST { action: 'stop' , metaRunId }            — человек остановил мета-луп и всех детей под надзором
 * POST { action: 'reset', metaRunId }            — удалить мета-run вместе со всеми дочерними run-каталогами
 * POST { action: 'import', doc }                 — v6.2: воспроизвести мета-run из сборки (fortorium-supervisor-assembly)
 * GET  { ?metaRunId }                            — прочитать meta-state.json
 * GET  { ?metaRunId&export=json }               — экспорт сборки надзирателя (полный JSON-документ)
 * GET  { ?metaRunId&export=md }                 — экспорт сборки надзирателя (Markdown-паспорт)
 */

// v6.2: структурная связка со сценой демо-режима (та же форма, что в одиночном лупе)
function sanitizeSceneRef(raw: unknown): MetaTask['sceneRef'] {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const n = Number(r.sceneNumber);
  const title = typeof r.sceneTitle === 'string' ? r.sceneTitle.trim() : '';
  if (!Number.isFinite(n) || n < 1 || !title) return undefined;
  return { sceneNumber: Math.round(n), sceneTitle: title.slice(0, 200) };
}

function sanitizeMetaTask(raw: Record<string, unknown>): MetaTask | null {
  const goal = typeof raw.goal === 'string' ? raw.goal.trim() : '';
  const artifactType = ['logline', 'scene', 'synopsis'].includes(String(raw.artifactType))
    ? (String(raw.artifactType) as ArtifactType)
    : 'scene';
  if (!goal) return null;
  const clamp = (v: unknown, min: number, max: number, dflt: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : dflt;
  };
  return {
    goal: goal.slice(0, 500),
    artifactType,
    childCount: clamp(raw.childCount, 2, 4, 3),
    maxMetaIterations: clamp(raw.maxMetaIterations, 1, 4, 2),
    childMaxIterations: clamp(raw.childMaxIterations, 1, 6, 2),
    childQualityThreshold: clamp(raw.childQualityThreshold, 1, 10, 7),
    metaQualityThreshold: clamp(raw.metaQualityThreshold, 1, 10, 8),
    maxTokens: clamp(raw.maxTokens, 2000, 800000, 90000),
    autoMode: Boolean(raw.autoMode),
    sceneRef: sanitizeSceneRef(raw.sceneRef),
  };
}

// Собрать полный список run-каталогов для удаления: мета + все возможные дети
function allRunIdsOf(metaRunId: string): string[] {
  return [metaRunId, ...[0, 1, 2, 3].map(i => `${metaRunId}-c${i}`)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || '');

    switch (action) {
      case 'init': {
        const task = sanitizeMetaTask(body.task || {});
        if (!task) {
          return NextResponse.json({ ok: false, error: 'Некорректная задача: нужен goal' }, { status: 400 });
        }
        const metaRunId = `meta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await initRun(metaRunId, { ...task, engine: 'fortorium-meta-loop-v5.1', concept: 'nested loops: supervisor loop over child loops' });
        const state = createMetaState(metaRunId, task);
        await writeMemoryFile(metaRunId, 'meta-state.json', state);
        return NextResponse.json({ ok: true, state });
      }

      case 'step': {
        const metaRunId = sanitizeRunId(String(body.metaRunId || ''));
        const { state, record, stopDecision } = await runMetaStep(metaRunId);
        return NextResponse.json({ ok: true, state, record, stopDecision });
      }

      case 'accept': {
        const metaRunId = sanitizeRunId(String(body.metaRunId || ''));
        const state = await metaHumanDecision(metaRunId, 'accept');
        return NextResponse.json({ ok: true, state });
      }

      case 'stop': {
        const metaRunId = sanitizeRunId(String(body.metaRunId || ''));
        const state = await metaHumanDecision(metaRunId, 'stop');
        return NextResponse.json({ ok: true, state });
      }

      case 'reset': {
        const metaRunId = sanitizeRunId(String(body.metaRunId || ''));
        for (const runId of allRunIdsOf(metaRunId)) {
          await deleteRun(runId);
        }
        return NextResponse.json({ ok: true });
      }

      case 'import': {
        // v6.2: воспроизведение мета-run из сборки надзирателя:
        // восстанавливаем файлы памяти мета-лупа И всех детей —
        // состояние агента это его файлы, переносим файлы — переносим агента
        const doc = body.doc;
        if (!isValidSupervisorDoc(doc)) {
          return NextResponse.json(
            { ok: false, error: 'Это не файл сборки надзирателя: ожидался формат fortorium-supervisor-assembly' },
            { status: 400 }
          );
        }
        const metaRunId = sanitizeRunId(String(doc.metaRunId || ''));
        const metaRes = await restoreMemoryFiles(metaRunId, doc.metaMemoryFiles as never);
        let childRuns = 0;
        let childRestored = 0;
        let childSkipped = 0;
        for (const child of (Array.isArray(doc.children) ? doc.children : []) as Array<Record<string, unknown>>) {
          const childRunId = typeof child.childRunId === 'string' ? child.childRunId.trim() : '';
          if (!childRunId) continue;
          const res = await restoreMemoryFiles(sanitizeRunId(childRunId), child.memoryFiles as never);
          childRuns++;
          childRestored += res.restored;
          childSkipped += res.skipped;
        }
        const state = await readMemoryFile(metaRunId, 'meta-state.json');
        if (!state) {
          return NextResponse.json(
            { ok: false, error: 'В документе нет meta-state.json (или он был слишком велик для инлайна) — восстановление невозможно' },
            { status: 422 }
          );
        }
        return NextResponse.json({
          ok: true,
          state,
          import: {
            meta: metaRes,
            childRuns,
            childFiles: { restored: childRestored, skipped: childSkipped },
          },
        });
      }

      default:
        return NextResponse.json({ ok: false, error: `Неизвестное действие: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[API/loop/meta] error:', error);
    return NextResponse.json({ ok: false, error: String(error instanceof Error ? error.message : error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const rawMetaRunId = req.nextUrl.searchParams.get('metaRunId') || '';
    if (!rawMetaRunId) return NextResponse.json({ ok: false, error: 'Нет metaRunId' }, { status: 400 });
    const metaRunId = sanitizeRunId(rawMetaRunId);

    const exportMode = req.nextUrl.searchParams.get('export');
    if (exportMode) {
      // v6.1: экспорт сборки надзирателя — портативный документ (JSON или Markdown)
      if (!['json', 'md'].includes(exportMode)) {
        return NextResponse.json({ ok: false, error: `Неизвестный формат экспорта: ${exportMode}` }, { status: 400 });
      }
      const doc = await buildSupervisorAssembly(metaRunId);
      if (exportMode === 'md') {
        return new NextResponse(supervisorExportToMarkdown(doc), {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="fortorium-supervisor-${metaRunId}.md"`,
          },
        });
      }
      return new NextResponse(JSON.stringify(doc, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="fortorium-supervisor-${metaRunId}.json"`,
        },
      });
    }

    const state = await readMemoryFile(metaRunId, 'meta-state.json');
    if (!state) return NextResponse.json({ ok: false, error: 'Мета-run не найден' }, { status: 404 });
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
