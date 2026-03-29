import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

/**
 * SVG-координатор: Управляет командой из 10 SVG-агентов
 * Последовательно вызывает агентов для создания полной сцены
 */

// Все SVG-агенты в порядке выполнения
const SVG_AGENTS = [
  { id: 'palette', name: 'Цветовая палитра', icon: '🎨', endpoint: '/api/agents/svg/palette', order: 1, description: 'Определяет цветовую схему' },
  { id: 'background', name: 'Фон', icon: '🌄', endpoint: '/api/agents/svg/background', order: 2, description: 'Создаёт фон сцены' },
  { id: 'perspective', name: 'Перспектива', icon: '📐', endpoint: '/api/agents/svg/perspective', order: 3, description: 'Настраивает перспективу' },
  { id: 'composition', name: 'Композиция', icon: '📊', endpoint: '/api/agents/svg/composition', order: 4, description: 'Создаёт композицию' },
  { id: 'lighting', name: 'Освещение', icon: '💡', endpoint: '/api/agents/svg/lighting', order: 5, description: 'Добавляет свет и тени' },
  { id: 'details', name: 'Детали', icon: '✨', endpoint: '/api/agents/svg/details', order: 6, description: 'Добавляет детали фона' },
  { id: 'objects', name: 'Предметы', icon: '🪑', endpoint: '/api/agents/svg/objects', order: 7, description: 'Размещает предметы' },
  { id: 'characters', name: 'Персонажи', icon: '👤', endpoint: '/api/agents/svg/characters', order: 8, description: 'Создаёт персонажей' },
  { id: 'layout', name: 'Расстановка', icon: '📍', endpoint: '/api/agents/svg/layout', order: 9, description: 'Логично расставляет всё' },
  { id: 'animation', name: 'Анимация', icon: '🎬', endpoint: '/api/agents/svg/animation', order: 10, description: 'Добавляет динамику' }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scene = {},
      style = 'ghibli',
      characters = [],
      objects = [],
      dimensions = { width: 1024, height: 576 },
      includeAnimation = true
    } = body;
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const results: any = {
      metadata: {
        scene,
        style,
        dimensions,
        createdAt: new Date().toISOString()
      },
      agents: {},
      svg: null,
      css: null
    };
    
    // ФАЗА 1: Цветовая палитра
    const paletteRes = await fetch(`${baseUrl}/api/agents/svg/palette`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        style,
        mood: scene.mood || 'спокойный',
        timeOfDay: scene.timeOfDay || 'день'
      })
    });
    results.agents.palette = await paletteRes.json();
    
    // ФАЗА 2: Фон
    const backgroundRes = await fetch(`${baseUrl}/api/agents/svg/background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene: { location: scene.location || 'лес', ...scene }, style, dimensions })
    });
    results.agents.background = await backgroundRes.json();
    
    // ФАЗА 3: Перспектива
    const perspectiveRes = await fetch(`${baseUrl}/api/agents/svg/perspective`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perspectiveType: 'one-point', cameraAngle: 'eye-level', dimensions })
    });
    results.agents.perspective = await perspectiveRes.json();
    
    // ФАЗА 4: Композиция
    const compositionRes = await fetch(`${baseUrl}/api/agents/svg/composition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule: 'rule-of-thirds', rhythm: 'flowing', dimensions })
    });
    results.agents.composition = await compositionRes.json();
    
    // ФАЗА 5: Освещение
    const lightingRes = await fetch(`${baseUrl}/api/agents/svg/lighting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'natural', direction: 'top', timeOfDay: scene.timeOfDay || 'день', dimensions })
    });
    results.agents.lighting = await lightingRes.json();
    
    // ФАЗА 6: Детали
    const detailsRes = await fetch(`${baseUrl}/api/agents/svg/details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene: { location: scene.location || 'лес', style }, dimensions })
    });
    results.agents.details = await detailsRes.json();
    
    // ФАЗА 7: Предметы
    const objectsRes = await fetch(`${baseUrl}/api/agents/svg/objects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'природа', items: objects, style, count: 5, dimensions })
    });
    results.agents.objects = await objectsRes.json();
    
    // ФАЗА 8: Персонажи
    const charactersRes = await fetch(`${baseUrl}/api/agents/svg/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characters, style, dimensions })
    });
    results.agents.characters = await charactersRes.json();
    
    // ФАЗА 9: Расстановка
    const layoutRes = await fetch(`${baseUrl}/api/agents/svg/layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objects: results.agents.objects?.objects || [],
        characters: results.agents.characters?.characters || [],
        composition: 'rule-of-thirds',
        dimensions
      })
    });
    results.agents.layout = await layoutRes.json();
    
    // ФАЗА 10: Анимация (опционально)
    if (includeAnimation) {
      const animationRes = await fetch(`${baseUrl}/api/agents/svg/animation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elements: [...(results.agents.objects?.objects || []), ...(results.agents.characters?.characters || [])],
          animationType: 'idle',
          duration: 2000,
          loop: true,
          dimensions
        })
      });
      results.agents.animation = await animationRes.json();
      results.css = results.agents.animation?.css;
    }
    
    // Сборка финального SVG
    results.svg = assembleFinalSVG(results, dimensions);

    return NextResponse.json({
      success: true,
      agent: 'svg-coordinator',
      ...results,
      agentsUsed: SVG_AGENTS,
      message: `Сцена создана командой из ${SVG_AGENTS.length} SVG-агентов`
    });

  } catch (error) {
    console.error('[SVG-Coordinator] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

function assembleFinalSVG(results: any, dimensions: any): string {
  const { width, height } = dimensions;
  const palette = results.agents.palette?.palette || {};
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="fortorium-scene">
  <defs>
    <style>:root { --primary: ${palette.primary?.main || '#4169E1'}; }</style>
    <filter id="shadow"><feDropShadow dx="2" dy="2" stdDeviation="2"/></filter>
  </defs>
  
  <!-- Слои сцены -->
  <g class="layer-background">${extractContent(results.agents.background?.svg)}</g>
  <g class="layer-lighting" mix-blend-mode="overlay">${extractContent(results.agents.lighting?.svg)}</g>
  <g class="layer-details">${extractContent(results.agents.details?.svg)}</g>
  <g class="layer-objects" filter="url(#shadow)">${extractContent(results.agents.objects?.svg)}</g>
  <g class="layer-characters" filter="url(#shadow)">${extractContent(results.agents.characters?.svg)}</g>
  
  <!-- Виньетка -->
  <defs><radialGradient id="v"><stop offset="50%" stop-color="transparent"/><stop offset="100%" stop-color="rgba(0,0,0,0.2)"/></radialGradient></defs>
  <rect width="100%" height="100%" fill="url(#v)"/>
  <text x="${width-10}" y="${height-10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.3)">ФОРТОРИУМ</text>
</svg>`;
}

function extractContent(svg: string): string {
  if (!svg) return '';
  return svg.replace(/<svg[^>]*>|<\/svg>/gi, '');
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-coordinator',
    name: 'Координатор SVG-команды',
    specialization: 'Управление командой из 10 SVG-агентов',
    team: SVG_AGENTS,
    workflow: SVG_AGENTS.map((a, i) => ({ step: i + 1, agent: a.id, action: a.description })),
    status: 'ready'
  });
}
