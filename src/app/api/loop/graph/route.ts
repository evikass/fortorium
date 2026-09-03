import { NextRequest, NextResponse } from 'next/server';
import { routeThroughGraph, GRAPH_NODES, GRAPH_EDGES } from '@/lib/loop/graph-router';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * API Граф-инженеринга (следующий уровень после лупа).
 * Маршрутизирует задачу по ветвящемуся графу специализированных агентов.
 *
 * GET  — описание графа (узлы и рёбра для визуализации)
 * POST { task } — прогнать задачу через граф, вернуть трассу маршрута
 */
export async function GET() {
  return NextResponse.json({ ok: true, nodes: GRAPH_NODES, edges: GRAPH_EDGES });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = typeof body.task === 'string' ? body.task.trim() : '';
    if (!task) {
      return NextResponse.json({ ok: false, error: 'Нет задачи (task)' }, { status: 400 });
    }
    const result = await routeThroughGraph(task.slice(0, 500));
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API/loop/graph] error:', error);
    return NextResponse.json({ ok: false, error: String(error instanceof Error ? error.message : error) }, { status: 500 });
  }
}
