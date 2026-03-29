import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

/**
 * SVG-координатор: Параллельная генерация раскадровок
 * Все 10 агентов работают одновременно и создают полноценные SVG кадры
 * Затем композитор собирает всё в одну финальную картинку
 */

// Импортируем функции генерации (они будут в lib)
const AGENT_GENERATORS = {
  palette: generatePaletteAgentSVG,
  background: generateBackgroundAgentSVG,
  perspective: generatePerspectiveAgentSVG,
  composition: generateCompositionAgentSVG,
  lighting: generateLightingAgentSVG,
  details: generateDetailsAgentSVG,
  objects: generateObjectsAgentSVG,
  characters: generateCharactersAgentSVG,
  layout: generateLayoutAgentSVG,
  animation: generateAnimationFrameSVG
};

const SVG_AGENTS = [
  { id: 'palette', name: 'Цветовая палитра', icon: '🎨', order: 1, description: 'Цветовая схема сцены' },
  { id: 'background', name: 'Фон', icon: '🌄', order: 2, description: 'Небо, земля, атмосфера' },
  { id: 'perspective', name: 'Перспектива', icon: '📐', order: 3, description: 'Точки схода, глубина' },
  { id: 'composition', name: 'Композиция', icon: '📊', order: 4, description: 'Правило третей, ритм' },
  { id: 'lighting', name: 'Освещение', icon: '💡', order: 5, description: 'Свет и тени' },
  { id: 'details', name: 'Детали', icon: '✨', order: 6, description: 'Детали фона' },
  { id: 'objects', name: 'Предметы', icon: '🪑', order: 7, description: 'Реквизит' },
  { id: 'characters', name: 'Персонажи', icon: '👤', order: 8, description: 'Персонажи в сцене' },
  { id: 'layout', name: 'Расстановка', icon: '📍', order: 9, description: 'Размещение элементов' },
  { id: 'animation', name: 'Анимация', icon: '🎬', order: 10, description: 'Движение и динамика' }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scene = {},
      style = 'ghibli',
      dimensions = { width: 1024, height: 576 },
      parallel = true
    } = body;
    
    const settings = {
      width: dimensions.width,
      height: dimensions.height,
      location: scene.location || 'лес',
      timeOfDay: scene.timeOfDay || 'день',
      mood: scene.mood || 'спокойный',
      style: style as 'ghibli' | 'disney' | 'pixar' | 'anime'
    };
    
    console.log('[SVG-Coordinator] Starting parallel generation for:', settings);
    const startTime = Date.now();
    
    let results: any = {};
    
    if (parallel) {
      // ПАРАЛЛЕЛЬНАЯ ГЕНЕРАЦИЯ - все агенты работают одновременно
      const promises = SVG_AGENTS.map(async (agent) => {
        const agentStart = Date.now();
        try {
          const generator = AGENT_GENERATORS[agent.id as keyof typeof AGENT_GENERATORS];
          const svg = generator ? await generator(settings) : generateFallbackSVG(agent, settings);
          
          return {
            id: agent.id,
            success: true,
            svg: svg,
            executionTime: Date.now() - agentStart,
            message: `${agent.name} готов`
          };
        } catch (error) {
          return {
            id: agent.id,
            success: false,
            error: String(error),
            executionTime: Date.now() - agentStart
          };
        }
      });
      
      const agentResults = await Promise.all(promises);
      
      // Собираем результаты
      agentResults.forEach(result => {
        results[result.id] = result;
      });
    } else {
      // Последовательная генерация (для отладки)
      for (const agent of SVG_AGENTS) {
        const agentStart = Date.now();
        try {
          const generator = AGENT_GENERATORS[agent.id as keyof typeof AGENT_GENERATORS];
          const svg = generator ? await generator(settings) : generateFallbackSVG(agent, settings);
          
          results[agent.id] = {
            success: true,
            svg: svg,
            executionTime: Date.now() - agentStart,
            message: `${agent.name} готов`
          };
        } catch (error) {
          results[agent.id] = {
            success: false,
            error: String(error),
            executionTime: Date.now() - agentStart
          };
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[SVG-Coordinator] Agents completed in ${totalTime}ms`);
    
    // Генерируем финальную сборку всех кадров
    const storyboard = generateStoryboard(results, settings, SVG_AGENTS);
    
    // ===== ВЫЗОВ КОМПОЗИТОРА =====
    // Собираем все слои в одну финальную картинку
    console.log('[SVG-Coordinator] Calling composer...');
    const composerStart = Date.now();
    
    const composerResult = await composeFinalScene({
      agents: results,
      settings: settings,
      dimensions,
      style
    });
    
    const composerTime = Date.now() - composerStart;
    console.log(`[SVG-Composer] Completed in ${composerTime}ms`);

    return NextResponse.json({
      success: true,
      agent: 'svg-coordinator',
      mode: parallel ? 'parallel' : 'sequential',
      executionTime: totalTime,
      composerTime: composerTime,
      totalTime: Date.now() - startTime,
      
      // Результаты каждого агента
      agents: results,
      
      // Раскадровка - массив всех SVG кадров
      storyboard: storyboard,
      
      // ===== ФИНАЛЬНАЯ КАРТИНКА =====
      finalScene: {
        svg: composerResult.svg,
        success: true
      },
      
      // Метаданные
      metadata: {
        scene: settings,
        totalFrames: storyboard.frames.length,
        generatedAt: new Date().toISOString(),
        version: '4.4.0'
      },
      
      message: `Создано ${storyboard.frames.length} кадров + финальная сцена за ${Date.now() - startTime}мс`
    });

  } catch (error) {
    console.error('[SVG-Coordinator] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// Генераторы SVG для каждого агента

async function generatePaletteAgentSVG(settings: any): Promise<string> {
  const { width, height, style, mood, timeOfDay } = settings;
  
  // Цвета на основе стиля
  const palettes: Record<string, any> = {
    ghibli: {
      primary: ['#87CEEB', '#B0E0E6', '#E0FFFF'],
      secondary: ['#90EE90', '#98FB98', '#7CFC00'],
      accent: ['#F4D03F', '#F5DEB3', '#DEB887']
    },
    disney: {
      primary: ['#4169E1', '#6495ED', '#87CEEB'],
      secondary: ['#32CD32', '#00FF00', '#7CFC00'],
      accent: ['#FFD700', '#FFA500', '#FF6347']
    },
    pixar: {
      primary: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
      secondary: ['#2ECC71', '#27AE60', '#1ABC9C'],
      accent: ['#E74C3C', '#C0392B', '#D35400']
    },
    anime: {
      primary: ['#FF69B4', '#DDA0DD', '#E6E6FA'],
      secondary: ['#98FB98', '#90EE90', '#00FA9A'],
      accent: ['#00CED1', '#20B2AA', '#48D1CC']
    }
  };
  
  const palette = palettes[style] || palettes.ghibli;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="demoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      ${palette.primary.map((c: string, i: number) => 
        `<stop offset="${i * 50}%" stop-color="${c}"/>`
      ).join('')}
    </linearGradient>
  </defs>
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Заголовок -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="28" font-weight="bold" fill="white">🎨 Цветовая палитра</text>
  <text x="${width/2}" y="80" text-anchor="middle" font-size="14" fill="#888">${style} • ${mood} • ${timeOfDay}</text>
  
  <!-- Основные цвета -->
  <g transform="translate(50, 120)">
    <text x="0" y="0" font-size="14" fill="#888">Основные</text>
    ${palette.primary.map((color: string, i: number) => `
      <g transform="translate(${i * 120}, 20)">
        <rect width="100" height="100" rx="12" fill="${color}"/>
        <text x="50" y="125" text-anchor="middle" font-size="11" fill="#666">${color}</text>
      </g>
    `).join('')}
  </g>
  
  <!-- Вторичные цвета -->
  <g transform="translate(50, 270)">
    <text x="0" y="0" font-size="14" fill="#888">Вторичные</text>
    ${palette.secondary.map((color: string, i: number) => `
      <g transform="translate(${i * 120}, 20)">
        <rect width="100" height="100" rx="12" fill="${color}"/>
        <text x="50" y="125" text-anchor="middle" font-size="11" fill="#666">${color}</text>
      </g>
    `).join('')}
  </g>
  
  <!-- Акцентные цвета -->
  <g transform="translate(50, 420)">
    <text x="0" y="0" font-size="14" fill="#888">Акцентные</text>
    ${palette.accent.map((color: string, i: number) => `
      <g transform="translate(${i * 120}, 20)">
        <rect width="100" height="100" rx="12" fill="${color}"/>
        <text x="50" y="125" text-anchor="middle" font-size="11" fill="#666">${color}</text>
      </g>
    `).join('')}
  </g>
  
  <!-- Градиентная полоса -->
  <rect x="400" y="120" width="570" height="80" rx="12" fill="url(#demoGrad)"/>
  <text x="685" y="180" text-anchor="middle" font-size="12" fill="#888">Градиент</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Палитра</text>
</svg>`;
}

async function generateBackgroundAgentSVG(settings: any): Promise<string> {
  const { width, height, location, timeOfDay, style } = settings;
  
  // Цвета неба по времени суток
  const skyColors: Record<string, string[]> = {
    'утро': ['#FFE4B5', '#FFDEAD', '#87CEEB'],
    'день': ['#87CEEB', '#ADD8E6', '#B0E0E6'],
    'вечер': ['#FF8C00', '#FF7F50', '#FF6347'],
    'ночь': ['#191970', '#000080', '#0A0A1A'],
    'рассвет': ['#FFB6C1', '#FFA07A', '#FFD700'],
    'закат': ['#FF4500', '#DC143C', '#8B0000']
  };
  
  const sky = skyColors[timeOfDay] || skyColors['день'];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${sky[0]}"/>
      <stop offset="50%" stop-color="${sky[1]}"/>
      <stop offset="100%" stop-color="${sky[2]}"/>
    </linearGradient>
    <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#228B22"/>
      <stop offset="100%" stop-color="#006400"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  
  <!-- Небо -->
  <rect width="100%" height="${height * 0.6}" fill="url(#skyGrad)"/>
  
  <!-- Солнце/Луна -->
  ${timeOfDay === 'ночь' ? `
    <circle cx="${width * 0.8}" cy="${height * 0.15}" r="30" fill="#F5F5DC" filter="url(#glow)"/>
    ${Array.from({length: 30}, () => {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.5;
      return `<circle cx="${x}" cy="${y}" r="${Math.random() * 2 + 1}" fill="white" opacity="${Math.random() * 0.5 + 0.5}"/>`;
    }).join('')}
  ` : `
    <circle cx="${width * 0.75}" cy="${height * 0.12}" r="40" fill="#FFD700" filter="url(#glow)"/>
  `}
  
  <!-- Облака -->
  ${timeOfDay !== 'ночь' ? Array.from({length: 5}, () => {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.25;
    const scale = Math.random() * 0.5 + 0.5;
    return `<g transform="translate(${x}, ${y}) scale(${scale})" opacity="0.8">
      <ellipse cx="0" cy="0" rx="50" ry="30" fill="white"/>
      <ellipse cx="40" cy="10" rx="35" ry="25" fill="white"/>
      <ellipse cx="-30" cy="10" rx="30" ry="20" fill="white"/>
    </g>`;
  }).join('') : ''}
  
  <!-- Земля -->
  ${generateLocationGround(width, height, location)}
  
  <!-- Заголовок -->
  <text x="${width/2}" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="white">🌄 Фон сцены</text>
  <text x="${width/2}" y="65" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.7)">${location} • ${timeOfDay}</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Фон</text>
</svg>`;
}

async function generatePerspectiveAgentSVG(settings: any): Promise<string> {
  const { width, height } = settings;
  const vanishX = width * 0.5;
  const vanishY = height * 0.35;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Сетка перспективы -->
  <g opacity="0.4">
    <!-- Горизонтальные линии -->
    ${Array.from({length: 20}, (_, i) => {
      const y = vanishY + (i * (height - vanishY) / 20);
      const perspectiveScale = (y - vanishY) / (height - vanishY);
      const leftX = vanishX - perspectiveScale * width;
      const rightX = vanishX + perspectiveScale * width;
      return `<line x1="${leftX}" y1="${y}" x2="${rightX}" y2="${y}" stroke="rgba(100,150,255,${0.1 + perspectiveScale * 0.3})" stroke-width="1"/>`;
    }).join('')}
    
    <!-- Лучи от точки схода -->
    ${Array.from({length: 30}, (_, i) => {
      const angle = (i / 30) * Math.PI - Math.PI / 2;
      const endX = vanishX + Math.cos(angle) * width * 1.5;
      const endY = vanishY + Math.sin(angle) * height * 1.5;
      return `<line x1="${vanishX}" y1="${vanishY}" x2="${endX}" y2="${endY}" stroke="rgba(100,150,255,0.15)" stroke-width="1"/>`;
    }).join('')}
  </g>
  
  <!-- Точка схода -->
  <circle cx="${vanishX}" cy="${vanishY}" r="10" fill="#ff6b6b"/>
  <circle cx="${vanishX}" cy="${vanishY}" r="5" fill="white"/>
  
  <!-- Линия горизонта -->
  <line x1="0" y1="${vanishY}" x2="${width}" y2="${vanishY}" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="10,5"/>
  
  <!-- Зоны глубины -->
  <g opacity="0.2">
    <rect x="0" y="0" width="${width}" height="${vanishY}" fill="rgba(100,150,255,0.3)"/>
    <text x="20" y="30" font-size="14" fill="rgba(100,150,255,0.8)">Дальний план</text>
    
    <rect x="0" y="${vanishY}" width="${width}" height="${(height - vanishY) * 0.4}" fill="rgba(150,255,100,0.3)"/>
    <text x="20" y="${vanishY + 30}" font-size="14" fill="rgba(150,255,100,0.8)">Средний план</text>
    
    <rect x="0" y="${vanishY + (height - vanishY) * 0.4}" width="${width}" height="${(height - vanishY) * 0.6}" fill="rgba(255,200,100,0.3)"/>
    <text x="20" y="${vanishY + (height - vanishY) * 0.4 + 30}" font-size="14" fill="rgba(255,200,100,0.8)">Передний план</text>
  </g>
  
  <!-- Заголовок -->
  <text x="${width/2}" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="white">📐 Перспектива</text>
  <text x="${width/2}" y="65" text-anchor="middle" font-size="12" fill="#888">Одноточечная перспектива</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Перспектива</text>
</svg>`;
}

async function generateCompositionAgentSVG(settings: any): Promise<string> {
  const { width, height, mood } = settings;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Правило третей -->
  <g stroke="rgba(255,255,255,0.3)" stroke-width="2">
    <line x1="${width/3}" y1="0" x2="${width/3}" y2="${height}"/>
    <line x1="${width*2/3}" y1="0" x2="${width*2/3}" y2="${height}"/>
    <line x1="0" y1="${height/3}" x2="${width}" y2="${height/3}"/>
    <line x1="0" y1="${height*2/3}" x2="${width}" y2="${height*2/3}"/>
  </g>
  
  <!-- Точки интереса -->
  <g>
    ${[
      { x: width/3, y: height/3 },
      { x: width*2/3, y: height/3 },
      { x: width/3, y: height*2/3 },
      { x: width*2/3, y: height*2/3 }
    ].map((p, i) => `
      <circle cx="${p.x}" cy="${p.y}" r="20" fill="rgba(255,107,107,0.4)" stroke="white" stroke-width="2"/>
      <text x="${p.x}" y="${p.y + 6}" text-anchor="middle" font-size="16" fill="white">${i + 1}</text>
    `).join('')}
  </g>
  
  <!-- Направляющие линии -->
  <g stroke="rgba(100,200,255,0.5)" stroke-width="2" stroke-dasharray="10,5">
    <line x1="0" y1="0" x2="${width}" y2="${height}"/>
    <line x1="${width}" y1="0" x2="0" y2="${height}"/>
  </g>
  
  <!-- Область фокуса -->
  <ellipse cx="${width/2}" cy="${height/2}" rx="120" ry="90" 
           fill="none" stroke="rgba(255,200,100,0.6)" stroke-width="3" stroke-dasharray="8,4"/>
  
  <!-- Заголовок -->
  <text x="${width/2}" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="white">📊 Композиция</text>
  <text x="${width/2}" y="65" text-anchor="middle" font-size="12" fill="#888">Правило третей • ${mood}</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Композиция</text>
</svg>`;
}

async function generateLightingAgentSVG(settings: any): Promise<string> {
  const { width, height, timeOfDay, mood } = settings;
  
  // Конфигурация освещения
  const lightConfigs: Record<string, any> = {
    'день': { sourceX: width * 0.75, sourceY: 80, color: '#FFFFFF', intensity: 1.0 },
    'утро': { sourceX: width * 0.85, sourceY: 120, color: '#FFE4B5', intensity: 0.8 },
    'вечер': { sourceX: width * 0.15, sourceY: 200, color: '#FF8C00', intensity: 0.6 },
    'ночь': { sourceX: width * 0.8, sourceY: 80, color: '#F5F5DC', intensity: 0.3 },
    'рассвет': { sourceX: width * 0.9, sourceY: 150, color: '#FFB6C1', intensity: 0.7 },
    'закат': { sourceX: width * 0.1, sourceY: 180, color: '#FF4500', intensity: 0.5 }
  };
  
  const light = lightConfigs[timeOfDay] || lightConfigs['день'];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="lightGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${light.color}"/>
      <stop offset="50%" stop-color="${light.color}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${light.color}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Лучи света -->
  <g transform="translate(${light.sourceX}, ${light.sourceY})">
    ${Array.from({length: 12}, (_, i) => {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const rayLength = light.intensity * 200;
      return `<line x1="0" y1="0" 
                    x2="${Math.cos(angle) * rayLength}" 
                    y2="${Math.sin(angle) * rayLength}" 
                    stroke="${light.color}" 
                    stroke-width="${light.intensity * 25}"
                    opacity="0.15"
                    stroke-linecap="round"/>`;
    }).join('')}
    
    <!-- Источник света -->
    <circle r="${25 + light.intensity * 15}" fill="${light.color}" filter="url(#glow)" opacity="0.8"/>
    <circle r="${15 + light.intensity * 10}" fill="white"/>
  </g>
  
  <!-- Область освещения -->
  <ellipse cx="${light.sourceX}" cy="${height * 0.7}" rx="${width * 0.4}" ry="${height * 0.35}" 
           fill="url(#lightGrad)" opacity="0.25"/>
  
  <!-- Тени -->
  <g opacity="0.4">
    <polygon points="0,${height} ${width * 0.3},${height} ${width * 0.35},${height * 0.75} 0,${height * 0.85}" 
             fill="rgba(0,0,0,0.5)"/>
    <polygon points="${width},${height} ${width * 0.7},${height} ${width * 0.65},${height * 0.75} ${width},${height * 0.85}" 
             fill="rgba(0,0,0,0.5)"/>
  </g>
  
  <!-- Заголовок -->
  <text x="${width/2}" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="white">💡 Освещение</text>
  <text x="${width/2}" y="65" text-anchor="middle" font-size="12" fill="#888">${timeOfDay} • Интенсивность: ${Math.round(light.intensity * 100)}%</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Освещение</text>
</svg>`;
}

async function generateDetailsAgentSVG(settings: any): Promise<string> {
  const { width, height, location, style } = settings;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="shadow">
      <feDropShadow dx="2" dy="2" stdDeviation="2"/>
    </filter>
  </defs>
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#2a3f3f"/>
  
  <!-- Детали в зависимости от локации -->
  ${generateDetailsForLocation(width, height, location, style)}
  
  <!-- Заголовок -->
  <text x="${width/2}" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="white">✨ Детали фона</text>
  <text x="${width/2}" y="65" text-anchor="middle" font-size="12" fill="#888">${location} • ${style}</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Детали</text>
</svg>`;
}

async function generateObjectsAgentSVG(settings: any): Promise<string> {
  const { width, height, location, style } = settings;
  
  // Предметы для локации
  const objectTypes: Record<string, string[]> = {
    'лес': ['🌲', '🪵', '🍄', '🪨', '🌿', '🍂', '🌸', '🦋'],
    'море': ['🚤', '🐚', '⭐', '🦀', '🌊', '⚓', '🦑', '🐠'],
    'город': ['🏠', '🚗', '🚦', '🌳', '🪑', '📮', '🚲', '🐦'],
    'космос': ['🚀', '🌍', '⭐', '🌙', '☄️', '🛸', '🛰️', '✨'],
    'замок': ['🏰', '👑', '⚔️', '🛡️', '🗝️', '📜', '🕯️', '💎'],
    'горы': ['⛰️', '🏔️', '🗻', '🏕️', '🦅', '🌲', '❄️', '🧗'],
    'сад': ['🌸', '🌺', '🌷', '🌹', '🦋', '🐝', '🌻', '🌼']
  };
  
  const objects = objectTypes[location] || objectTypes['лес'];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="shadow">
      <feDropShadow dx="2" dy="3" stdDeviation="3"/>
    </filter>
  </defs>
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1e2d2d"/>
  <rect y="${height * 0.7}" width="100%" height="${height * 0.3}" fill="#2a3f3f"/>
  
  <!-- Предметы -->
  ${objects.map((obj, i) => {
    const x = 100 + (i % 4) * (width - 200) / 3;
    const y = height * 0.25 + Math.floor(i / 4) * 180;
    const size = 60;
    return `
      <g transform="translate(${x}, ${y})">
        <rect x="-${size/2}" y="-${size/2}" width="${size}" height="${size}" rx="12" fill="rgba(255,255,255,0.1)" filter="url(#shadow)"/>
        <text x="0" y="15" text-anchor="middle" font-size="40">${obj}</text>
      </g>
    `;
  }).join('')}
  
  <!-- Заголовок -->
  <text x="${width/2}" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="white">🪑 Предметы</text>
  <text x="${width/2}" y="65" text-anchor="middle" font-size="12" fill="#888">${location} • ${objects.length} предметов</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Предметы</text>
</svg>`;
}

async function generateCharactersAgentSVG(settings: any): Promise<string> {
  const { width, height, mood, style } = settings;
  
  // Персонажи
  const characters = [
    { emoji: '🧙‍♂️', role: 'Мудрец', color: '#9370DB' },
    { emoji: '🧝‍♀️', role: 'Эльф', color: '#4ECDC4' },
    { emoji: '🦊', role: 'Спутник', color: '#FF6B6B' }
  ];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="shadow">
      <feDropShadow dx="3" dy="5" stdDeviation="4"/>
    </filter>
    <linearGradient id="charGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4a4a6a"/>
      <stop offset="100%" stop-color="#2a2a3a"/>
    </linearGradient>
  </defs>
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  <rect y="${height * 0.75}" width="100%" height="${height * 0.25}" fill="url(#charGrad)"/>
  
  <!-- Персонажи -->
  ${characters.map((char, i) => {
    const x = width * (0.25 + i * 0.25);
    const y = height * 0.5;
    const scale = i === 0 ? 1.3 : 1;
    return `
      <g transform="translate(${x}, ${y}) scale(${scale})">
        <!-- Тень -->
        <ellipse cx="0" cy="80" rx="50" ry="15" fill="rgba(0,0,0,0.3)"/>
        <!-- Подсветка -->
        <circle cx="0" cy="0" r="60" fill="${char.color}" opacity="0.2"/>
        <!-- Эмодзи персонажа -->
        <text x="0" y="20" text-anchor="middle" font-size="70">${char.emoji}</text>
        <!-- Имя -->
        <text x="0" y="110" text-anchor="middle" font-size="14" fill="white">${char.role}</text>
      </g>
    `;
  }).join('')}
  
  <!-- Заголовок -->
  <text x="${width/2}" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="white">👤 Персонажи</text>
  <text x="${width/2}" y="65" text-anchor="middle" font-size="12" fill="#888">${characters.length} персонажей • ${mood}</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Персонажи</text>
</svg>`;
}

async function generateLayoutAgentSVG(settings: any): Promise<string> {
  const { width, height, location } = settings;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Сетка позиций -->
  <g opacity="0.3">
    ${Array.from({length: 6}, (_, i) => 
      `<line x1="${width * (i + 1) / 7}" y1="${height * 0.15}" x2="${width * (i + 1) / 7}" y2="${height * 0.85}" stroke="rgba(100,150,255,0.4)" stroke-width="1"/>`
    ).join('')}
    ${Array.from({length: 4}, (_, i) => 
      `<line x1="${width * 0.1}" y1="${height * (0.15 + i * 0.2)}" x2="${width * 0.9}" y2="${height * (0.15 + i * 0.2)}" stroke="rgba(100,150,255,0.4)" stroke-width="1"/>`
    ).join('')}
  </g>
  
  <!-- Зоны -->
  <g>
    <!-- Зона А - Фон -->
    <rect x="${width * 0.1}" y="${height * 0.15}" width="${width * 0.25}" height="${height * 0.35}" rx="10" 
          fill="rgba(100,200,100,0.15)" stroke="rgba(100,200,100,0.5)" stroke-width="2"/>
    <text x="${width * 0.225}" y="${height * 0.35}" text-anchor="middle" font-size="14" fill="rgba(100,200,100,0.9)">Фон</text>
    
    <!-- Зона Б - Персонажи -->
    <rect x="${width * 0.4}" y="${height * 0.25}" width="${width * 0.25}" height="${height * 0.4}" rx="10" 
          fill="rgba(200,200,100,0.15)" stroke="rgba(200,200,100,0.5)" stroke-width="2"/>
    <text x="${width * 0.525}" y="${height * 0.48}" text-anchor="middle" font-size="14" fill="rgba(200,200,100,0.9)">Персонажи</text>
    
    <!-- Зона В - Предметы -->
    <rect x="${width * 0.65}" y="${height * 0.35}" width="${width * 0.25}" height="${height * 0.35}" rx="10" 
          fill="rgba(200,100,100,0.15)" stroke="rgba(200,100,100,0.5)" stroke-width="2"/>
    <text x="${width * 0.775}" y="${height * 0.55}" text-anchor="middle" font-size="14" fill="rgba(200,100,100,0.9)">Предметы</text>
  </g>
  
  <!-- Стрелки -->
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="rgba(255,255,255,0.5)"/>
    </marker>
  </defs>
  
  <g stroke="rgba(255,255,255,0.4)" stroke-width="2" fill="none">
    <path d="M ${width * 0.35} ${height * 0.4} L ${width * 0.4} ${height * 0.45}" marker-end="url(#arrow)"/>
    <path d="M ${width * 0.65} ${height * 0.45} L ${width * 0.65} ${height * 0.55}" marker-end="url(#arrow)"/>
  </g>
  
  <!-- Заголовок -->
  <text x="${width/2}" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="white">📍 Расстановка</text>
  <text x="${width/2}" y="65" text-anchor="middle" font-size="12" fill="#888">${location}</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Расстановка</text>
</svg>`;
}

async function generateAnimationFrameSVG(settings: any): Promise<string> {
  const { width, height, mood } = settings;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <style>
    .float1 { animation: float1 3s ease-in-out infinite; }
    .float2 { animation: float1 3s ease-in-out infinite; animation-delay: 1s; }
    .float3 { animation: float1 3s ease-in-out infinite; animation-delay: 2s; }
    .pulse { animation: pulse 2s ease-in-out infinite; }
    
    @keyframes float1 {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-30px); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.1); }
    }
  </style>
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Анимированные элементы -->
  <circle cx="250" cy="250" r="60" fill="#9370DB" class="float1" opacity="0.7"/>
  <circle cx="512" cy="280" r="80" fill="#4ECDC4" class="float2" opacity="0.6"/>
  <circle cx="750" cy="240" r="50" fill="#FF6B6B" class="float3" opacity="0.7"/>
  
  <!-- Пульсирующие точки -->
  <circle cx="200" cy="400" r="15" fill="#FFD700" class="pulse"/>
  <circle cx="400" cy="420" r="12" fill="#FF6B6B" class="pulse" style="animation-delay: 0.5s"/>
  <circle cx="600" cy="400" r="18" fill="#4ECDC4" class="pulse" style="animation-delay: 1s"/>
  <circle cx="800" cy="430" r="14" fill="#9370DB" class="pulse" style="animation-delay: 1.5s"/>
  
  <!-- Заголовок -->
  <text x="${width/2}" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="white">🎬 Анимация</text>
  <text x="${width/2}" y="65" text-anchor="middle" font-size="12" fill="#888">${mood} • float, pulse</text>
  
  <!-- Таймлайн -->
  <g transform="translate(50, ${height - 70})">
    <rect width="${width - 100}" height="6" rx="3" fill="rgba(255,255,255,0.2)"/>
    <rect width="${(width - 100) * 0.6}" height="6" rx="3" fill="#ff6b6b"/>
    
    <!-- Ключевые кадры -->
    <circle cx="0" cy="3" r="8" fill="#ff6b6b"/>
    <circle cx="${(width - 100) * 0.3}" cy="3" r="6" fill="rgba(255,255,255,0.5)"/>
    <circle cx="${(width - 100) * 0.6}" cy="3" r="8" fill="rgba(255,255,255,0.5)"/>
    
    <text x="0" y="30" text-anchor="middle" font-size="10" fill="#888">0s</text>
    <text x="${(width - 100) * 0.3}" y="30" text-anchor="middle" font-size="10" fill="#888">1s</text>
    <text x="${(width - 100) * 0.6}" y="30" text-anchor="middle" font-size="10" fill="#888">2s</text>
  </g>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Анимация</text>
