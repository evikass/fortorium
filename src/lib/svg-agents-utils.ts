/**
 * ФОРТОРИУМ - Утилиты для SVG агентов
 * Каждая функция генерирует полноценный SVG кадр со специализацией агента
 */

import { STYLE_CONFIGS, createSVGRoot, createDefs, createGradient, createFilter } from './svg-generator';

export interface SceneSettings {
  width: number;
  height: number;
  location: string;
  timeOfDay: string;
  mood: string;
  style: 'ghibli' | 'disney' | 'pixar' | 'anime';
}

// ===== АГЕНТ 1: ЦВЕТОВАЯ ПАЛИТРА =====
// Создаёт кадр, демонстрирующий цветовую схему сцены

export function generatePaletteFrame(settings: SceneSettings): string {
  const config = STYLE_CONFIGS[settings.style];
  const { width, height } = settings;
  
  // Генерируем цвета на основе настроек
  const palette = generateColorPalette(settings);
  
  return `${createSVGRoot(width, height)}
${createDefs(`
  ${createGradient('demoGrad', palette.primary, 'horizontal')}
  ${createFilter('shadow', 'shadow')}
`)}
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Заголовок -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="24" font-weight="bold" fill="white">Цветовая палитра</text>
  <text x="${width/2}" y="80" text-anchor="middle" font-size="14" fill="#888">${settings.style} • ${settings.mood} • ${settings.timeOfDay}</text>
  
  <!-- Основные цвета -->
  <g transform="translate(50, 120)">
    <text x="0" y="0" font-size="12" fill="#888">Основные цвета</text>
    ${palette.primary.map((color: string, i: number) => `
      <g transform="translate(${i * 80}, 20)">
        <rect width="70" height="70" rx="8" fill="${color}" filter="url(#shadow)"/>
        <text x="35" y="90" text-anchor="middle" font-size="10" fill="#666">${color}</text>
      </g>
    `).join('')}
  </g>
  
  <!-- Вторичные цвета -->
  <g transform="translate(50, 250)">
    <text x="0" y="0" font-size="12" fill="#888">Акцентные цвета</text>
    ${palette.secondary.map((color: string, i: number) => `
      <g transform="translate(${i * 80}, 20)">
        <rect width="70" height="70" rx="8" fill="${color}" filter="url(#shadow)"/>
        <text x="35" y="90" text-anchor="middle" font-size="10" fill="#666">${color}</text>
      </g>
    `).join('')}
  </g>
  
  <!-- Градиентная полоса -->
  <g transform="translate(50, 380)">
    <text x="0" y="0" font-size="12" fill="#888">Градиент</text>
    <rect y="20" width="${width - 100}" height="40" rx="8" fill="url(#demoGrad)"/>
  </g>
  
  <!-- Цвета настроения -->
  <g transform="translate(50, 440)">
    <text x="0" y="0" font-size="12" fill="#888">Настроение: ${settings.mood}</text>
    ${palette.mood.map((color: string, i: number) => `
      <circle cx="${30 + i * 50}" cy="40" r="20" fill="${color}" filter="url(#shadow)"/>
    `).join('')}
  </g>
  
  <!-- Пример использования -->
  <g transform="translate(${width - 200}, 120)">
    <text x="0" y="0" font-size="12" fill="#888">Пример</text>
    <rect y="20" width="150" height="100" rx="8" fill="${palette.primary[0]}" filter="url(#shadow)"/>
    <rect y="40" x="20" width="110" height="20" rx="4" fill="${palette.secondary[0]}"/>
    <circle cx="75" cy="95" r="15" fill="${palette.accent}"/>
  </g>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Палитра</text>
</svg>`;
}

// ===== АГЕНТ 2: ФОН =====
// Создаёт детализированный фон сцены

export function generateBackgroundFrame(settings: SceneSettings): string {
  const config = STYLE_CONFIGS[settings.style];
  const { width, height, location, timeOfDay } = settings;
  
  // Определяем тип фона
  let backgroundContent = '';
  const skyColors = getSkyColors(timeOfDay, settings.style);
  
  return `${createSVGRoot(width, height)}
${createDefs(`
  ${createGradient('skyGrad', skyColors, 'vertical')}
  ${createGradient('groundGrad', config.palette.foliage, 'vertical')}
  ${createFilter('glow', 'glow')}
  ${createFilter('shadow', 'shadow')}
`)}
  
  <!-- Небо -->
  <rect width="100%" height="${height * 0.6}" fill="url(#skyGrad)"/>
  
  <!-- Небесные объекты -->
  ${generateCelestialBodies(width, height, timeOfDay)}
  
  <!-- Облака -->
  ${generateCloudLayer(width, height, timeOfDay, settings.style)}
  
  <!-- Земля по типу локации -->
  ${generateLocationBackground(width, height, location, settings.style, config)}
  
  <!-- Атмосферные эффекты -->
  ${generateAtmosphericEffects(width, height, settings.mood, timeOfDay)}
  
  <!-- Виньетка -->
  <defs>
    <radialGradient id="vignette">
      <stop offset="50%" stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.2)"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Фон</text>
</svg>`;
}

