import { NextRequest, NextResponse } from 'next/server';
import { MetaTask, ArtifactType } from '@/lib/loop/types';
import { createMetaState, runMetaStep, metaHumanDecision } from '@/lib/loop/meta-loop';
import { initRun, writeMemoryFile, readMemoryFile, deleteRun } from '@/lib/loop/file-memory';

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
 * GET  { ?metaRunId }                            — прочитать meta-state.json
 */

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
        const metaRunId = String(body.metaRunId || '');
        if (!metaRunId) return NextResponse.json({ ok: false, error: 'Нет metaRunId' }, { status: 400 });
        const { state, record, stopDecision } = await runMetaStep(metaRunId);
        return NextResponse.json({ ok: true, state, record, stopDecision });
      }

      case 'accept': {
        const metaRunId = String(body.metaRunId || '');
        if (!metaRunId) return NextResponse.json({ ok: false, error: 'Нет metaRunId' }, { status: 400 });
        const state = await metaHumanDecision(metaRunId, 'accept');
        return NextResponse.json({ ok: true, state });
      }

      case 'stop': {
        const metaRunId = String(body.metaRunId || '');
        if (!metaRunId) return NextResponse.json({ ok: false, error: 'Нет metaRunId' }, { status: 400 });
        const state = await metaHumanDecision(metaRunId, 'stop');
        return NextResponse.json({ ok: true, state });
      }

      case 'reset': {
        const metaRunId = String(body.metaRunId || '');
        if (!metaRunId) return NextResponse.json({ ok: false, error: 'Нет metaRunId' }, { status: 400 });
        for (const runId of allRunIdsOf(metaRunId)) {
          await deleteRun(runId);
        }
        return NextResponse.json({ ok: true });
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
    const metaRunId = req.nextUrl.searchParams.get('metaRunId') || '';
    if (!metaRunId) return NextResponse.json({ ok: false, error: 'Нет metaRunId' }, { status: 400 });
    const state = await readMemoryFile(metaRunId, 'meta-state.json');
    if (!state) return NextResponse.json({ ok: false, error: 'Мета-run не найден' }, { status: 404 });
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