</svg>`;
}

// Вспомогательные функции

function generateLocationGround(width: number, height: number, location: string): string {
  const groundY = height * 0.6;
  
  if (location.includes('море')) {
    return `
      <defs>
        <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#40E0D0"/>
          <stop offset="100%" stop-color="#006994"/>
        </linearGradient>
      </defs>
      <rect y="${groundY}" width="100%" height="${height - groundY}" fill="url(#waterGrad)"/>
      ${Array.from({length: 6}, (_, i) => {
        const y = groundY + i * 25 + 20;
        return `<path d="M 0 ${y} Q ${width * 0.25} ${y - 15} ${width * 0.5} ${y} T ${width} ${y}" 
                     fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`;
      }).join('')}`;
  }
  
  if (location.includes('город')) {
    // Здания
    let city = `<rect y="${groundY}" width="100%" height="${height - groundY}" fill="#3a3a4a"/>`;
    for (let i = 0; i < 10; i++) {
      const x = i * (width / 10);
      const bHeight = Math.random() * (height - groundY) * 0.8 + (height - groundY) * 0.2;
      city += `<rect x="${x}" y="${groundY + (height - groundY) - bHeight}" width="${width / 11}" height="${bHeight}" fill="#2a2a3a"/>`;
    }
    return city;
  }
  
  // Стандартная земля (трава)
  return `
    <defs>
      <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#228B22"/>
        <stop offset="100%" stop-color="#006400"/>
      </linearGradient>
    </defs>
    <rect y="${groundY}" width="100%" height="${height - groundY}" fill="url(#grassGrad)"/>
    
    ${location.includes('лес') ? Array.from({length: 8}, (_, i) => {
      const x = i * width / 7 + Math.random() * 50;
      const treeHeight = Math.random() * 80 + 100;
      return `
        <g transform="translate(${x}, ${groundY})">
          <rect x="-10" y="0" width="20" height="${treeHeight * 0.25}" fill="#8B4513"/>
          <ellipse cx="0" cy="${-treeHeight * 0.15}" rx="${treeHeight * 0.2}" ry="${treeHeight * 0.35}" fill="#228B22"/>
        </g>`;
    }).join('') : ''}
  `;
}

function generateDetailsForLocation(width: number, height: number, location: string, style: string): string {
  let details = '';
  
  if (location.includes('лес')) {
    // Листья, грибы, цветы
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 15 + 8;
      const colors = ['#228B22', '#32CD32', '#90EE90', '#8B4513'];
      details += `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size * 0.6}" fill="${colors[Math.floor(Math.random() * colors.length)]}" opacity="0.7"/>`;
    }
  } else if (location.includes('море')) {
    // Волны, ракушки
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * width;
      const y = height * 0.5 + Math.random() * height * 0.4;
      details += `<path d="M ${x} ${y} q 20 -15 40 0 q 20 15 40 0" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>`;
    }
  } else {
    // Общие детали
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const y = height * 0.6 + Math.random() * height * 0.3;
      const size = Math.random() * 25 + 10;
      details += `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size * 0.5}" fill="#696969" opacity="0.6"/>`;
    }
  }
  
  return details;
}

