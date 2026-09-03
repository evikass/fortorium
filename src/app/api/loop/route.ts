import { NextRequest, NextResponse } from 'next/server';
import { LoopTask, ArtifactType } from '@/lib/loop/types';
import { createInitialState, runLoopStep, humanDecision } from '@/lib/loop/loop-engine';
import { initRun, writeMemoryFile, readMemoryFile, deleteRun, sanitizeRunId } from '@/lib/loop/file-memory';
import { buildLoopAssembly, loopExportToMarkdown } from '@/lib/loop/loop-export';
import { restoreMemoryFiles, isValidLoopDoc } from '@/lib/loop/assembly-import';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * API цикла Луп-инженеринга.
 *
 * POST { action: 'init'  , task }              — создать run, записать state.json на диск
 * POST { action: 'step'  , runId, redo? }      — выполнить ОДИН виток цикла (чистые агенты)
 * POST { action: 'accept', runId }             — человек одобрил виток (внешний круг)
 * POST { action: 'stop'  , runId }             — человек остановил цикл (внешний круг)
 * POST { action: 'reset' , runId }             — удалить run и все файлы памяти
 * POST { action: 'import', doc }               — v6.2: воспроизвести run из сборки (fortorium-loop-assembly)
 * GET  { ?runId }                              — прочитать текущее состояние из файла
 * GET  { ?runId&export=json }                  — v6.2: экспорт сборки цикла (полный JSON)
 * GET  { ?runId&export=md }                    — v6.2: экспорт сборки цикла (Markdown-паспорт)
 */

// v6.2: структурная связка со сценой демо-режима (попадает в экспорт сборки)
function sanitizeSceneRef(raw: unknown): LoopTask['sceneRef'] {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const n = Number(r.sceneNumber);
  const title = typeof r.sceneTitle === 'string' ? r.sceneTitle.trim() : '';
  if (!Number.isFinite(n) || n < 1 || !title) return undefined;
  return { sceneNumber: Math.round(n), sceneTitle: title.slice(0, 200) };
}

function sanitizeTask(raw: Record<string, unknown>): LoopTask | null {
  const goal = typeof raw.goal === 'string' ? raw.goal.trim() : '';
  const artifactType = ['logline', 'scene', 'synopsis'].includes(String(raw.artifactType))
    ? (String(raw.artifactType) as ArtifactType)
    : null;
  if (!goal || !artifactType) return null;
  const clamp = (v: unknown, min: number, max: number, dflt: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : dflt;
  };
  return {
    goal: goal.slice(0, 500),
    artifactType,
    maxIterations: clamp(raw.maxIterations, 1, 10, 3),
    qualityThreshold: clamp(raw.qualityThreshold, 1, 10, 8),
    maxTokens: clamp(raw.maxTokens, 500, 500000, 30000),
    autoMode: Boolean(raw.autoMode),
    // v5.1: связка с демо-режимом — цикл может стартовать из текста сцены
    initialDraft: typeof raw.initialDraft === 'string' && raw.initialDraft.trim()
      ? raw.initialDraft.trim().slice(0, 4000)
      : undefined,
    source: ['demo-scene', 'manual', 'meta-child'].includes(String(raw.source))
      ? (String(raw.source) as LoopTask['source'])
      : 'manual',
    sourceLabel: typeof raw.sourceLabel === 'string' ? raw.sourceLabel.slice(0, 200) : undefined,
    sceneRef: sanitizeSceneRef(raw.sceneRef),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || '');

    switch (action) {
      case 'init': {
        const task = sanitizeTask(body.task || {});
        if (!task) {
          return NextResponse.json({ ok: false, error: 'Некорректная задача: нужны goal и artifactType' }, { status: 400 });
        }
        const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await initRun(runId, task);
        const state = createInitialState(runId, task);
        await writeMemoryFile(runId, 'state.json', state);
        return NextResponse.json({ ok: true, state });
      }

      case 'step': {
        const runId = sanitizeRunId(String(body.runId || ''));
        const redo = Boolean(body.redo);
        const { state, iteration, stopDecision } = await runLoopStep(runId, redo);
        return NextResponse.json({ ok: true, state, iteration, stopDecision });
      }

      case 'accept': {
        const runId = sanitizeRunId(String(body.runId || ''));
        const state = await humanDecision(runId, 'accept');
        return NextResponse.json({ ok: true, state });
      }

      case 'stop': {
        const runId = sanitizeRunId(String(body.runId || ''));
        const state = await humanDecision(runId, 'stop');
        return NextResponse.json({ ok: true, state });
      }

      case 'reset': {
        const runId = sanitizeRunId(String(body.runId || ''));
        await deleteRun(runId);
        return NextResponse.json({ ok: true });
      }

      case 'import': {
        // v6.2: воспроизведение run из экспортного сборки (fortorium-loop-assembly)
        const doc = body.doc;
        if (!isValidLoopDoc(doc)) {
          return NextResponse.json(
            { ok: false, error: 'Это не файл сборки луп-цикла: ожидался формат fortorium-loop-assembly' },
            { status: 400 }
          );
        }
        const runId = sanitizeRunId(String(doc.runId || ''));
        const res = await restoreMemoryFiles(runId, doc.memoryFiles as never);
        const state = await readMemoryFile(runId, 'state.json');
        if (!state) {
          return NextResponse.json(
            { ok: false, error: 'В документе нет файла state.json (или он был слишком велик для инлайна) — восстановление невозможно' },
            { status: 422 }
            );
        }
        return NextResponse.json({ ok: true, state, import: res });
      }

      default:
        return NextResponse.json({ ok: false, error: `Неизвестное действие: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[API/loop] error:', error);
    return NextResponse.json({ ok: false, error: String(error instanceof Error ? error.message : error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const rawRunId = req.nextUrl.searchParams.get('runId') || '';
    if (!rawRunId) return NextResponse.json({ ok: false, error: 'Нет runId' }, { status: 400 });
    const runId = sanitizeRunId(rawRunId);

    const exportMode = req.nextUrl.searchParams.get('export');
    if (exportMode) {
      // v6.2: экспорт сборки цикла — портативный документ (JSON или Markdown)
      if (!['json', 'md'].includes(exportMode)) {
        return NextResponse.json({ ok: false, error: `Неизвестный формат экспорта: ${exportMode}` }, { status: 400 });
      }
      const doc = await buildLoopAssembly(runId);
      if (exportMode === 'md') {
        return new NextResponse(loopExportToMarkdown(doc), {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="fortorium-loop-${runId}.md"`,
          },
        });
      }
      return new NextResponse(JSON.stringify(doc, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="fortorium-loop-${runId}.json"`,
        },
      });
    }

    const state = await readMemoryFile(runId, 'state.json');
    if (!state) return NextResponse.json({ ok: false, error: 'Run не найден' }, { status: 404 });
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error instanceof Error ? error.message : error) }, { status: 500 });
  }
}
