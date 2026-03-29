import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

/**
 * SVG-координатор v4.5.0
 * 12 агентов + композитор + поддержка ТЗ
 */

const SVG_AGENTS = [
  { id: 'palette', name: 'Цветовая палитра', icon: '🎨', order: 1 },
  { id: 'background', name: 'Фон', icon: '🌄', order: 2 },
  { id: 'perspective', name: 'Перспектива', icon: '📐', order: 3 },
  { id: 'composition', name: 'Композиция', icon: '📊', order: 4 },
  { id: 'lighting', name: 'Освещение', icon: '💡', order: 5 },
  { id: 'details', name: 'Детали', icon: '✨', order: 6 },
  { id: 'objects', name: 'Предметы', icon: '🪑', order: 7 },
  { id: 'characters', name: 'Персонажи', icon: '👤', order: 8 },
  { id: 'layout', name: 'Расстановка', icon: '📍', order: 9 },
  { id: 'animation', name: 'Анимация', icon: '🎬', order: 10 },
  { id: 'typography', name: 'Типографика', icon: '🔤', order: 11 }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scene = {},
      style = 'ghibli',
      dimensions = { width: 1024, height: 576 },
      taskDescription = '',
      taskType = 'scene',
      customText = {}
    } = body;
    
    const settings = {
      width: dimensions.width,
      height: dimensions.height,
      location: scene.location || 'лес',
      timeOfDay: scene.timeOfDay || 'день',
      mood: scene.mood || 'спокойный',
      style,
      taskDescription,
      taskType,
      customText
    };
    
    console.log('[SVG-Coordinator v4.5.0] Task:', taskType, 'TZ:', !!taskDescription);
    const startTime = Date.now();
    
    // Генерация агентов
    const results: any = {};
    for (const agent of SVG_AGENTS) {
      const agentStart = Date.now();
      try {
        results[agent.id] = {
          success: true,
          svg: generateAgentSVG(agent.id, settings),
          executionTime: Date.now() - agentStart
        };
      } catch (e: any) {
        results[agent.id] = { success: false, error: e.message, executionTime: Date.now() - agentStart };
      }
    }
    
    const agentsTime = Date.now() - startTime;
    
    // Композитор
    const composerStart = Date.now();
    const finalScene = composeFinalScene({ settings, dimensions, taskType, customText });
    const composerTime = Date.now() - composerStart;
    
    const storyboard = {
      frames: SVG_AGENTS.map((a, i) => ({
        id: i + 1,
        agentId: a.id,
        agentName: a.name,
        agentIcon: a.icon,
        svg: results[a.id]?.svg || '',
        success: results[a.id]?.success || false,
        executionTime: results[a.id]?.executionTime || 0
      }))
    };
    
    return NextResponse.json({
      success: true,
      version: '4.5.0',
      taskType,
      taskDescription: taskDescription || null,
      executionTime: agentsTime,
      composerTime,
      totalTime: Date.now() - startTime,
      agents: results,
      storyboard,
      finalScene: { svg: finalScene, success: true },
      message: `Создано ${storyboard.frames.length} кадров + финальная сцена за ${Date.now() - startTime}мс`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function generateAgentSVG(id: string, s: any): string {
  const { width: w, height: h, style, mood, timeOfDay, location, taskType, customText } = s;
  
  const generators: Record<string, () => string> = {
    palette: () => {
      const p: Record<string, any> = {
        ghibli: { p: ['#87CEEB', '#B0E0E6'], s: ['#90EE90', '#98FB98'], a: ['#F4D03F', '#F5DEB3'] },
        disney: { p: ['#4169E1', '#6495ED'], s: ['#32CD32', '#00FF00'], a: ['#FFD700', '#FFA500'] },
        pixar: { p: ['#FF6B6B', '#4ECDC4'], s: ['#2ECC71', '#27AE60'], a: ['#E74C3C', '#C0392B'] }
      };
      const c = p[style] || p.ghibli;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="${w/2}" y="50" text-anchor="middle" font-size="28" fill="white">🎨 Палитра</text><g transform="translate(50,120)"><text y="0" font-size="14" fill="#888">Основные</text>${c.p.map((x: string, i: number) => `<rect x="${i*120}" y="20" width="100" height="100" rx="12" fill="${x}"/>`).join('')}</g><g transform="translate(50,270)"><text y="0" font-size="14" fill="#888">Вторичные</text>${c.s.map((x: string, i: number) => `<rect x="${i*120}" y="20" width="100" height="100" rx="12" fill="${x}"/>`).join('')}</g><text x="${w-10}" y="${h-10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text></svg>`;
    },
    background: () => {
      const sky: Record<string, string[]> = { 'день': ['#87CEEB', '#ADD8E6'], 'ночь': ['#191970', '#000080'], 'вечер': ['#FF8C00', '#FF7F50'] };
      const sc = sky[timeOfDay] || sky['день'];
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${sc[0]}"/><stop offset="100%" stop-color="${sc[1]}"/></linearGradient></defs><rect width="100%" height="${h*0.6}" fill="url(#sg)"/><circle cx="${w*0.78}" cy="${h*0.12}" r="40" fill="#FFD700"/><rect y="${h*0.6}" width="100%" height="${h*0.4}" fill="#228B22"/><text x="${w/2}" y="40" text-anchor="middle" font-size="24" fill="white">🌄 Фон</text><text x="${w-10}" y="${h-10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text></svg>`;
    },
    perspective: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><g opacity="0.4">${Array.from({length: 15}, (_, i) => `<line x1="${w/2}" y1="${h*0.35}" x2="${i*w/14}" y2="${h}" stroke="rgba(100,150,255,0.2)"/>`).join('')}</g><circle cx="${w/2}" cy="${h*0.35}" r="10" fill="#ff6b6b"/><text x="${w/2}" y="40" text-anchor="middle" font-size="24" fill="white">📐 Перспектива</text><text x="${w-10}" y="${h-10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text></svg>`,
    composition: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><g stroke="rgba(255,255,255,0.3)" stroke-width="2"><line x1="${w/3}" y1="0" x2="${w/3}" y2="${h}"/><line x1="${w*2/3}" y1="0" x2="${w*2/3}" y2="${h}"/><line x1="0" y1="${h/3}" x2="${w}" y2="${h/3}"/><line x1="0" y1="${h*2/3}" x2="${w}" y2="${h*2/3}"/></g>${[{x:w/3,y:h/3},{x:w*2/3,y:h/3},{x:w/3,y:h*2/3},{x:w*2/3,y:h*2/3}].map((p,i) => `<circle cx="${p.x}" cy="${p.y}" r="20" fill="rgba(255,107,107,0.4)" stroke="white" stroke-width="2"/><text x="${p.x}" y="${p.y+6}" text-anchor="middle" font-size="16" fill="white">${i+1}</text>`).join('')}<text x="${w/2}" y="40" text-anchor="middle" font-size="24" fill="white">📊 Композиция</text></svg>`,
    lighting: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><defs><radialGradient id="lg"><stop offset="0%" stop-color="#FFD700"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs><circle cx="${w*0.75}" cy="${h*0.15}" r="50" fill="#FFD700" opacity="0.8"/><ellipse cx="${w*0.75}" cy="${h*0.6}" rx="${w*0.5}" ry="${h*0.4}" fill="url(#lg)" opacity="0.3"/><text x="${w/2}" y="40" text-anchor="middle" font-size="24" fill="white">💡 Освещение</text></svg>`,
    details: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#2a3f3f"/>${Array.from({length: 30}, () => `<ellipse cx="${Math.random()*w}" cy="${Math.random()*h}" rx="${Math.random()*15+8}" ry="${Math.random()*10+5}" fill="${['#228B22','#32CD32','#8B4513'][Math.floor(Math.random()*3)]}" opacity="0.7"/>`).join('')}<text x="${w/2}" y="40" text-anchor="middle" font-size="24" fill="white">✨ Детали</text></svg>`,
    objects: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1e2d2d"/><rect y="${h*0.7}" width="100%" height="${h*0.3}" fill="#2a3f3f"/>${['🌲','🪵','🍄','🪨','🌿','🍂','🌸','🦋'].map((e,i) => `<g transform="translate(${100+(i%4)*(w-200)/3}, ${h*0.25+Math.floor(i/4)*180})"><rect x="-30" y="-30" width="60" height="60" rx="12" fill="rgba(255,255,255,0.1)"/><text x="0" y="15" text-anchor="middle" font-size="40">${e}</text></g>`).join('')}<text x="${w/2}" y="40" text-anchor="middle" font-size="24" fill="white">🪑 Предметы</text></svg>`,
    characters: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><rect y="${h*0.75}" width="100%" height="${h*0.25}" fill="#2a2a3e"/>${[{e:'🧙‍♂️',c:'#9370DB'},{e:'🧝‍♀️',c:'#4ECDC4'},{e:'🦊',c:'#FF6B6B'}].map((ch,i) => `<g transform="translate(${w*(0.25+i*0.25)}, ${h*0.5}) scale(${i===0?1.3:1})"><circle cx="0" cy="0" r="60" fill="${ch.c}" opacity="0.2"/><text x="0" y="20" text-anchor="middle" font-size="70">${ch.e}</text></g>`).join('')}<text x="${w/2}" y="40" text-anchor="middle" font-size="24" fill="white">👤 Персонажи</text></svg>`,
    layout: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><g opacity="0.3">${Array.from({length: 6}, (_, i) => `<line x1="${w*(i+1)/7}" y1="${h*0.15}" x2="${w*(i+1)/7}" y2="${h*0.85}" stroke="rgba(100,150,255,0.4)"/>`).join('')}</g><rect x="${w*0.1}" y="${h*0.15}" width="${w*0.25}" height="${h*0.35}" rx="10" fill="rgba(100,200,100,0.15)" stroke="rgba(100,200,100,0.5)"/><text x="${w*0.225}" y="${h*0.35}" text-anchor="middle" font-size="14" fill="rgba(100,200,100,0.9)">Фон</text><rect x="${w*0.4}" y="${h*0.25}" width="${w*0.25}" height="${h*0.4}" rx="10" fill="rgba(200,200,100,0.15)" stroke="rgba(200,200,100,0.5)"/><text x="${w*0.525}" y="${h*0.48}" text-anchor="middle" font-size="14" fill="rgba(200,200,100,0.9)">Персонажи</text><rect x="${w*0.65}" y="${h*0.35}" width="${w*0.25}" height="${h*0.35}" rx="10" fill="rgba(200,100,100,0.15)" stroke="rgba(200,100,100,0.5)"/><text x="${w*0.775}" y="${h*0.55}" text-anchor="middle" font-size="14" fill="rgba(200,100,100,0.9)">Предметы</text><text x="${w/2}" y="40" text-anchor="middle" font-size="24" fill="white">📍 Расстановка</text></svg>`,
    animation: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><style>.f{animation:f 3s ease-in-out infinite}@keyframes f{0%,100%{transform:translateY(0)}50%{transform:translateY(-30px)}}</style><rect width="100%" height="100%" fill="#1a1a2e"/><circle cx="${w*0.25}" cy="${h*0.45}" r="60" fill="#9370DB" class="f" opacity="0.7"/><circle cx="${w*0.5}" cy="${h*0.5}" r="80" fill="#4ECDC4" class="f" style="animation-delay:1s" opacity="0.6"/><circle cx="${w*0.75}" cy="${h*0.42}" r="50" fill="#FF6B6B" class="f" style="animation-delay:2s" opacity="0.7"/><text x="${w/2}" y="40" text-anchor="middle" font-size="24" fill="white">🎬 Анимация</text><g transform="translate(50, ${h-70})"><rect width="${w-100}" height="6" rx="3" fill="rgba(255,255,255,0.2)"/><rect width="${(w-100)*0.6}" height="6" rx="3" fill="#ff6b6b"/><circle cx="0" cy="3" r="8" fill="#ff6b6b"/><circle cx="${(w-100)*0.6}" cy="3" r="8" fill="rgba(255,255,255,0.5)"/></g></svg>`,
    typography: () => {
      const title = customText?.title || (taskType === 'ad' ? 'Ваш бренд' : taskType === 'banner' ? 'Заголовок' : 'Текст');
      const subtitle = customText?.subtitle || 'Подзаголовок';
      const fonts: Record<string, string> = { ghibli: 'Georgia', disney: 'Impact', pixar: 'Helvetica', anime: 'Arial' };
      const font = fonts[style] || 'Georgia';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="${w/2}" y="50" text-anchor="middle" font-size="24" fill="white">🔤 Типографика</text><text x="${w/2}" y="130" text-anchor="middle" font-family="${font}" font-size="48" font-weight="bold" fill="white">${title}</text><text x="${w/2}" y="180" text-anchor="middle" font-family="${font}" font-size="24" fill="rgba(255,255,255,0.8)">${subtitle}</text><g transform="translate(${w/2-90}, ${h-150})"><rect width="180" height="50" rx="8" fill="#ff6b6b"/><text x="90" y="33" text-anchor="middle" font-family="${font}" font-size="18" font-weight="bold" fill="white">${customText?.cta || 'Подробнее'}</text></g><text x="${w-10}" y="${h-10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Типографика</text></svg>`;
    }
  };
  
  return generators[id]?.() || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="${w/2}" y="${h/2}" text-anchor="middle" font-size="24" fill="white">${id}</text></svg>`;
}

function composeFinalScene(config: any): string {
  const { settings, dimensions, taskType, customText } = config;
  const { width: w, height: h } = dimensions;
  const { timeOfDay, location, mood, style } = settings;
  
  const sky: Record<string, string[]> = { 'день': ['#87CEEB', '#ADD8E6'], 'ночь': ['#191970', '#000080'], 'вечер': ['#FF8C00', '#FF7F50'] };
  const sc = sky[timeOfDay] || sky['день'];
  
  const title = customText?.title || '';
  const subtitle = customText?.subtitle || '';
  const cta = customText?.cta || 'Подробнее';
  const price = customText?.price || '';
  
  const fonts: Record<string, string> = { ghibli: 'Georgia', disney: 'Impact', pixar: 'Helvetica', anime: 'Arial' };
  const font = fonts[style] || 'Georgia';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="fSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${sc[0]}"/><stop offset="100%" stop-color="${sc[1]}"/>
    </linearGradient>
    <linearGradient id="fGround" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#228B22"/><stop offset="100%" stop-color="#006400"/>
    </linearGradient>
    <filter id="fShadow"><feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/></filter>
    <radialGradient id="fVignette" cx="50%" cy="50%" r="70%">
      <stop offset="50%" stop-color="transparent"/><stop offset="100%" stop-color="rgba(0,0,0,0.3)"/>
    </radialGradient>
  </defs>
  
  <!-- НЕБО -->
  <rect width="100%" height="${h*0.65}" fill="url(#fSky)"/>
  <circle cx="${w*0.78}" cy="${h*0.1}" r="40" fill="#FFD700"/>
  
  <!-- ЗЕМЛЯ -->
  <rect y="${h*0.6}" width="100%" height="${h*0.4}" fill="url(#fGround)"/>
  
  <!-- ПЕРСОНАЖИ -->
  <g transform="translate(${w*0.4}, ${h*0.75}) scale(1.1)" filter="url(#fShadow)">
    <ellipse cx="0" cy="55" rx="25" ry="8" fill="rgba(0,0,0,0.2)"/>
    <ellipse cx="0" cy="25" rx="22" ry="32" fill="#4ECDC4"/>
    <circle cx="0" cy="-15" r="25" fill="#FFE4C4"/>
    <ellipse cx="0" cy="-32" rx="22" ry="12" fill="#8B4513"/>
    <circle cx="-9" cy="-17" r="3" fill="#333"/><circle cx="9" cy="-17" r="3" fill="#333"/>
    <path d="M -7 -5 Q 0 4 7 -5" fill="none" stroke="#333" stroke-width="2"/>
  </g>
  
  <g transform="translate(${w*0.65}, ${h*0.78}) scale(0.9)" filter="url(#fShadow)">
    <ellipse cx="0" cy="50" rx="22" ry="6" fill="rgba(0,0,0,0.2)"/>
    <ellipse cx="0" cy="25" rx="20" ry="28" fill="#FF6B6B"/>
    <circle cx="0" cy="-10" r="22" fill="#FFE4C4"/>
    <circle cx="-8" cy="-11" r="2.5" fill="#333"/><circle cx="8" cy="-11" r="2.5" fill="#333"/>
  </g>
  
  <!-- ТЕКСТ ДЛЯ БАННЕРОВ/РЕКЛАМЫ -->
  ${taskType === 'banner' || taskType === 'ad' ? `
    <rect x="0" y="0" width="100%" height="45%" fill="rgba(0,0,0,0.5)"/>
    ${title ? `<text x="${w/2}" y="80" text-anchor="middle" font-family="${font}" font-size="${taskType === 'ad' ? 56 : 48}" font-weight="bold" fill="white">${title}</text>` : ''}
    ${subtitle ? `<text x="${w/2}" y="130" text-anchor="middle" font-family="${font}" font-size="22" fill="rgba(255,255,255,0.9)">${subtitle}</text>` : ''}
    ${price ? `<text x="${w/2}" y="180" text-anchor="middle" font-family="${font}" font-size="36" font-weight="bold" fill="#4ECDC4">${price}</text>` : ''}
    <g transform="translate(${w/2 - 90}, ${h * 0.35})">
      <rect width="180" height="50" rx="8" fill="#ff6b6b"/>
      <text x="90" y="33" text-anchor="middle" font-family="${font}" font-size="18" font-weight="bold" fill="white">${cta}</text>
    </g>
  ` : ''}
  
  ${taskType === 'social' ? `
    <rect x="0" y="0" width="100%" height="35%" fill="rgba(0,0,0,0.5)"/>
    ${title ? `<text x="${w/2}" y="80" text-anchor="middle" font-family="${font}" font-size="42" font-weight="bold" fill="white">${title}</text>` : ''}
    ${customText?.hashtag ? `<text x="${w-20}" y="${h-20}" text-anchor="end" font-size="16" fill="rgba(255,255,255,0.7)">${customText.hashtag}</text>` : ''}
  ` : ''}
  
  <!-- ВИНЬЕТКА -->
  <rect width="100%" height="100%" fill="url(#fVignette)"/>
  
  <!-- ПОДПИСИ -->
  ${taskType === 'scene' ? `
    <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="11" fill="rgba(255,255,255,0.4)" font-weight="bold">ФОРТОРИУМ</text>
    <text x="15" y="${h-15}" font-size="10" fill="rgba(255,255,255,0.5)">${location} • ${timeOfDay} • ${mood}</text>
  ` : `<text x="${w-15}" y="${h-15}" text-anchor="end" font-size="9" fill="rgba(255,255,255,0.3)">ФОРТОРИУМ • ${taskType}</text>`}
</svg>`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-coordinator',
    version: '4.5.0',
    team: SVG_AGENTS,
    taskTypes: ['scene', 'banner', 'ad', 'social', 'poster'],
    features: [
      '11 SVG агентов + композитор',
      'Поддержка технического задания',
      'Режимы: сцена, баннер, реклама, соцсети',
      'Типографика и шрифты',
      'Кастомный текст (title, subtitle, cta, price, hashtag)'
    ]
  });
}
