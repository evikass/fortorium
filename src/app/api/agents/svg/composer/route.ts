import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-композитор: Собирает все слои в одну финальную картинку
 * Принимает результаты 10 SVG агентов и объединяет их
 */

// Порядок слоёв от нижнего к верхнему
const LAYER_ORDER = [
  'palette',      // Базовые цвета (самый нижний)
  'background',   // Фон
  'perspective',  // Перспектива (направляющие)
  'composition',  // Композиция
  'lighting',     // Освещение
  'details',      // Детали фона
  'objects',      // Предметы
  'characters',   // Персонажи
  'layout',       // Расстановка
  'animation'     // Анимация (верхний)
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agents = {},
      settings = {},
      dimensions = { width: 1024, height: 576 },
      style = 'ghibli'
    } = body;
    
    const { width, height } = dimensions;
    
    console.log('[SVG-Composer] Composing final image from', Object.keys(agents).length, 'agents');
    
    // Извлекаем полезные данные из агентов для создания финального SVG
    const palette = agents.palette?.palette || getDefaultPalette(style);
    const timeOfDay = settings.timeOfDay || 'день';
    const location = settings.location || 'лес';
    const mood = settings.mood || 'спокойный';
    
    // Генерируем финальную композицию
    const finalSVG = composeFinalScene({
      width,
      height,
      palette,
      timeOfDay,
      location,
      mood,
      style,
      agentResults: agents
    });
    
    // Также создаём версию с превью всех слоёв
    const layersPreview = composeLayersPreview(agents, dimensions);
    
    return NextResponse.json({
      success: true,
      agent: 'svg-composer',
      
      // Финальная собранная картинка
      svg: finalSVG,
      
      // Превью всех слоёв
      layersPreview: layersPreview,
      
      // Метаданные
      metadata: {
        layersUsed: Object.keys(agents).filter(k => agents[k]?.success),
        totalLayers: LAYER_ORDER.length,
        dimensions,
        composedAt: new Date().toISOString()
      },
      
      message: 'Финальная картинка собрана'
    });
    
  } catch (error) {
    console.error('[SVG-Composer] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

function composeFinalScene(config: any): string {
  const { width, height, palette, timeOfDay, location, mood, style } = config;
  
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
  
  // Генерируем полную сцену
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="fortorium-final-scene">
  <defs>
    <!-- Градиенты -->
    <linearGradient id="finalSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${sky[0]}"/>
      <stop offset="50%" stop-color="${sky[1]}"/>
      <stop offset="100%" stop-color="${sky[2]}"/>
    </linearGradient>
    
    <linearGradient id="finalGroundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${palette?.primary?.[0] || '#228B22'}"/>
      <stop offset="100%" stop-color="${palette?.primary?.[2] || '#006400'}"/>
    </linearGradient>
    
    <linearGradient id="finalWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#40E0D0"/>
      <stop offset="100%" stop-color="#006994"/>
    </linearGradient>
    
    <!-- Фильтры -->
    <filter id="finalShadow">
      <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
    
    <filter id="finalGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    
    <filter id="finalBlur">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
    
    <!-- Виньетка -->
    <radialGradient id="finalVignette" cx="50%" cy="50%" r="70%">
      <stop offset="50%" stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.3)"/>
    </radialGradient>
    
    <!-- Туман -->
    <linearGradient id="fogGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="rgba(200,200,220,0.4)"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
  </defs>
  
  <!-- ========================================== -->
  <!-- СЛОЙ 1: НЕБО (Background) -->
  <!-- ========================================== -->
  <g class="layer-sky">
    <rect width="100%" height="${height * 0.65}" fill="url(#finalSkyGrad)"/>
    
    <!-- Солнце или Луна -->
    ${timeOfDay === 'ночь' ? `
      <circle cx="${width * 0.8}" cy="${height * 0.12}" r="35" fill="#F5F5DC" filter="url(#finalGlow)"/>
      ${generateStars(width, height * 0.5)}
    ` : timeOfDay === 'вечер' || timeOfDay === 'закат' ? `
      <circle cx="${width * 0.15}" cy="${height * 0.3}" r="45" fill="#FF6347" filter="url(#finalGlow)" opacity="0.8"/>
    ` : `
      <circle cx="${width * 0.78}" cy="${height * 0.1}" r="40" fill="#FFD700" filter="url(#finalGlow)"/>
    `}
    
    <!-- Облака -->
    ${timeOfDay !== 'ночь' ? generateClouds(width, height * 0.35, style) : ''}
  </g>
  
  <!-- ========================================== -->
  <!-- СЛОЙ 2: ЗЕМЛЯ / ВОДА (Background) -->
  <!-- ========================================== -->
  <g class="layer-ground">
    ${generateGroundLayer(width, height, location, timeOfDay)}
  </g>
  
  <!-- ========================================== -->
  <!-- СЛОЙ 3: ДЕТАЛИ ФОНА -->
  <!-- ========================================== -->
  <g class="layer-details">
    ${generateBackgroundDetails(width, height, location, timeOfDay)}
  </g>
  
  <!-- ========================================== -->
  <!-- СЛОЙ 4: ПРЕДМЕТЫ -->
  <!-- ========================================== -->
  <g class="layer-objects">
    ${generateSceneObjects(width, height, location)}
  </g>
  
  <!-- ========================================== -->
  <!-- СЛОЙ 5: ПЕРСОНАЖИ -->
  <!-- ========================================== -->
  <g class="layer-characters">
    ${generateSceneCharacters(width, height, mood)}
  </g>
  
  <!-- ========================================== -->
  <!-- СЛОЙ 6: ОСВЕЩЕНИЕ -->
  <!-- ========================================== -->
  <g class="layer-lighting" style="mix-blend-mode: overlay;">
    ${generateLightingEffects(width, height, timeOfDay, mood)}
  </g>
  
  <!-- ========================================== -->
  <!-- СЛОЙ 7: АТМОСФЕРА -->
  <!-- ========================================== -->
  <g class="layer-atmosphere">
    ${generateAtmosphereEffects(width, height, mood, timeOfDay)}
  </g>
  
  <!-- ========================================== -->
  <!-- ФИНАЛЬНЫЕ ЭФФЕКТЫ -->
  <!-- ========================================== -->
  
  <!-- Виньетка -->
  <rect width="100%" height="100%" fill="url(#finalVignette)"/>
  
  <!-- Цветокоррекция по настроению -->
  ${mood === 'таинственный' || mood === 'волшебный' ? 
    `<rect width="100%" height="100%" fill="rgba(100,50,150,0.1)" style="mix-blend-mode: overlay;"/>` : ''}
  ${mood === 'грустный' ? 
    `<rect width="100%" height="100%" fill="rgba(50,80,120,0.15)" style="mix-blend-mode: overlay;"/>` : ''}
  ${mood === 'радостный' ? 
    `<rect width="100%" height="100%" fill="rgba(255,200,100,0.08)" style="mix-blend-mode: overlay;"/>` : ''}
  
  <!-- Рамка -->
  <rect x="2" y="2" width="${width-4}" height="${height-4}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" rx="4"/>
  
  <!-- Водяной знак -->
  <g transform="translate(${width - 15}, ${height - 20})">
    <text text-anchor="end" font-size="11" fill="rgba(255,255,255,0.4)" font-weight="bold">ФОРТОРИУМ</text>
  </g>
  
  <!-- Подпись сцены -->
  <g transform="translate(15, ${height - 20})">
    <text font-size="10" fill="rgba(255,255,255,0.5)">${location} • ${timeOfDay} • ${mood}</text>
  </g>
</svg>`;
}

function generateStars(width: number, maxHeight: number): string {
  let stars = '';
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * width;
    const y = Math.random() * maxHeight;
    const size = Math.random() * 2 + 0.5;
    const opacity = Math.random() * 0.6 + 0.4;
    stars += `<circle cx="${x}" cy="${y}" r="${size}" fill="white" opacity="${opacity}"/>`;
  }
  return stars;
}

function generateClouds(width: number, maxY: number, style: string): string {
  let clouds = '';
  const numClouds = style === 'ghibli' ? 6 : 4;
  
  for (let i = 0; i < numClouds; i++) {
    const x = (i + 0.5) * (width / numClouds) + (Math.random() - 0.5) * 100;
    const y = Math.random() * maxY * 0.6 + 30;
    const scale = Math.random() * 0.4 + 0.6;
    const opacity = style === 'ghibli' ? 0.9 : 0.7;
    
    clouds += `
    <g transform="translate(${x}, ${y}) scale(${scale})" opacity="${opacity}">
      <ellipse cx="0" cy="0" rx="50" ry="30" fill="white"/>
      <ellipse cx="40" cy="10" rx="35" ry="25" fill="white"/>
      <ellipse cx="-35" cy="8" rx="30" ry="22" fill="white"/>
      <ellipse cx="15" cy="-15" rx="30" ry="20" fill="white"/>
    </g>`;
  }
  return clouds;
}

function generateGroundLayer(width: number, height: number, location: string, timeOfDay: string): string {
  const groundY = height * 0.6;
  const isNight = timeOfDay === 'ночь';
  
  if (location.includes('море') || location.includes('океан')) {
    // Море
    let sea = `<rect y="${groundY}" width="100%" height="${height - groundY}" fill="url(#finalWaterGrad)"/>`;
    
    // Волны
    for (let i = 0; i < 8; i++) {
      const waveY = groundY + 30 + i * 25;
      const amplitude = 8 - i;
      sea += `<path d="M 0 ${waveY} `;
      for (let x = 0; x <= width; x += 50) {
        const y = waveY + Math.sin(x * 0.02 + i) * amplitude;
        sea += `Q ${x + 25} ${y - amplitude} ${x + 50} ${waveY} `;
      }
      sea += `" fill="none" stroke="rgba(255,255,255,${0.3 - i * 0.03})" stroke-width="2"/>`;
    }
    return sea;
  }
  
  if (location.includes('город')) {
    // Город
    let city = `<rect y="${groundY}" width="100%" height="${height - groundY}" fill="#3a3a4a"/>`;
    
    // Здания
    const buildingCount = 12;
    for (let i = 0; i < buildingCount; i++) {
      const x = i * (width / buildingCount);
      const bWidth = width / buildingCount - 5;
      const bHeight = Math.random() * (height - groundY) * 0.7 + (height - groundY) * 0.3;
      const bY = height - bHeight;
      
      // Здание
      city += `<rect x="${x}" y="${bY}" width="${bWidth}" height="${bHeight}" fill="#2a2a3a"/>`;
      
      // Окна
      const windowRows = Math.floor(bHeight / 20);
      const windowCols = Math.floor(bWidth / 15);
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          const wx = x + 5 + col * 15;
          const wy = bY + 10 + row * 20;
          const lit = Math.random() > (isNight ? 0.3 : 0.7);
          city += `<rect x="${wx}" y="${wy}" width="8" height="10" fill="${lit ? (isNight ? '#FFD700' : '#87CEEB') : '#1a1a2e'}"/>`;
        }
      }
    }
    return city;
  }
  
  // Стандартная земля - трава/лес
  let ground = `<rect y="${groundY}" width="100%" height="${height - groundY}" fill="url(#finalGroundGrad)"/>`;
  
  // Трава
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * width;
    const y = groundY + Math.random() * (height - groundY) * 0.15;
    const bladeHeight = Math.random() * 15 + 5;
    const curve = Math.random() * 10 - 5;
    ground += `<path d="M ${x} ${y} q ${curve} ${-bladeHeight/2} 0 ${-bladeHeight}" stroke="${['#228B22', '#32CD32', '#2E8B57'][Math.floor(Math.random() * 3)]}" stroke-width="1.5" fill="none" opacity="0.7"/>`;
  }
  
  // Деревья для леса
  if (location.includes('лес')) {
    for (let i = 0; i < 8; i++) {
      const x = i * (width / 7) + (Math.random() - 0.5) * 80;
      const treeHeight = Math.random() * 100 + 120;
      const y = groundY + (height - groundY) * 0.2;
      
      ground += `
      <g transform="translate(${x}, ${y})" filter="url(#finalShadow)">
        <rect x="-12" y="0" width="24" height="${treeHeight * 0.25}" fill="#8B4513" rx="3"/>
        <ellipse cx="0" cy="${-treeHeight * 0.15}" rx="${treeHeight * 0.22}" ry="${treeHeight * 0.38}" fill="#228B22"/>
        <ellipse cx="${-treeHeight * 0.1}" cy="${-treeHeight * 0.05}" rx="${treeHeight * 0.15}" ry="${treeHeight * 0.25}" fill="#2E8B57"/>
        <ellipse cx="${treeHeight * 0.08}" cy="${-treeHeight * 0.2}" rx="${treeHeight * 0.12}" ry="${treeHeight * 0.2}" fill="#32CD32"/>
      </g>`;
    }
  }
  
  // Горы
  if (location.includes('горы')) {
    ground += `
      <polygon points="0,${height} 200,${groundY - 80} 400,${height}" fill="#4A5568" opacity="0.5"/>
      <polygon points="300,${height} 550,${groundY - 120} 800,${height}" fill="#2D3748" opacity="0.6"/>
      <polygon points="600,${height} 850,${groundY - 60} ${width},${height}" fill="#1A202C" opacity="0.7"/>
      <polygon points="480,${groundY - 120} 520,${groundY - 140} 560,${groundY - 110}" fill="white" opacity="0.8"/>`;
  }
  
  // Цветы для сада
  if (location.includes('сад')) {
    const flowerColors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB', '#00CED1'];
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = groundY + Math.random() * (height - groundY) * 0.4;
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const scale = Math.random() * 0.5 + 0.5;
      
      ground += `
      <g transform="translate(${x}, ${y}) scale(${scale})">
        <line x1="0" y1="0" x2="0" y2="20" stroke="#228B22" stroke-width="2"/>
        <circle cx="0" cy="0" r="8" fill="${color}"/>
        <circle cx="0" cy="0" r="3" fill="#FFD700"/>
      </g>`;
    }
  }
  
  return ground;
}