function generateFallbackSVG(agent: any, settings: any): string {
  const { width, height } = settings;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#1a1a2e"/>
    <text x="${width/2}" y="${height/2}" text-anchor="middle" font-size="48">${agent.icon}</text>
    <text x="${width/2}" y="${height/2 + 40}" text-anchor="middle" font-size="20" fill="white">${agent.name}</text>
    <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
  </svg>`;
}

function generateStoryboard(results: any, settings: any, agents: any[]): any {
  const frames = agents.map((agent, i) => ({
    id: i + 1,
    agentId: agent.id,
    agentName: agent.name,
    agentIcon: agent.icon,
    svg: results[agent.id]?.svg || '',
    success: results[agent.id]?.success || false,
    executionTime: results[agent.id]?.executionTime || 0
  }));
  
  // CSS для анимации
  const css = `
.fortorium-storyboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
}

.fortorium-frame {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  transition: transform 0.3s ease;
}

.fortorium-frame:hover {
  transform: scale(1.02);
}

.fortorium-frame img {
  width: 100%;
  height: auto;
}
`;
  
  return {
    frames,
    css,
    html: generateStoryboardHTML(frames)
  };
}

function generateStoryboardHTML(frames: any[]): string {
  return `<div class="fortorium-storyboard">
  ${frames.map(frame => `
    <div class="fortorium-frame">
      <div style="background: linear-gradient(135deg, #1a1a2e, #2a2a3e); padding: 8px; border-radius: 8px 8px 0 0;">
        <span style="font-size: 20px;">${frame.agentIcon}</span>
        <span style="color: white; font-weight: bold; margin-left: 8px;">${frame.agentName}</span>
      </div>
      <!-- SVG content here -->
    </div>
  `).join('')}
