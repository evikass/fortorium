import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Тени и свет (Lighting Artist)
 * Отвечает за источники света, тени, блики, освещение, атмосферные эффекты света
 */

// Типы освещения
const LIGHTING_TYPES: Record<string, any> = {
  'natural': {
    name: 'Естественное',
    description: 'Солнечный свет, луна',
    characteristics: ['мягкое', 'направленное', 'изменяющееся']
  },
  'artificial': {
    name: 'Искусственное',
    description: 'Лампы, факелы, экраны',
    characteristics: ['точечное', 'тёплое/холодное', 'стабильное']
  },
  'mixed': {
    name: 'Смешанное',
    description: 'Комбинация источников',
    characteristics: ['сложное', 'контрастное', 'динамичное']
  },
  'magical': {
    name: 'Магическое',
    description: 'Волшебное свечение',
    characteristics: ['эфирное', 'цветное', 'пульсирующее']
  }
};

// Направления света
const LIGHT_DIRECTIONS: Record<string, any> = {
  'front': { name: 'Фронтальное', angle: 0, shadows: 'minimal', drama: 'low' },
  'side': { name: 'Боковое', angle: 90, shadows: 'long', drama: 'high' },
  'back': { name: 'Контровое', angle: 180, shadows: 'silhouette', drama: 'very-high' },
  'top': { name: 'Верхнее', angle: -90, shadows: 'short', drama: 'medium' },
  'bottom': { name: 'Нижнее', angle: 90, shadows: 'inverted', drama: 'eerie' },
  'rim': { name: 'Римское', angle: 150, shadows: 'edge', drama: 'high' }
};

// Временные схемы освещения
const TIME_LIGHTING: Record<string, any> = {
  'утро': {
    color: '#FFE4B5',
    intensity: 0.7,
    direction: 'side-left',
    temperature: 'warm',
    shadowLength: 1.5,
    ambientColor: '#FFF8DC'
  },
  'день': {
    color: '#FFFFF0',
    intensity: 1.0,
    direction: 'top',
    temperature: 'neutral',
    shadowLength: 0.5,
    ambientColor: '#F5F5F5'
  },
  'вечер': {
    color: '#FF8C00',
    intensity: 0.8,
    direction: 'side-right',
    temperature: 'warm',
    shadowLength: 2.0,
    ambientColor: '#FFE4B5'
  },
  'ночь': {
    color: '#C0C0C0',
    intensity: 0.3,
    direction: 'top',
    temperature: 'cool',
    shadowLength: 1.0,
    ambientColor: '#1A1A2E'
  },
  'рассвет': {
    color: '#FFB6C1',
    intensity: 0.6,
    direction: 'side-left',
    temperature: 'warm-pink',
    shadowLength: 2.5,
    ambientColor: '#FFE4E1'
  },
  'закат': {
    color: '#FF4500',
    intensity: 0.7,
    direction: 'side-right',
    temperature: 'very-warm',
    shadowLength: 3.0,
    ambientColor: '#FFDAB9'
  }
};