// ===== АГЕНТ 3: ПЕРСПЕКТИВА =====
// Создаёт сетку перспективы и направляющие линии

export function generatePerspectiveFrame(settings: SceneSettings): string {
  const { width, height } = settings;
  const vanishX = width * 0.5;
  const vanishY = height * 0.35;
  
  return `${createSVGRoot(width, height)}
${createDefs(`
  ${createGradient('gridGrad', ['rgba(100,150,255,0.3)', 'rgba(100,150,255,0.1)'], 'radial')}
`)}
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Сетка перспективы -->
  <g opacity="0.5">
    <!-- Горизонтальные линии -->
    ${Array.from({length: 20}, (_, i) => {
      const y = vanishY + (i * (height - vanishY) / 20);
      const perspectiveScale = (y - vanishY) / (height - vanishY);
      const leftX = vanishX - perspectiveScale * width;
      const rightX = vanishX + perspectiveScale * width;
      return `<line x1="${leftX}" y1="${y}" x2="${rightX}" y2="${y}" stroke="rgba(100,150,255,${0.1 + perspectiveScale * 0.3})" stroke-width="1"/>`;
    }).join('\n')}
    
    <!-- Вертикальные линии (лучи от точки схода) -->
    ${Array.from({length: 30}, (_, i) => {
      const angle = (i / 30) * Math.PI - Math.PI / 2;
      const endX = vanishX + Math.cos(angle) * width * 1.5;
      const endY = vanishY + Math.sin(angle) * height * 1.5;
      return `<line x1="${vanishX}" y1="${vanishY}" x2="${endX}" y2="${endY}" stroke="rgba(100,150,255,0.15)" stroke-width="1"/>`;
    }).join('\n')}
  </g>
  
  <!-- Точка схода -->
  <circle cx="${vanishX}" cy="${vanishY}" r="8" fill="#ff6b6b" filter="url(#glow)"/>
  <circle cx="${vanishX}" cy="${vanishY}" r="4" fill="white"/>
  
  <!-- Линия горизонта -->
  <line x1="0" y1="${vanishY}" x2="${width}" y2="${vanishY}" stroke="rgba(255,107,107,0.5)" stroke-width="2" stroke-dasharray="10,5"/>
  
  <!-- Зоны глубины -->
  <g opacity="0.3">
    <rect x="0" y="0" width="${width}" height="${vanishY}" fill="rgba(100,150,255,0.1)"/>
    <text x="20" y="30" font-size="12" fill="rgba(100,150,255,0.7)">Небо / Дальний план</text>
    
    <rect x="0" y="${vanishY}" width="${width}" height="${(height - vanishY) * 0.4}" fill="rgba(150,255,100,0.1)"/>
    <text x="20" y="${vanishY + 30}" font-size="12" fill="rgba(150,255,100,0.7)">Средний план</text>
    
    <rect x="0" y="${vanishY + (height - vanishY) * 0.4}" width="${width}" height="${(height - vanishY) * 0.6}" fill="rgba(255,200,100,0.1)"/>
    <text x="20" y="${vanishY + (height - vanishY) * 0.4 + 30}" font-size="12" fill="rgba(255,200,100,0.7)">Передний план</text>
  </g>
  
  <!-- Руководство по третям -->
  <g stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,5">
    <line x1="${width/3}" y1="0" x2="${width/3}" y2="${height}"/>
    <line x1="${width*2/3}" y1="0" x2="${width*2/3}" y2="${height}"/>
    <line x1="0" y1="${height/3}" x2="${width}" y2="${height/3}"/>
    <line x1="0" y1="${height*2/3}" x2="${width}" y2="${height*2/3}"/>
  </g>
  
  <!-- Информация -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="20" font-weight="bold" fill="white">Перспектива</text>
  <text x="${width/2}" y="75" text-anchor="middle" font-size="12" fill="#888">Одноточечная перспектива • Точка схода в центре</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Перспектива</text>
</svg>`;
}

// ===== АГЕНТ 4: КОМПОЗИЦИЯ =====
// Создаёт композиционную схему кадра