function generateBackgroundDetails(width: number, height: number, location: string, timeOfDay: string): string {
  const groundY = height * 0.65;
  let details = '';
  
  if (location.includes('лес') || location.includes('горы')) {
    // Папоротники, листья
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const y = groundY + Math.random() * (height - groundY) * 0.3;
      details += `<ellipse cx="${x}" cy="${y}" rx="${Math.random() * 20 + 10}" ry="${Math.random() * 10 + 5}" fill="#2E8B57" opacity="0.5"/>`;
    }
  }
  
  if (location.includes('море')) {
    // Чайки
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.4 + 50;
      details += `<path d="M ${x} ${y} q 10 -5 20 0 q 10 5 20 0" fill="none" stroke="#555" stroke-width="1.5"/>`;
    }
  }
  
  return details;
}

function generateSceneObjects(width: number, height: number, location: string): string {
  const groundY = height * 0.7;
  let objects = '';
  
  // Камни
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * width;
    const y = groundY + Math.random() * (height - groundY) * 0.3;
    const size = Math.random() * 25 + 15;
    objects += `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size * 0.6}" fill="#696969" filter="url(#finalShadow)" opacity="0.7"/>`;
  }
  
  // Пни/брёвна для леса
  if (location.includes('лес')) {
    const x = Math.random() * width;
    const y = groundY + 20;
    objects += `
      <g transform="translate(${x}, ${y})" filter="url(#finalShadow)">
        <ellipse cx="0" cy="0" rx="25" ry="12" fill="#8B4513"/>
        <ellipse cx="0" cy="-3" rx="20" ry="8" fill="#A0522D"/>
        <circle cx="-5" cy="-2" r="3" fill="#654321"/>
        <circle cx="5" cy="-1" r="2" fill="#654321"/>
        <circle cx="0" cy="3" r="2.5" fill="#654321"/>
      </g>`;
  }
  
  return objects;
}