// Типы теней
const SHADOW_TYPES: Record<string, any> = {
  'hard': { name: 'Жёсткие', blur: 0, opacity: 0.8 },
  'soft': { name: 'Мягкие', blur: 10, opacity: 0.5 },
  'diffused': { name: 'Рассеянные', blur: 20, opacity: 0.3 },
  'colored': { name: 'Цветные', blur: 5, opacity: 0.4 }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type = 'natural',
      direction = 'top',
      timeOfDay = 'день',
      shadowType = 'soft',
      dimensions = { width: 1024, height: 576 },
      objects = []
    } = body;
    
    const { width, height } = dimensions;
    
    // Получаем настройки освещения
    const lightingType = LIGHTING_TYPES[type] || LIGHTING_TYPES['natural'];
    const lightDirection = LIGHT_DIRECTIONS[direction] || LIGHT_DIRECTIONS['top'];
    const timeLighting = TIME_LIGHTING[timeOfDay] || TIME_LIGHTING['день'];
    const shadowSettings = SHADOW_TYPES[shadowType] || SHADOW_TYPES['soft'];
    
    // Генерируем SVG освещения
    const lightingSVG = generateLightingSVG(
      lightingType,
      lightDirection,
      timeLighting,
      shadowSettings,
      dimensions,
      objects
    );
    
    // Создаём слои освещения
    const lightingLayers = generateLightingLayers(timeLighting, dimensions);
    
    // Генерируем фильтры для теней
    const shadowFilters = generateShadowFilters(shadowSettings);

    return NextResponse.json({
      success: true,
      agent: 'svg-lighting',
      specialization: 'Тени и свет',
      
      svg: lightingSVG,
      
      lighting: {
        type: lightingType,
        direction: lightDirection,
        timeOfDay: timeLighting
      },
      
      shadows: {
        type: shadowSettings,
        filters: shadowFilters
      },
      
      layers: lightingLayers,
      
      recommendations: {
        mainLight: `Основной свет: ${timeLighting.color} под углом ${lightDirection.angle}°`,
        fillLight: `Заполняющий свет: ${timeLighting.ambientColor} для смягчения теней`,
        shadowTip: `Тени: ${shadowSettings.name}, длина ${timeLighting.shadowLength}x`
      },
      
      message: `Освещение создано (${type}, ${direction}, ${timeOfDay})`
    });

  } catch (error) {
    console.error('[SVG-Lighting] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

function generateLightingSVG(
  lightingType: any,
  lightDirection: any,
  timeLighting: any,
  shadowSettings: any,
  dimensions: any,
  objects: any[]
): string {
  const { width, height } = dimensions;
  
  // Рассчитываем позицию источника света
  const lightPosition = calculateLightPosition(lightDirection, dimensions);
  
  // Генерируем градиенты и фильтры
  const defs = `
  <defs>
    <!-- Основной градиент света -->
    <radialGradient id="mainLight" cx="${lightPosition.x/width*100}%" cy="${lightPosition.y/height*100}%" r="70%">
      <stop offset="0%" stop-color="${timeLighting.color}" stop-opacity="${timeLighting.intensity}"/>
      <stop offset="50%" stop-color="${timeLighting.color}" stop-opacity="${timeLighting.intensity * 0.5}"/>
      <stop offset="100%" stop-color="${timeLighting.color}" stop-opacity="0"/>
    </radialGradient>
    
    <!-- Градиент тени -->
    <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="${lightDirection.angle > 90 ? '100%' : '0%'}" y2="100%">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" stop-opacity="0"/>
      <stop offset="100%" stop-color="rgba(0,0,0,${shadowSettings.opacity})" stop-opacity="${shadowSettings.opacity}"/>
    </linearGradient>
    
    <!-- Фильтр тени -->
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowSettings.blur}"/>
      <feOffset dx="${lightDirection.angle < 90 ? 5 : -5}" dy="${lightDirection.angle === -90 ? -10 : 10}"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="${shadowSettings.opacity}"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Фильтр свечения -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Цветная тень -->
    <filter id="coloredShadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowSettings.blur}"/>
      <feOffset dx="5" dy="5"/>
      <feFlood flood-color="${timeLighting.ambientColor}" flood-opacity="0.3"/>
      <feComposite in2="offsetblur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>`;
  
  // Генерируем слои освещения
  const lightingLayers = `
  <!-- Глобальное освещение -->
  <rect width="100%" height="100%" fill="url(#mainLight)" opacity="0.6"/>
  
  <!-- Цветовая температура -->
  <rect width="100%" height="100%" fill="${timeLighting.ambientColor}" opacity="0.1"/>
  
  <!-- Источник света (визуальный индикатор) -->
  <circle cx="${lightPosition.x}" cy="${lightPosition.y}" r="20" fill="${timeLighting.color}" opacity="0.8" filter="url(#glow)"/>
  <circle cx="${lightPosition.x}" cy="${lightPosition.y}" r="5" fill="white"/>
  
  <!-- Направление света (линия) -->
  <line x1="${lightPosition.x}" y1="${lightPosition.y}" x2="${width/2}" y2="${height/2}" stroke="${timeLighting.color}" stroke-width="2" stroke-dasharray="10,5" opacity="0.5"/>
  `;
  
  // Генерируем тени для объектов
  const objectShadows = objects.map((obj, i) => {
    const shadowOffsetX = lightDirection.angle < 90 ? obj.width * timeLighting.shadowLength : -obj.width * timeLighting.shadowLength;
    const shadowOffsetY = obj.height * timeLighting.shadowLength * 0.5;
    
    return `
    <ellipse cx="${obj.x + shadowOffsetX}" cy="${obj.y + shadowOffsetY}" rx="${obj.width * 0.8}" ry="${obj.width * 0.3}" fill="rgba(0,0,0,${shadowSettings.opacity * 0.5})" filter="url(#shadow)"/>
    `;
  }).join('');
  
  // Атмосферные эффекты
  const atmosphericEffects = generateAtmosphericEffects(timeLighting, dimensions);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="lighting-layer" data-agent="lighting">
  ${defs}
  
  <!-- Освещение -->
  <g class="lighting-effects">
    ${lightingLayers}
  </g>
  
  <!-- Тени объектов -->
  <g class="object-shadows">
    ${objectShadows}
  </g>
  
  <!-- Атмосфера -->
  <g class="atmosphere">
    ${atmosphericEffects}
  </g>
</svg>`;
}

function calculateLightPosition(direction: any, dimensions: any): { x: number; y: number } {
  const { width, height } = dimensions;
  
  switch (direction.angle) {
    case 0: return { x: width / 2, y: -50 }; // front
    case 90: return { x: -50, y: height / 2 }; // side
    case 180: return { x: width / 2, y: -50 }; // back
    case -90: return { x: width / 2, y: -50 }; // top
    case 90: return { x: width / 2, y: height + 50 }; // bottom
    case 150: return { x: width + 50, y: height * 0.3 }; // rim
    default: return { x: width / 2, y: height * 0.2 };
  }
}

function generateLightingLayers(timeLighting: any, dimensions: any): any[] {
  const { width, height } = dimensions;
  
  return [
    {
      id: 'ambient-layer',
      name: 'Амбиент',
      type: 'color-overlay',
      color: timeLighting.ambientColor,
      opacity: 0.1,
      blendMode: 'overlay'
    },
    {
      id: 'main-light-layer',
      name: 'Основной свет',
      type: 'gradient',
      color: timeLighting.color,
      opacity: timeLighting.intensity * 0.6,
      blendMode: 'screen'
    },
    {
      id: 'shadow-layer',
      name: 'Тени',
      type: 'shadows',
      opacity: 0.5,
      blendMode: 'multiply'
    },
    {
      id: 'highlight-layer',
      name: 'Блики',
      type: 'highlights',
      color: '#FFFFFF',
      opacity: 0.3,
      blendMode: 'screen'
    }
  ];
}

function generateShadowFilters(shadowSettings: any): any {
  return {
    dropShadow: `drop-shadow(5px 5px ${shadowSettings.blur}px rgba(0,0,0,${shadowSettings.opacity}))`,
    innerShadow: `inset 0 0 ${shadowSettings.blur}px rgba(0,0,0,${shadowSettings.opacity})`,
    css: `filter: drop-shadow(5px 5px ${shadowSettings.blur}px rgba(0,0,0,${shadowSettings.opacity}));`
  };
}

function generateAtmosphericEffects(timeLighting: any, dimensions: any): string {
  const { width, height } = dimensions;
  const temperature = timeLighting.temperature;
  
  let effects = '';
  
  // Тёплые/холодные оттенки
  if (temperature === 'warm' || temperature === 'very-warm') {
    effects += `<rect width="100%" height="100%" fill="rgba(255,200,150,0.05)"/>`;
  } else if (temperature === 'cool') {
    effects += `<rect width="100%" height="100%" fill="rgba(150,200,255,0.05)"/>`;
  }
  
  // Виньетирование
  effects += `
  <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
    <stop offset="50%" stop-color="transparent"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.3)"/>
  </radialGradient>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
  `;
  
  return effects;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-lighting',
    name: 'Тени и свет',
    specialization: 'Освещение и тени',
    capabilities: [
      'Источники света',
      'Направление света',
      'Тени (жёсткие, мягкие, цветные)',
      'Временные схемы освещения',
      'Атмосферные эффекты',
      'Блики и отражения'
    ],
    lightingTypes: Object.keys(LIGHTING_TYPES),
    directions: Object.keys(LIGHT_DIRECTIONS),
    timeOfDay: Object.keys(TIME_LIGHTING),
    shadowTypes: Object.keys(SHADOW_TYPES),
    status: 'ready'
  });
}