export function generateCompositionFrame(settings: SceneSettings): string {
  const { width, height, mood } = settings;
  
  // Определяем композицию по настроению
  const composition = getCompositionForMood(mood);
  
  return `${createSVGRoot(width, height)}
${createDefs(`
  ${createGradient('compGrad', ['rgba(150,100,255,0.3)', 'rgba(100,150,255,0.1)'], 'radial')}
`)}
  
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
  ${composition.interestPoints.map((p: {x: number, y: number}, i: number) => `
    <circle cx="${p.x}" cy="${p.y}" r="15" fill="rgba(255,107,107,0.5)" stroke="white" stroke-width="2"/>
    <text x="${p.x}" y="${p.y + 5}" text-anchor="middle" font-size="12" fill="white">${i + 1}</text>
  `).join('')}
  
  <!-- Направляющие линии -->
  <g stroke="rgba(100,200,255,0.5)" stroke-width="2" stroke-dasharray="10,5">
    ${composition.guidelines.map((line: {x1: number, y1: number, x2: number, y2: number}) => 
      `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}"/>`
    ).join('\n')}
  </g>
  
  <!-- Золотое сечение (спираль) -->
  <g transform="translate(${width * 0.2}, ${height * 0.1})" opacity="0.4">
    <path d="M 0,0 Q 100,0 100,100 Q 100,200 0,200 Q -100,200 -100,100 Q -100,0 0,0" 
          fill="none" stroke="rgba(255,200,100,0.6)" stroke-width="2"/>
  </g>
  
  <!-- Область фокуса -->
  <ellipse cx="${composition.focus.x}" cy="${composition.focus.y}" rx="100" ry="80" 
           fill="none" stroke="rgba(255,200,100,0.6)" stroke-width="3" stroke-dasharray="5,5"/>
  
  <!-- Информация -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="20" font-weight="bold" fill="white">Композиция</text>
  <text x="${width/2}" y="75" text-anchor="middle" font-size="12" fill="#888">${composition.type} • ${mood}</text>
  
  <!-- Легенда -->
  <g transform="translate(20, ${height - 100})">
    <rect width="180" height="80" rx="8" fill="rgba(0,0,0,0.5)"/>
    <circle cx="20" cy="20" r="6" fill="rgba(255,107,107,0.5)"/>
    <text x="35" y="25" font-size="10" fill="white">Точки интереса</text>
    <line x1="15" y1="45" x2="50" y2="45" stroke="rgba(100,200,255,0.5)" stroke-width="2" stroke-dasharray="5,5"/>
    <text x="60" y="50" font-size="10" fill="white">Направляющие</text>
    <ellipse cx="25" cy="70" rx="10" ry="8" fill="none" stroke="rgba(255,200,100,0.6)" stroke-width="2"/>
    <text x="45" y="75" font-size="10" fill="white">Фокус</text>
  </g>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Композиция</text>
</svg>`;
}

// ===== АГЕНТ 5: ОСВЕЩЕНИЕ =====
// Создаёт схему освещения сцены

export function generateLightingFrame(settings: SceneSettings): string {
  const { width, height, timeOfDay, mood } = settings;
  const lightConfig = getLightingConfig(timeOfDay, mood);
  
  return `${createSVGRoot(width, height)}
${createDefs(`
  ${createGradient('lightGrad', lightConfig.colors, 'radial')}
  ${createGradient('ambientGrad', lightConfig.ambient, 'vertical')}
  ${createFilter('glow', 'glow')}
`)}
  
  <!-- Фон сцены -->
  <rect width="100%" height="100%" fill="${lightConfig.ambient[0]}"/>
  
  <!-- Основной источник света -->
  <g transform="translate(${lightConfig.sourceX}, ${lightConfig.sourceY})">
    <!-- Лучи света -->
    ${Array.from({length: 12}, (_, i) => {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const rayLength = lightConfig.intensity * 150;
      return `<line x1="0" y1="0" 
                    x2="${Math.cos(angle) * rayLength}" 
                    y2="${Math.sin(angle) * rayLength}" 
                    stroke="${lightConfig.colors[0]}" 
                    stroke-width="${lightConfig.intensity * 20}"
                    opacity="0.2"
                    stroke-linecap="round"/>`;
    }).join('\n')}
    
    <!-- Источник -->
    <circle r="${20 + lightConfig.intensity * 15}" fill="${lightConfig.colors[0]}" filter="url(#glow)"/>
    <circle r="${15 + lightConfig.intensity * 10}" fill="white"/>
  </g>
  
  <!-- Области освещения -->
  <ellipse cx="${lightConfig.sourceX}" cy="${height * 0.7}" rx="${width * 0.4}" ry="${height * 0.3}" 
           fill="url(#lightGrad)" opacity="0.3"/>
  
  <!-- Тени -->
  <g opacity="0.3">
    <polygon points="0,${height} ${width * 0.3},${height} ${width * 0.35},${height * 0.8} 0,${height * 0.85}" 
             fill="rgba(0,0,0,${lightConfig.shadowIntensity})"/>
    <polygon points="${width},${height} ${width * 0.7},${height} ${width * 0.65},${height * 0.8} ${width},${height * 0.85}" 
             fill="rgba(0,0,0,${lightConfig.shadowIntensity})"/>
  </g>
  
  <!-- Отражённый свет -->
  <rect y="${height * 0.7}" width="${width}" height="${height * 0.3}" 
        fill="url(#ambientGrad)" opacity="0.2"/>
  
  <!-- Информация -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="20" font-weight="bold" fill="white">Освещение</text>
  <text x="${width/2}" y="75" text-anchor="middle" font-size="12" fill="#888">${timeOfDay} • Интенсивность: ${Math.round(lightConfig.intensity * 100)}%</text>
  
  <!-- Легенда -->
  <g transform="translate(20, ${height - 120})">
    <rect width="200" height="100" rx="8" fill="rgba(0,0,0,0.5)"/>
    <text x="15" y="25" font-size="11" fill="white">Источники света:</text>
    <circle cx="25" cy="45" r="8" fill="${lightConfig.colors[0]}"/>
    <text x="40" y="50" font-size="10" fill="#ccc">${lightConfig.type}</text>
    <rect x="15" y="60" width="30" height="15" fill="rgba(0,0,0,0.3)"/>
    <text x="50" y="72" font-size="10" fill="#ccc">Тени</text>
    <text x="15" y="92" font-size="10" fill="#888">Температура: ${lightConfig.temperature}</text>
  </g>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Освещение</text>
