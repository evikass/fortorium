import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Фон (Background Artist)
 * Отвечает за создание фона сцены - небо, землю, горы, облака, воду и т.д.
 */

interface BackgroundParams {
  scene: {
    location: string;
    timeOfDay: string;
    mood: string;
    style: string;
    weather?: string;
  };
  dimensions: { width: number; height: number };
}

// Шаблоны фонов по типам локаций
const BACKGROUND_TEMPLATES: Record<string, any> = {
  'лес': {
    skyGradient: ['#87CEEB', '#98D8C8', '#F7DC6F'],
    groundColor: '#228B22',
    elements: ['деревья', 'кустарники', 'трава', 'пни'],
    atmosphere: 'туманный'
  },
  'море': {
    skyGradient: ['#87CEEB', '#4A90D9', '#1E3A5F'],
    groundColor: '#006994',
    elements: ['волны', 'пена', 'горизонт', 'чайки'],
    atmosphere: 'свежий'
  },
  'город': {
    skyGradient: ['#4A5568', '#718096', '#A0AEC0'],
    groundColor: '#4A5568',
    elements: ['здания', 'дороги', 'фонари', 'машины'],
    atmosphere: 'городской'
  },
  'космос': {
    skyGradient: ['#0a0a1a', '#1a1a3a', '#000011'],
    groundColor: 'transparent',
    elements: ['звёзды', 'планеты', 'туманности', 'астероиды'],
    atmosphere: 'космический'
  },
  'замок': {
    skyGradient: ['#4A4A6A', '#6A6A8A', '#8A8AAA'],
    groundColor: '#3D3D3D',
    elements: ['башни', 'стены', 'мост', 'рва'],
    atmosphere: 'средневековый'
  },
  'пустыня': {
    skyGradient: ['#F4D03F', '#E67E22', '#D35400'],
    groundColor: '#D4AC0D',
    elements: ['дюны', 'кактусы', 'скалы', 'мираж'],
    atmosphere: 'знойный'
  },
  'горы': {
    skyGradient: ['#AED6F1', '#5DADE2', '#2E86C1'],
    groundColor: '#566573',
    elements: ['пики', 'скалы', 'снег', 'облака'],
    atmosphere: 'величественный'
  },
  'сад': {
    skyGradient: ['#FDEBD0', '#FAD7A0', '#F8C471'],
    groundColor: '#82E0AA',
    elements: ['цветы', 'деревья', 'беседки', 'фонтаны'],
    atmosphere: 'романтичный'
  }
};