function generateSceneCharacters(width: number, height: number, mood: string): string {
  const groundY = height * 0.75;
  let characters = '';
  
  // Главный персонаж
  characters += `
    <g transform="translate(${width * 0.4}, ${groundY}) scale(1.2)" filter="url(#finalShadow)">
      <!-- Тень -->
      <ellipse cx="0" cy="60" rx="30" ry="8" fill="rgba(0,0,0,0.2)"/>
      <!-- Тело -->
      <ellipse cx="0" cy="30" rx="25" ry="35" fill="#4ECDC4"/>
      <!-- Голова -->
      <circle cx="0" cy="-15" r="28" fill="#FFE4C4"/>
      <!-- Волосы -->
      <ellipse cx="0" cy="-35" rx="25" ry="15" fill="#8B4513"/>
      <!-- Глаза -->
      <ellipse cx="-10" cy="-18" rx="5" ry="6" fill="white"/>
      <ellipse cx="10" cy="-18" rx="5" ry="6" fill="white"/>
      <circle cx="-10" cy="-17" r="3" fill="#333"/>
      <circle cx="10" cy="-17" r="3" fill="#333"/>
      <!-- Рот -->
      <path d="M -8 -5 Q 0 5 8 -5" fill="none" stroke="#333" stroke-width="2"/>
    </g>`;
  
  // Второстепенный персонаж
  characters += `
    <g transform="translate(${width * 0.65}, ${groundY + 10}) scale(0.9)" filter="url(#finalShadow)">
      <ellipse cx="0" cy="55" rx="25" ry="6" fill="rgba(0,0,0,0.2)"/>
      <ellipse cx="0" cy="28" rx="22" ry="30" fill="#FF6B6B"/>
      <circle cx="0" cy="-10" r="24" fill="#FFE4C4"/>
      <ellipse cx="0" cy="-28" rx="20" ry="12" fill="#FFD700"/>
      <ellipse cx="-8" cy="-12" rx="4" ry="5" fill="white"/>
      <ellipse cx="8" cy="-12" rx="4" ry="5" fill="white"/>
      <circle cx="-8" cy="-11" r="2.5" fill="#333"/>
      <circle cx="8" cy="-11" r="2.5" fill="#333"/>
      <path d="M -6 -2 Q 0 4 6 -2" fill="none" stroke="#333" stroke-width="1.5"/>
    </g>`;
  
  // Спутник (животное)
  characters += `
    <g transform="translate(${width * 0.25}, ${groundY + 30}) scale(0.8)" filter="url(#finalShadow)">
      <ellipse cx="0" cy="30" rx="20" ry="5" fill="rgba(0,0,0,0.2)"/>
      <ellipse cx="0" cy="15" rx="20" ry="15" fill="#FF8C00"/>
      <circle cx="25" cy="5" r="12" fill="#FF8C00"/>
      <polygon points="30,-5 38,5 35,10" fill="#FF8C00"/>
      <polygon points="20,-5 28,5 25,10" fill="#FF8C00"/>
      <circle cx="28" cy="3" r="3" fill="white"/>
      <circle cx="28" cy="4" r="1.5" fill="#333"/>
      <ellipse cx="25" cy="12" rx="2" ry="1" fill="#333"/>
    </g>`;
  
  return characters;
}