</svg>`;
}

// ===== АГЕНТ 6: ДЕТАЛИ =====
// Создаёт детализированные элементы фона

export function generateDetailsFrame(settings: SceneSettings): string {
  const { width, height, location, style } = settings;
  const config = STYLE_CONFIGS[style];
  
  return `${createSVGRoot(width, height)}
${createDefs(`
  ${createGradient('detailGrad', config.palette.foliage, 'vertical')}
  ${createFilter('shadow', 'shadow')}
`)}
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#2a3f3f"/>
  
  <!-- Детали в зависимости от локации -->
  ${generateLocationDetails(width, height, location, config)}
  
  <!-- Информация -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="20" font-weight="bold" fill="white">Детали фона</text>
  <text x="${width/2}" y="75" text-anchor="middle" font-size="12" fill="#888">${location} • ${style}</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Детали</text>
</svg>`;
}

// ===== АГЕНТ 7: ПРЕДМЕТЫ =====
// Создаёт предметы в сцене

export function generateObjectsFrame(settings: SceneSettings): string {
  const { width, height, location, style } = settings;
  const config = STYLE_CONFIGS[style];
  
  // Получаем предметы для локации
  const objects = getObjectsForLocation(location, 8);
  
  return `${createSVGRoot(width, height)}
${createDefs(`
  ${createFilter('shadow', 'shadow')}
`)}
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1e2d2d"/>
  <rect y="${height * 0.7}" width="100%" height="${height * 0.3}" fill="#2a3f3f"/>
  
  <!-- Предметы -->
  ${objects.map((obj, i) => generateObject(obj, i, width, height, config)).join('\n')}
  
  <!-- Информация -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="20" font-weight="bold" fill="white">Предметы</text>
  <text x="${width/2}" y="75" text-anchor="middle" font-size="12" fill="#888">${location} • ${objects.length} предметов</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Предметы</text>
</svg>`;
}

// ===== АГЕНТ 8: ПЕРСОНАЖИ =====
// Создаёт персонажей в сцене

export function generateCharactersFrame(settings: SceneSettings): string {
  const { width, height, style, mood } = settings;
  const config = STYLE_CONFIGS[style];
  
  // Создаём 2-3 персонажа
  const characters = generateCharactersForScene(mood, 3);
  
  return `${createSVGRoot(width, height)}
${createDefs(`
  ${createFilter('shadow', 'shadow')}
`)}
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  <rect y="${height * 0.75}" width="100%" height="${height * 0.25}" fill="#2a2a3e"/>
  
  <!-- Персонажи -->
  ${characters.map((char, i) => generateCharacter(char, i, width, height, config)).join('\n')}
  
  <!-- Информация -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="20" font-weight="bold" fill="white">Персонажи</text>
  <text x="${width/2}" y="75" text-anchor="middle" font-size="12" fill="#888">${characters.length} персонажей • ${mood}</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Персонажи</text>
