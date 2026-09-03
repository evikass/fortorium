import { NextRequest, NextResponse } from 'next/server';
import { LoopTask, ArtifactType } from '@/lib/loop/types';
import { createInitialState, runLoopStep, humanDecision } from '@/lib/loop/loop-engine';
import { initRun, writeMemoryFile, readMemoryFile, deleteRun } from '@/lib/loop/file-memory';

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
 * GET  { ?runId }                              — прочитать текущее состояние из файла
 */

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
        const runId = String(body.runId || '');
        if (!runId) return NextResponse.json({ ok: false, error: 'Нет runId' }, { status: 400 });
        const redo = Boolean(body.redo);
        const { state, iteration, stopDecision } = await runLoopStep(runId, redo);
        return NextResponse.json({ ok: true, state, iteration, stopDecision });
      }

      case 'accept': {
        const runId = String(body.runId || '');
        if (!runId) return NextResponse.json({ ok: false, error: 'Нет runId' }, { status: 400 });
        const state = await humanDecision(runId, 'accept');
        return NextResponse.json({ ok: true, state });
      }

      case 'stop': {
        const runId = String(body.runId || '');
        if (!runId) return NextResponse.json({ ok: false, error: 'Нет runId' }, { status: 400 });
        const state = await humanDecision(runId, 'stop');
        return NextResponse.json({ ok: true, state });
      }

      case 'reset': {
        const runId = String(body.runId || '');
        if (!runId) return NextResponse.json({ ok: false, error: 'Нет runId' }, { status: 400 });
        await deleteRun(runId);
        return NextResponse.json({ ok: true });
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
    const runId = req.nextUrl.searchParams.get('runId') || '';
    if (!runId) return NextResponse.json({ ok: false, error: 'Нет runId' }, { status: 400 });
    const state = await readMemoryFile(runId, 'state.json');
    if (!state) return NextResponse.json({ ok: false, error: 'Run не найден' }, { status: 404 });
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