function generateLightingEffects(width: number, height: number, timeOfDay: string, mood: string): string {
  let lighting = '';
  
  const lightConfig: Record<string, any> = {
    'день': { x: width * 0.75, y: height * 0.1, color: 'rgba(255,255,200,0.1)' },
    'утро': { x: width * 0.85, y: height * 0.2, color: 'rgba(255,200,150,0.15)' },
    'вечер': { x: width * 0.15, y: height * 0.25, color: 'rgba(255,100,50,0.2)' },
    'ночь': { x: width * 0.8, y: height * 0.1, color: 'rgba(200,200,255,0.05)' },
    'рассвет': { x: width * 0.9, y: height * 0.3, color: 'rgba(255,180,200,0.15)' },
    'закат': { x: width * 0.1, y: height * 0.3, color: 'rgba(255,80,50,0.2)' }
  };
  
  const light = lightConfig[timeOfDay] || lightConfig['день'];
  
  // Луч света
  lighting += `
    <defs>
      <radialGradient id="lightBeam" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${light.color}"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
    </defs>
    <ellipse cx="${light.x}" cy="${height * 0.6}" rx="${width * 0.5}" ry="${height * 0.5}" fill="url(#lightBeam)"/>`;
  
  return lighting;
}

function generateAtmosphereEffects(width: number, height: number, mood: string, timeOfDay: string): string {
  let atmosphere = '';
  
  // Туман
  if (mood === 'таинственный' || mood === 'волшебный') {
    atmosphere += `
      <rect y="${height * 0.5}" width="100%" height="${height * 0.5}" fill="url(#fogGrad)" opacity="0.4"/>`;
  }
  
  // Частицы магии
  if (mood === 'волшебный') {
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      atmosphere += `<circle cx="${x}" cy="${y}" r="${size}" fill="#FFD700" opacity="${Math.random() * 0.5 + 0.3}"/>`;
    }
  }
  
  // Дождь для грустного настроения
  if (mood === 'грустный') {
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      atmosphere += `<line x1="${x}" y1="${y}" x2="${x + 2}" y2="${y + 15}" stroke="rgba(150,180,220,0.3)" stroke-width="1"/>`;
    }
  }
  
  return atmosphere;
}