</svg>`;
}

// ===== АГЕНТ 9: РАССТАНОВКА =====
// Создаёт схему расстановки всех элементов

export function generateLayoutFrame(settings: SceneSettings): string {
  const { width, height, location } = settings;
  
  return `${createSVGRoot(width, height)}
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Сетка позиций -->
  <g opacity="0.3">
    ${Array.from({length: 6}, (_, i) => 
      `<line x1="${width * (i + 1) / 7}" y1="${height * 0.2}" x2="${width * (i + 1) / 7}" y2="${height * 0.9}" stroke="rgba(100,150,255,0.3)" stroke-width="1"/>`
    ).join('\n')}
    ${Array.from({length: 4}, (_, i) => 
      `<line x1="${width * 0.1}" y1="${height * (0.2 + i * 0.2)}" x2="${width * 0.9}" y2="${height * (0.2 + i * 0.2)}" stroke="rgba(100,150,255,0.3)" stroke-width="1"/>`
    ).join('\n')}
  </g>
  
  <!-- Зоны -->
  <g>
    <rect x="${width * 0.1}" y="${height * 0.2}" width="${width * 0.25}" height="${height * 0.35}" rx="8" fill="rgba(100,200,100,0.2)" stroke="rgba(100,200,100,0.5)"/>
    <text x="${width * 0.225}" y="${height * 0.4}" text-anchor="middle" font-size="12" fill="rgba(100,200,100,0.8)">Зона А</text>
    <text x="${width * 0.225}" y="${height * 0.45}" text-anchor="middle" font-size="10" fill="rgba(100,200,100,0.6)">Фон</text>
    
    <rect x="${width * 0.375}" y="${height * 0.35}" width="${width * 0.25}" height="${height * 0.4}" rx="8" fill="rgba(200,200,100,0.2)" stroke="rgba(200,200,100,0.5)"/>
    <text x="${width * 0.5}" y="${height * 0.55}" text-anchor="middle" font-size="12" fill="rgba(200,200,100,0.8)">Зона Б</text>
    <text x="${width * 0.5}" y="${height * 0.6}" text-anchor="middle" font-size="10" fill="rgba(200,200,100,0.6)">Персонажи</text>
    
    <rect x="${width * 0.65}" y="${height * 0.45}" width="${width * 0.25}" height="${height * 0.35}" rx="8" fill="rgba(200,100,100,0.2)" stroke="rgba(200,100,100,0.5)"/>
    <text x="${width * 0.775}" y="${height * 0.65}" text-anchor="middle" font-size="12" fill="rgba(200,100,100,0.8)">Зона В</text>
    <text x="${width * 0.775}" y="${height * 0.7}" text-anchor="middle" font-size="10" fill="rgba(200,100,100,0.6)">Предметы</text>
  </g>
  
  <!-- Стрелки направления -->
  <g stroke="rgba(255,255,255,0.4)" stroke-width="2" fill="none">
    <path d="M ${width * 0.35} ${height * 0.5} L ${width * 0.45} ${height * 0.5}" marker-end="url(#arrow)"/>
    <path d="M ${width * 0.55} ${height * 0.55} L ${width * 0.65} ${height * 0.6}" marker-end="url(#arrow)"/>
  </g>
  
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="rgba(255,255,255,0.4)"/>
    </marker>
  </defs>
  
  <!-- Информация -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="20" font-weight="bold" fill="white">Расстановка</text>
  <text x="${width/2}" y="75" text-anchor="middle" font-size="12" fill="#888">${location} • Правило третей</text>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Расстановка</text>
</svg>`;
}

// ===== АГЕНТ 10: АНИМАЦИЯ =====
// Создаёт схему анимации с CSS

export function generateAnimationFrame(settings: SceneSettings): string {
  const { width, height, mood } = settings;
  const animations = getAnimationsForMood(mood);
  
  return `${createSVGRoot(width, height)}
  <style>
    ${animations.css}
  </style>
  
  <!-- Фон -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Анимированные элементы -->
  ${animations.elements}
  
  <!-- Информация -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="20" font-weight="bold" fill="white">Анимация</text>
  <text x="${width/2}" y="75" text-anchor="middle" font-size="12" fill="#888">${mood} • ${animations.types.join(', ')}</text>
  
  <!-- Таймлайн -->
  <g transform="translate(50, ${height - 80})">
    <rect width="${width - 100}" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>
    <rect width="${(width - 100) * 0.3}" height="4" rx="2" fill="#ff6b6b" class="timeline-progress"/>
    ${animations.keyframes.map((kf: {time: number, label: string}, i: number) => `
      <circle cx="${(width - 100) * kf.time}" cy="2" r="6" fill="${i === 0 ? '#ff6b6b' : 'rgba(255,255,255,0.5)"}"/>
      <text x="${(width - 100) * kf.time}" y="25" text-anchor="middle" font-size="10" fill="#888">${kf.label}</text>
    `).join('\n')}
  </g>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Анимация</text>