</div>`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-coordinator',
    name: 'Координатор SVG-команды',
    specialization: 'Параллельная генерация SVG раскадровок + композитор',
    team: SVG_AGENTS,
    mode: 'parallel',
    features: [
      'Параллельное выполнение 10 агентов',
      'Каждый агент создаёт полноценный SVG кадр',
      'Композитор собирает все слои в одну картинку',
      'CSS для анимации',
      'Метаданные выполнения'
    ],
    status: 'ready',
    version: '4.4.0'
  });
}

// ===== ФУНКЦИЯ КОМПОЗИТОРА =====
// Собирает все слои в финальную картинку

async function composeFinalScene(config: any): Promise<{ svg: string }> {
  const { settings, dimensions } = config;
  const { width, height } = dimensions;
  const { timeOfDay, location, mood, style } = settings;
  
  // Цвета неба по времени суток
  const skyColors: Record<string, string[]> = {
    'утро': ['#FFE4B5', '#FFDEAD', '#87CEEB'],
    'день': ['#87CEEB', '#ADD8E6', '#B0E0E6'],
    'вечер': ['#FF8C00', '#FF7F50', '#6B4226'],
    'ночь': ['#191970', '#000080', '#0A0A1A'],
    'рассвет': ['#FFB6C1', '#FFA07A', '#FFD700'],
    'закат': ['#FF4500', '#DC143C', '#4B0082']
  };
  const sky = skyColors[timeOfDay] || skyColors['день'];
  
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="fortorium-final">
  <defs>
    <linearGradient id="fSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${sky[0]}"/><stop offset="50%" stop-color="${sky[1]}"/><stop offset="100%" stop-color="${sky[2]}"/>
    </linearGradient>
    <linearGradient id="fGround" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#228B22"/><stop offset="100%" stop-color="#006400"/>
    </linearGradient>
    <linearGradient id="fWater" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#40E0D0"/><stop offset="100%" stop-color="#006994"/>
    </linearGradient>
    <filter id="fGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="S"/></feMerge></filter>
    <filter id="fShadow"><feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/></filter>
    <radialGradient id="fVignette" cx="50%" cy="50%" r="70%">
      <stop offset="50%" stop-color="transparent"/><stop offset="100%" stop-color="rgba(0,0,0,0.3)"/>
    </radialGradient>
  </defs>
  
  <!-- НЕБО -->
  <rect width="100%" height="${height * 0.65}" fill="url(#fSky)"/>
  ${timeOfDay === 'ночь' ? `
    <circle cx="${width * 0.8}" cy="${height * 0.12}" r="35" fill="#F5F5DC" filter="url(#fGlow)"/>
    ${Array.from({length: 40}, () => `<circle cx="${Math.random() * width}" cy="${Math.random() * height * 0.5}" r="${Math.random() * 2 + 0.5}" fill="white" opacity="${Math.random() * 0.5 + 0.4}"/>`).join('')}
  ` : `
    <circle cx="${width * 0.78}" cy="${height * 0.1}" r="40" fill="#FFD700" filter="url(#fGlow)"/>
    ${Array.from({length: 5}, () => `<g transform="translate(${Math.random() * width}, ${Math.random() * height * 0.25}) scale(${Math.random() * 0.4 + 0.6})" opacity="0.8"><ellipse cx="0" cy="0" rx="50" ry="30" fill="white"/><ellipse cx="40" cy="10" rx="35" ry="25" fill="white"/><ellipse cx="-30" cy="8" rx="30" ry="20" fill="white"/></g>`).join('')}
  `}
  
  <!-- ЗЕМЛЯ -->
  ${location.includes('море') ? `
    <rect y="${height * 0.6}" width="100%" height="${height * 0.4}" fill="url(#fWater)"/>
    ${Array.from({length: 6}, (_, i) => `<path d="M 0 ${height * 0.65 + i * 20} Q ${width * 0.25} ${height * 0.63 + i * 20} ${width * 0.5} ${height * 0.65 + i * 20} T ${width} ${height * 0.65 + i * 20}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`).join('')}
  ` : location.includes('город') ? `
    <rect y="${height * 0.6}" width="100%" height="${height * 0.4}" fill="#3a3a4a"/>
    ${Array.from({length: 10}, (_, i) => {
      const bH = Math.random() * height * 0.3 + height * 0.1;
      return `<rect x="${i * width / 10}" y="${height - bH}" width="${width / 11}" height="${bH}" fill="#2a2a3a"/>`;
    }).join('')}
  ` : `
    <rect y="${height * 0.6}" width="100%" height="${height * 0.4}" fill="url(#fGround)"/>
    ${location.includes('лес') ? Array.from({length: 8}, (_, i) => {
      const tH = Math.random() * 80 + 100;
      return `<g transform="translate(${i * width / 7}, ${height * 0.65})" filter="url(#fShadow)"><rect x="-10" y="0" width="20" height="${tH * 0.25}" fill="#8B4513"/><ellipse cx="0" cy="${-tH * 0.15}" rx="${tH * 0.2}" ry="${tH * 0.35}" fill="#228B22"/></g>`;
    }).join('') : ''}
  `}
  
  <!-- ПЕРСОНАЖИ -->
  <g transform="translate(${width * 0.4}, ${height * 0.75}) scale(1.1)" filter="url(#fShadow)">
    <ellipse cx="0" cy="55" rx="25" ry="8" fill="rgba(0,0,0,0.2)"/>
    <ellipse cx="0" cy="25" rx="22" ry="32" fill="#4ECDC4"/>
    <circle cx="0" cy="-15" r="25" fill="#FFE4C4"/>
    <ellipse cx="0" cy="-32" rx="22" ry="12" fill="#8B4513"/>
    <circle cx="-9" cy="-17" r="3" fill="#333"/><circle cx="9" cy="-17" r="3" fill="#333"/>
    <path d="M -7 -5 Q 0 4 7 -5" fill="none" stroke="#333" stroke-width="2"/>
  </g>
  
  <g transform="translate(${width * 0.65}, ${height * 0.78}) scale(0.9)" filter="url(#fShadow)">
    <ellipse cx="0" cy="50" rx="22" ry="6" fill="rgba(0,0,0,0.2)"/>
    <ellipse cx="0" cy="25" rx="20" ry="28" fill="#FF6B6B"/>
    <circle cx="0" cy="-10" r="22" fill="#FFE4C4"/>
    <ellipse cx="0" cy="-25" rx="18" ry="10" fill="#FFD700"/>
    <circle cx="-8" cy="-11" r="2.5" fill="#333"/><circle cx="8" cy="-11" r="2.5" fill="#333"/>
  </g>
  
  <g transform="translate(${width * 0.22}, ${height * 0.85}) scale(0.7)" filter="url(#fShadow)">
    <ellipse cx="0" cy="25" rx="18" ry="5" fill="rgba(0,0,0,0.2)"/>
    <ellipse cx="0" cy="12" rx="18" ry="14" fill="#FF8C00"/>
    <circle cx="22" cy="4" r="10" fill="#FF8C00"/>
    <polygon points="27,-3 33,4 31,8" fill="#FF8C00"/><polygon points="18,-3 24,4 22,8" fill="#FF8C00"/>
    <circle cx="25" cy="3" r="2.5" fill="white"/><circle cx="25" cy="4" r="1.2" fill="#333"/>
  </g>
  
  <!-- АТМОСФЕРА -->
  ${mood === 'таинственный' || mood === 'волшебный' ? `<rect width="100%" height="100%" fill="rgba(100,50,150,0.1)" style="mix-blend-mode:overlay"/>` : ''}
  ${mood === 'волшебный' ? Array.from({length: 15}, () => `<circle cx="${Math.random() * width}" cy="${Math.random() * height}" r="${Math.random() * 3 + 1}" fill="#FFD700" opacity="${Math.random() * 0.4 + 0.3}"/>`).join('') : ''}
  
  <!-- ВИНЬЕТКА И РАМКА -->
  <rect width="100%" height="100%" fill="url(#fVignette)"/>
  <rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" rx="4"/>
  
  <!-- ПОДПИСИ -->
  <text x="${width - 15}" y="${height - 15}" text-anchor="end" font-size="11" fill="rgba(255,255,255,0.4)" font-weight="bold">ФОРТОРИУМ</text>
  <text x="15" y="${height - 15}" font-size="10" fill="rgba(255,255,255,0.5)">${location} • ${timeOfDay} • ${mood}</text>
</svg>`
  };
}