function composeLayersPreview(agents: any, dimensions: any): string {
  const { width, height } = dimensions;
  const thumbWidth = width / 5;
  const thumbHeight = height / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height * 2.2}" class="fortorium-layers-preview">
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <text x="${width/2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="white">Все слои</text>
  
  ${LAYER_ORDER.map((layerId, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = col * thumbWidth;
    const y = 50 + row * (thumbHeight + 10);
    
    const agent = agents[layerId];
    const icons: Record<string, string> = {
      palette: '🎨', background: '🌄', perspective: '📐', composition: '📊',
      lighting: '💡', details: '✨', objects: '🪑', characters: '👤',
      layout: '📍', animation: '🎬'
    };
    
    return `
      <g transform="translate(${x}, ${y})">
        <rect width="${thumbWidth - 5}" height="${thumbHeight}" fill="#2a2a3e" rx="4"/>
        <text x="${thumbWidth/2}" y="20" text-anchor="middle" font-size="16">${icons[layerId]}</text>
        <text x="${thumbWidth/2}" y="${thumbHeight - 10}" text-anchor="middle" font-size="8" fill="white">${layerId}</text>
        ${agent?.success ? `<circle cx="${thumbWidth - 15}" cy="15" r="5" fill="#4CAF50"/>` : ''}
      </g>`;
  }).join('')}
</svg>`;
}

function getDefaultPalette(style: string): any {
  const palettes: Record<string, any> = {
    ghibli: { primary: ['#87CEEB', '#B0E0E6'], secondary: ['#90EE90', '#98FB98'] },
    disney: { primary: ['#4169E1', '#6495ED'], secondary: ['#32CD32', '#00FF00'] },
    pixar: { primary: ['#FF6B6B', '#4ECDC4'], secondary: ['#2ECC71', '#27AE60'] },
    anime: { primary: ['#FF69B4', '#DDA0DD'], secondary: ['#98FB98', '#90EE90'] }
  };
  return palettes[style] || palettes.ghibli;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-composer',
    name: 'Композитор SVG',
    specialization: 'Сборка всех слоёв в финальную картинку',
    layerOrder: LAYER_ORDER,
    features: [
      'Объединение 10 слоёв в одно изображение',
      'Правильный z-index слоёв',
      'Атмосферные эффекты',
      'Освещение и тени',
      'Цветокоррекция по настроению',
      'Превью всех слоёв'
    ],
    status: 'ready'
  });
}