</svg>`;
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function generateColorPalette(settings: SceneSettings): any {
  const config = STYLE_CONFIGS[settings.style];
  return {
    primary: config.palette.sky,
    secondary: config.palette.foliage,
    accent: config.palette.earth[0],
    mood: getMoodColors(settings.mood)
  };
}

function getMoodColors(mood: string): string[] {
  const moodColors: Record<string, string[]> = {
    'спокойный': ['#87CEEB', '#98FB98', '#E0FFFF'],
    'радостный': ['#FFD700', '#FFA500', '#FF6347'],
    'таинственный': ['#4B0082', '#2E0854', '#9370DB'],
    'волшебный': ['#9370DB', '#DDA0DD', '#E6E6FA'],
    'грустный': ['#4682B4', '#5F9EA0', '#708090'],
    'напряжённый': ['#8B0000', '#4A0000', '#2F4F4F']
  };
  return moodColors[mood] || moodColors['спокойный'];
}

function getSkyColors(timeOfDay: string, style: string): string[] {
  const timeColors: Record<string, string[]> = {
    'утро': ['#FFE4B5', '#FFDEAD', '#87CEEB'],
    'день': ['#87CEEB', '#ADD8E6', '#B0E0E6'],
    'вечер': ['#FF8C00', '#FF7F50', '#FF6347'],
    'ночь': ['#191970', '#000080', '#0A0A1A'],
    'рассвет': ['#FFB6C1', '#FFA07A', '#FFD700'],
    'закат': ['#FF4500', '#DC143C', '#8B0000']
  };
  return timeColors[timeOfDay] || timeColors['день'];
}

function generateCelestialBodies(width: number, height: number, timeOfDay: string): string {
  if (timeOfDay === 'ночь') {
    // Луна и звёзды
    return `
      <circle cx="${width * 0.8}" cy="${height * 0.15}" r="30" fill="#F5F5DC" filter="url(#glow)"/>
      ${Array.from({length: 30}, () => {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.5;
        const r = Math.random() * 2 + 1;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${Math.random() * 0.5 + 0.5}"/>`;
      }).join('')}`;
  } else if (timeOfDay !== 'вечер' && timeOfDay !== 'закат') {
    // Солнце
    return `<circle cx="${width * 0.75}" cy="${height * 0.15}" r="35" fill="#FFD700" filter="url(#glow)"/>`;
  }
  return '';
}

function generateCloudLayer(width: number, height: number, timeOfDay: string, style: string): string {
  if (timeOfDay === 'ночь') return '';
  
  let clouds = '';
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.3;
    const scale = Math.random() * 0.5 + 0.5;
    clouds += `
      <g transform="translate(${x}, ${y}) scale(${scale})" opacity="0.8">
        <ellipse cx="0" cy="0" rx="50" ry="30" fill="white"/>
        <ellipse cx="40" cy="10" rx="35" ry="25" fill="white"/>
        <ellipse cx="-30" cy="10" rx="30" ry="20" fill="white"/>
      </g>`;
  }
  return clouds;
}

function generateLocationBackground(width: number, height: number, location: string, style: string, config: typeof STYLE_CONFIGS.ghibli): string {
  const groundY = height * 0.6;
  
  if (location.includes('лес')) {
    return `
      <rect y="${groundY}" width="100%" height="${height - groundY}" fill="url(#groundGrad)"/>
      ${Array.from({length: 10}, (_, i) => {
        const x = i * width / 9 + Math.random() * 50;
        const treeHeight = Math.random() * 100 + 150;
        return `
          <g transform="translate(${x}, ${groundY})">
            <rect x="-10" y="0" width="20" height="${treeHeight * 0.3}" fill="${config.palette.earth[0]}"/>
            <ellipse cx="0" cy="${-treeHeight * 0.2}" rx="${treeHeight * 0.25}" ry="${treeHeight * 0.4}" fill="${config.palette.foliage[0]}"/>
          </g>`;
      }).join('')}`;
  }
  
  if (location.includes('море')) {
    return `
      <rect y="${groundY}" width="100%" height="${height - groundY}" fill="url(#waterGrad)"/>
      ${Array.from({length: 8}, (_, i) => {
        const y = groundY + i * (height - groundY) / 8 + 20;
        return `<path d="M 0 ${y} Q ${width * 0.25} ${y - 10} ${width * 0.5} ${y} T ${width} ${y}" 
                     fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`;
      }).join('')}`;
  }
  
  // Стандартная земля
  return `
    <rect y="${groundY}" width="100%" height="${height - groundY}" fill="url(#groundGrad)"/>
    ${Array.from({length: 50}, () => {
      const x = Math.random() * width;
      const y = groundY + Math.random() * (height - groundY) * 0.3;
      return `<path d="M ${x} ${y} q 5 -15 0 -30" stroke="${config.palette.foliage[1]}" stroke-width="2" fill="none"/>`;
    }).join('')}`;
}

function generateAtmosphericEffects(width: number, height: number, mood: string, timeOfDay: string): string {
  let effects = '';
  
  if (mood === 'таинственный' || mood === 'волшебный') {
    effects += `<rect y="${height * 0.4}" width="100%" height="${height * 0.6}" fill="rgba(150,150,200,0.1)"/>`;
  }
  
  if (timeOfDay === 'вечер' || timeOfDay === 'закат') {
    effects += `<rect width="100%" height="100%" fill="rgba(255,100,50,0.1)"/>`;
  }
  
  return effects;
}

function getCompositionForMood(mood: string): any {
  const compositions: Record<string, any> = {
    'спокойный': {
      type: 'Центральная симметрия',
      interestPoints: [
        { x: 512, y: 180 },
        { x: 341, y: 288 },
        { x: 683, y: 288 }
      ],
      guidelines: [
        { x1: 0, y1: 180, x2: 1024, y2: 180 },
        { x1: 512, y1: 0, x2: 512, y2: 576 }
      ],
      focus: { x: 512, y: 288 }
    },
    'напряжённый': {
      type: 'Диагональная',
      interestPoints: [
        { x: 200, y: 100 },
        { x: 824, y: 476 }
      ],
      guidelines: [
        { x1: 0, y1: 576, x2: 1024, y2: 0 },
        { x1: 200, y1: 0, x2: 200, y2: 576 }
      ],
      focus: { x: 512, y: 288 }
    },
    default: {
      type: 'Правило третей',
      interestPoints: [
        { x: 341, y: 192 },
        { x: 683, y: 192 },
        { x: 341, y: 384 },
        { x: 683, y: 384 }
      ],
      guidelines: [],
      focus: { x: 512, y: 288 }
    }
  };
  return compositions[mood] || compositions.default;
}

function getLightingConfig(timeOfDay: string, mood: string): any {
  const configs: Record<string, any> = {
    'утро': {
      colors: ['#FFE4B5', '#FFA500', 'transparent'],
      ambient: ['#FFF8DC', '#FFE4B5'],
      sourceX: 750,
      sourceY: 80,
      intensity: 0.7,
      shadowIntensity: 0.2,
      type: 'Мягкое утреннее',
      temperature: 'Тёплый'
    },
    'день': {
      colors: ['#FFFFFF', '#87CEEB', 'transparent'],
      ambient: ['#FFFFFF', '#87CEEB'],
      sourceX: 768,
      sourceY: 60,
      intensity: 1.0,
      shadowIntensity: 0.3,
      type: 'Яркий дневной',
      temperature: 'Нейтральный'
    },
    'вечер': {
      colors: ['#FF8C00', '#FF4500', 'transparent'],
      ambient: ['#FF8C00', '#FF6347'],
      sourceX: 200,
      sourceY: 200,
      intensity: 0.5,
      shadowIntensity: 0.4,
      type: 'Тёплый вечерний',
      temperature: 'Тёплый'
    },
    'ночь': {
      colors: ['#F5F5DC', '#E6E6FA', 'transparent'],
      ambient: ['#191970', '#0A0A1A'],
      sourceX: 820,
      sourceY: 80,
      intensity: 0.3,
      shadowIntensity: 0.6,
      type: 'Лунный',
      temperature: 'Холодный'
    }
  };
  return configs[timeOfDay] || configs['день'];
}

function generateLocationDetails(width: number, height: number, location: string, config: typeof STYLE_CONFIGS.ghibli): string {
  let details = '';
  
  if (location.includes('лес')) {
    // Листья, ветки, трава
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      details += `<ellipse cx="${x}" cy="${y}" rx="${Math.random() * 15 + 5}" ry="${Math.random() * 8 + 3}" 
                           fill="${config.palette.foliage[Math.floor(Math.random() * 3)]}" opacity="0.7"/>`;
    }
  } else if (location.includes('море')) {
    // Волны, пена
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const y = height * 0.6 + Math.random() * height * 0.3;
      details += `<path d="M ${x} ${y} q 20 -10 40 0 q 20 10 40 0" 
                       fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>`;
    }
  } else {
    // Общие детали - камни, растения
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = height * 0.7 + Math.random() * height * 0.25;
      const size = Math.random() * 20 + 10;
      details += `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size * 0.6}" 
                           fill="${config.palette.earth[Math.floor(Math.random() * 3)]}" opacity="0.8"/>`;
    }
  }
  
  return details;
}

function getObjectsForLocation(location: string, count: number): any[] {
  const objectSets: Record<string, any[]> = {
    'лес': [
      { type: 'tree', size: 'large' },
      { type: 'rock', size: 'medium' },
      { type: 'bush', size: 'small' },
      { type: 'mushroom', size: 'small' },
      { type: 'log', size: 'medium' },
      { type: 'flower', size: 'small' },
      { type: 'fern', size: 'medium' },
      { type: 'stump', size: 'small' }
    ],
    'море': [
      { type: 'boat', size: 'large' },
      { type: 'shell', size: 'small' },
      { type: 'starfish', size: 'small' },
      { type: 'seaweed', size: 'medium' },
      { type: 'rock', size: 'medium' },
      { type: 'buoy', size: 'small' },
      { type: 'anchor', size: 'medium' },
      { type: 'coral', size: 'medium' }
    ],
    'город': [
      { type: 'lamp', size: 'medium' },
      { type: 'bench', size: 'medium' },
      { type: 'tree', size: 'medium' },
      { type: 'sign', size: 'small' },
      { type: 'trash', size: 'small' },
      { type: 'fountain', size: 'large' },
      { type: 'bicycle', size: 'medium' },
      { type: 'bird', size: 'small' }
    ]
  };
  
  const objects = objectSets[location] || objectSets['лес'];
  return objects.slice(0, count);
}

function generateObject(obj: any, index: number, width: number, height: number, config: typeof STYLE_CONFIGS.ghibli): string {
  const x = 100 + (index % 4) * (width - 200) / 3;
  const y = height * 0.4 + Math.floor(index / 4) * 150;
  const scale = obj.size === 'large' ? 1.5 : obj.size === 'small' ? 0.7 : 1;
  
  let svg = `<g transform="translate(${x}, ${y}) scale(${scale})" filter="url(#shadow)">`;
  
  switch (obj.type) {
    case 'tree':
      svg += `
        <rect x="-15" y="0" width="30" height="80" fill="${config.palette.earth[0]}"/>
        <ellipse cx="0" cy="-30" rx="60" ry="80" fill="${config.palette.foliage[0]}"/>
      `;
      break;
    case 'rock':
      svg += `<ellipse cx="0" cy="0" rx="40" ry="25" fill="${config.palette.earth[1]}"/>`;
      break;
    case 'bush':
      svg += `<ellipse cx="0" cy="0" rx="35" ry="25" fill="${config.palette.foliage[1]}"/>`;
      break;
    case 'flower':
      svg += `
        <line x1="0" y1="0" x2="0" y2="30" stroke="#228B22" stroke-width="3"/>
        <circle cx="0" cy="0" r="12" fill="#FF69B4"/>
        <circle cx="0" cy="0" r="5" fill="#FFD700"/>
      `;
      break;
    default:
      svg += `
        <rect x="-25" y="-25" width="50" height="50" rx="8" fill="${config.palette.earth[0]}"/>
        <text x="0" y="5" text-anchor="middle" font-size="10" fill="white">${obj.type}</text>
      `;
  }
  
  svg += `</g>`;
  return svg;
}

function generateCharactersForScene(mood: string, count: number): any[] {
  return Array.from({length: count}, (_, i) => ({
    id: i,
    type: i === 0 ? 'protagonist' : 'secondary',
    mood: mood,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1'][i % 3]
  }));
}

function generateCharacter(char: any, index: number, width: number, height: number, config: typeof STYLE_CONFIGS.ghibli): string {
  const x = width * (0.25 + index * 0.25);
  const y = height * 0.6;
  const scale = char.type === 'protagonist' ? 1.2 : 0.9;
  
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" filter="url(#shadow)">
      <!-- Тело -->
      <ellipse cx="0" cy="50" rx="30" ry="50" fill="${char.color}"/>
      <!-- Голова -->
      <circle cx="0" cy="-20" r="35" fill="#FFE4C4"/>
      <!-- Глаза -->
      <circle cx="-12" cy="-25" r="6" fill="#333"/>
      <circle cx="12" cy="-25" r="6" fill="#333"/>
      <!-- Улыбка -->
      <path d="M -15 -10 Q 0 5 15 -10" fill="none" stroke="#333" stroke-width="2"/>
      <!-- Волосы -->
      <ellipse cx="0" cy="-45" rx="30" ry="15" fill="#4A3728"/>
    </g>`;
}