// Временные модификации
const TIME_MODIFIERS: Record<string, any> = {
  'утро': { brightness: 1.1, warmth: 0.1, fog: 0.3 },
  'день': { brightness: 1.0, warmth: 0.0, fog: 0.0 },
  'вечер': { brightness: 0.9, warmth: 0.3, fog: 0.1 },
  'ночь': { brightness: 0.3, warmth: -0.2, fog: 0.2 },
  'рассвет': { brightness: 0.8, warmth: 0.4, fog: 0.4 },
  'закат': { brightness: 0.7, warmth: 0.5, fog: 0.1 }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scene, dimensions = { width: 1024, height: 576 } }: BackgroundParams = body;

    const { location, timeOfDay, mood, style, weather } = scene;

    // Определяем тип локации
    const locationType = determineLocationType(location);
    const template = BACKGROUND_TEMPLATES[locationType] || BACKGROUND_TEMPLATES['лес'];
    const timeModifier = TIME_MODIFIERS[timeOfDay] || TIME_MODIFIERS['день'];

    // Генерируем SVG фона
    const backgroundSVG = generateBackgroundSVG(template, timeModifier, dimensions, style, mood, weather);

    // Создаём слои фона
    const layers = generateBackgroundLayers(template, timeModifier, dimensions);

    return NextResponse.json({
      success: true,
      agent: 'svg-background',
      specialization: 'Фон',
      
      svg: backgroundSVG,
      
      layers: layers,
      
      specifications: {
        locationType,
        template: template.atmosphere,
        timeModifier,
        dimensions,
        colorScheme: template.skyGradient
      },
      
      metadata: {
        elements: template.elements,
        atmosphere: template.atmosphere,
        layerCount: layers.length
      },
      
      message: `Фон для "${location}" создан (${timeOfDay}, ${mood})`
    });

  } catch (error) {
    console.error('[SVG-Background] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

function determineLocationType(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes('лес') || loc.includes('дерев')) return 'лес';
  if (loc.includes('море') || loc.includes('океан') || loc.includes('вод')) return 'море';
  if (loc.includes('город') || loc.includes('улиц')) return 'город';
  if (loc.includes('косм') || loc.includes('звёзд')) return 'космос';
  if (loc.includes('замок') || loc.includes('дворец') || loc.includes('крепост')) return 'замок';
  if (loc.includes('пустын') || loc.includes('песок')) return 'пустыня';
  if (loc.includes('гор') || loc.includes('скал')) return 'горы';
  if (loc.includes('сад') || loc.includes('парк')) return 'сад';
  return 'лес';
}

function generateBackgroundSVG(
  template: any, 
  timeModifier: any, 
  dimensions: any, 
  style: string,
  mood: string,
  weather?: string
): string {
  const { width, height } = dimensions;
  const skyColors = template.skyGradient;
  
  // Модифицируем цвета под время суток
  const adjustedColors = skyColors.map((color: string) => adjustColor(color, timeModifier));
  
  // Определяем погодные эффекты
  const weatherEffects = generateWeatherEffects(weather, dimensions);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="background-layer" data-agent="background">
  <defs>
    <!-- Градиент неба -->
    <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${adjustedColors[0]}" stop-opacity="1"/>
      <stop offset="50%" stop-color="${adjustedColors[1]}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${adjustedColors[2]}" stop-opacity="1"/>
    </linearGradient>
    
    <!-- Градиент земли -->
    <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${adjustColor(template.groundColor, timeModifier)}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${adjustColor(template.groundColor, {...timeModifier, brightness: 0.7})}" stop-opacity="1"/>
    </linearGradient>
    
    <!-- Фильтр атмосферы -->
    <filter id="atmosphere" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${timeModifier.fog * 10}"/>
      <feColorMatrix type="matrix" values="1 0 0 0 ${timeModifier.warmth * 20} 0 1 0 0 ${timeModifier.warmth * 10} 0 0 1 0 0 0 0 0 1 0"/>
    </filter>
    
    <!-- Текстура -->
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  
  <!-- Слой неба -->
  <rect id="sky" x="0" y="0" width="${width}" height="${height * 0.6}" fill="url(#skyGradient)"/>
  
  <!-- Атмосферные эффекты -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(255,255,255,${timeModifier.fog * 0.3})" filter="url(#atmosphere)"/>
  
  <!-- Слой земли -->
  <rect id="ground" x="0" y="${height * 0.6}" width="${width}" height="${height * 0.4}" fill="url(#groundGradient)"/>
  
  <!-- Горизонт -->
  <line x1="0" y1="${height * 0.6}" x2="${width}" y2="${height * 0.6}" stroke="rgba(0,0,0,0.1)" stroke-width="2"/>
  
  ${weatherEffects}
  
  <!-- Стилевые модификаторы -->
  ${generateStyleOverlay(style, dimensions)}
  
  <!-- Настроение -->
  ${generateMoodOverlay(mood, dimensions)}
</svg>`;
}

function generateBackgroundLayers(template: any, timeModifier: any, dimensions: any): any[] {
  const { width, height } = dimensions;
  
  return [
    {
      id: 'sky-layer',
      name: 'Небо',
      z: 1,
      svg: `<rect x="0" y="0" width="100%" height="60%" fill="url(#skyGradient)"/>`,
      opacity: 1
    },
    {
      id: 'atmosphere-layer',
      name: 'Атмосфера',
      z: 2,
      svg: `<rect x="0" y="0" width="100%" height="100%" fill="rgba(255,255,255,${timeModifier.fog * 0.3})" filter="url(#atmosphere)"/>`,
      opacity: timeModifier.fog
    },
    {
      id: 'ground-layer',
      name: 'Земля',
      z: 10,
      svg: `<rect x="0" y="60%" width="100%" height="40%" fill="url(#groundGradient)"/>`,
      opacity: 1
    },
    {
      id: 'horizon-layer',
      name: 'Горизонт',
      z: 11,
      svg: `<line x1="0" y1="60%" x2="100%" y2="60%" stroke="rgba(0,0,0,0.1)" stroke-width="2"/>`,
      opacity: 0.5
    }
  ];
}

function generateWeatherEffects(weather: string | undefined, dimensions: any): string {
  if (!weather) return '';
  
  const { width, height } = dimensions;
  
  switch (weather.toLowerCase()) {
    case 'дождь':
      return `<g class="rain" opacity="0.6">
        ${Array.from({ length: 50 }, (_, i) => 
          `<line x1="${Math.random() * width}" y1="${Math.random() * height}" x2="${Math.random() * width - 10}" y2="${Math.random() * height + 20}" stroke="rgba(150,200,255,0.5)" stroke-width="1"/>`
        ).join('')}
      </g>`;
    
    case 'снег':
      return `<g class="snow" opacity="0.8">
        ${Array.from({ length: 40 }, (_, i) => 
          `<circle cx="${Math.random() * width}" cy="${Math.random() * height}" r="${Math.random() * 3 + 1}" fill="white" opacity="${Math.random() * 0.5 + 0.3}"/>`
        ).join('')}
      </g>`;
    
    case 'туман':
      return `<g class="fog" opacity="0.7">
        ${Array.from({ length: 5 }, (_, i) => 
          `<ellipse cx="${width/2}" cy="${height * 0.5 + i * 50}" rx="${width * 0.8}" ry="${50 + i * 20}" fill="rgba(255,255,255,${0.2 - i * 0.03})"/>`
        ).join('')}
      </g>`;
    
    case 'облачно':
      return `<g class="clouds" opacity="0.9">
        ${Array.from({ length: 5 }, (_, i) => 
          `<ellipse cx="${100 + i * 200}" cy="${50 + i * 20}" rx="${80 + i * 20}" ry="${30 + i * 5}" fill="rgba(255,255,255,0.8)"/>`
        ).join('')}
      </g>`;
    
    default:
      return '';
  }
}

function generateStyleOverlay(style: string, dimensions: any): string {
  const { width, height } = dimensions;
  
  switch (style) {
    case 'ghibli':
      return `<rect x="0" y="0" width="${width}" height="${height}" fill="rgba(255,240,220,0.1)"/>`;
    case 'anime':
      return `<rect x="0" y="0" width="${width}" height="${height}" fill="rgba(220,240,255,0.05)"/>`;
    case 'pixar':
      return ``;
    case 'disney':
      return `<rect x="0" y="0" width="${width}" height="${height}" fill="rgba(255,200,150,0.08)"/>`;
    default:
      return '';
  }
}

function generateMoodOverlay(mood: string, dimensions: any): string {
  const { width, height } = dimensions;
  
  const moodColors: Record<string, string> = {
    'напряжённый': 'rgba(100,0,50,0.15)',
    'радостный': 'rgba(255,255,200,0.1)',
    'грустный': 'rgba(50,50,100,0.15)',
    'таинственный': 'rgba(30,0,50,0.2)',
    'волшебный': 'rgba(200,150,255,0.1)',
    'эпичный': 'rgba(255,150,50,0.1)',
    'спокойный': 'rgba(200,255,200,0.05)'
  };
  
  const overlayColor = moodColors[mood.toLowerCase()] || 'rgba(0,0,0,0)';
  
  return `<rect x="0" y="0" width="${width}" height="${height}" fill="${overlayColor}" class="mood-overlay"/>`;
}

function adjustColor(hexColor: string, modifier: { brightness: number; warmth: number; fog?: number }): string {
  // Простая корректировка цвета
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const adjustR = Math.min(255, Math.max(0, Math.round(r * modifier.brightness + modifier.warmth * 50)));
  const adjustG = Math.min(255, Math.max(0, Math.round(g * modifier.brightness)));
  const adjustB = Math.min(255, Math.max(0, Math.round(b * modifier.brightness - modifier.warmth * 30)));
  
  return `#${adjustR.toString(16).padStart(2, '0')}${adjustG.toString(16).padStart(2, '0')}${adjustB.toString(16).padStart(2, '0')}`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-background',
    name: 'Фон',
    specialization: 'Создание фона сцены',
    capabilities: [
      'Генерация неба и атмосферы',
      'Создание земли и рельефа',
      'Погодные эффекты',
      'Временные модификации (утро/день/вечер/ночь)',
      'Стилевые наложения',
      'Настроение сцены'
    ],
    templates: Object.keys(BACKGROUND_TEMPLATES),
    timeModifiers: Object.keys(TIME_MODIFIERS),
    status: 'ready'
  });
}