function getAnimationsForMood(mood: string): any {
  const animations: Record<string, any> = {
    'спокойный': {
      types: ['float', 'fade'],
      css: `
        .float { animation: float 4s ease-in-out infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .pulse { animation: pulse 3s ease-in-out infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `,
      elements: `
        <circle cx="200" cy="200" r="50" fill="#87CEEB" class="float" opacity="0.6"/>
        <circle cx="500" cy="300" r="80" fill="#98FB98" class="float" style="animation-delay: 1s" opacity="0.5"/>
        <circle cx="800" cy="250" r="40" fill="#E0FFFF" class="float" style="animation-delay: 2s" opacity="0.7"/>
      `,
      keyframes: [
        { time: 0, label: 'Старт' },
        { time: 0.5, label: 'Пик' },
        { time: 1, label: 'Конец' }
      ]
    },
    'радостный': {
      types: ['bounce', 'spin'],
      css: `
        .bounce { animation: bounce 0.5s ease-in-out infinite; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
      `,
      elements: `
        <circle cx="200" cy="250" r="40" fill="#FFD700" class="bounce"/>
        <circle cx="400" cy="280" r="50" fill="#FFA500" class="bounce" style="animation-delay: 0.1s"/>
        <circle cx="600" cy="260" r="45" fill="#FF6347" class="bounce" style="animation-delay: 0.2s"/>
        <circle cx="800" cy="270" r="35" fill="#FFD700" class="bounce" style="animation-delay: 0.3s"/>
      `,
      keyframes: [
        { time: 0, label: 'Прыжок' },
        { time: 0.25, label: 'Пик' },
        { time: 0.5, label: 'Приземление' }
      ]
    },
    default: {
      types: ['fade', 'scale'],
      css: `
        .fade { animation: fade 2s ease-in-out infinite; }
        @keyframes fade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `,
      elements: `
        <circle cx="300" cy="250" r="60" fill="#9370DB" class="fade"/>
        <circle cx="600" cy="280" r="70" fill="#DDA0DD" class="fade" style="animation-delay: 1s"/>
        <circle cx="800" cy="230" r="50" fill="#E6E6FA" class="fade" style="animation-delay: 0.5s"/>
      `,
      keyframes: [
        { time: 0, label: 'Старт' },
        { time: 0.5, label: 'Пик' },
        { time: 1, label: 'Конец' }
      ]
    }
  };
  
  return animations[mood] || animations.default;
}

export {
  generateColorPalette,
  getSkyColors,
  getMoodColors,
  getCompositionForMood,
  getLightingConfig,
  getObjectsForLocation,
  generateCharactersForScene,
  getAnimationsForMood
};
