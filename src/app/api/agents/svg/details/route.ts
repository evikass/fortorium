import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Детали на фоне (Background Details Artist)
 * Отвечает за мелкие детали - трава, листья, камни, облака, птицы и т.д.
 */

interface DetailParams {
  scene: {
    location: string;
    style: string;
    season?: string;
    density?: 'sparse' | 'normal' | 'dense';
  };
  background: any;
  dimensions: { width: number; height: number };
}

// Библиотека деталей по типам локаций
const DETAIL_LIBRARY: Record<string, any> = {
  'лес': {
    small: ['травинки', 'цветы', 'папоротники', 'мох', 'грибы'],
    medium: ['кусты', 'пни', 'камни', 'упавшие ветки', 'ягоды'],
    large: ['деревья', 'вьющиеся растения', 'коряги'],
    floating: ['опавшие листья', 'пыльца', 'бабочки', 'птицы']
  },
  'море': {
    small: ['ракушки', 'водоросли', 'песчинки', 'камешки'],
    medium: ['кораллы', 'морские звёзды', 'камни', 'драки'],
    large: ['рифы', 'скалы', 'корабли'],
    floating: ['пузырьки', 'чайки', 'медузы', 'рыбы']
  },
  'город': {
    small: ['трещины', 'мусор', 'граффити', 'рекламы'],
    medium: ['лавки', 'фонари', 'мусорки', 'знаки'],
    large: ['машины', 'деревья', 'памятники'],
    floating: ['птицы', 'самолёты', 'шары', 'флаги']
  },
  'космос': {
    small: ['звёзды', 'пыль', 'осколки'],
    medium: ['астероиды', 'кометы', 'спутники'],
    large: ['планеты', 'туманности', 'станции'],
    floating: ['корабли', 'метеоры', 'космическая пыль']
  },
  'замок': {
    small: ['факелы', 'знамёна', 'цепи', 'решётки'],
    medium: ['статуи', 'фонтаны', 'колодцы', 'пушки'],
    large: ['башни', 'мосты', 'ворота', 'стены'],
    floating: ['флаги', 'дым', 'птицы']
  },
  'горы': {
    small: ['камни', 'цветы', 'трава', 'снежинки'],
    medium: ['валуны', 'кустарники', 'водопады', 'пещеры'],
    large: ['скалы', 'ледники', 'облака'],
    floating: ['орлы', 'облака', 'снег', 'туман']
  }
};

// Сезонные модификаторы
const SEASON_MODIFIERS: Record<string, any> = {
  'весна': { colors: ['#90EE90', '#FFB6C1', '#87CEEB'], density: 1.2, activity: 'high' },
  'лето': { colors: ['#228B22', '#FFD700', '#FF6347'], density: 1.5, activity: 'high' },
  'осень': { colors: ['#D2691E', '#FF4500', '#8B4513'], density: 1.0, activity: 'medium' },
  'зима': { colors: ['#FFFFFF', '#E0E0E0', '#B0C4DE'], density: 0.5, activity: 'low' }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scene, background, dimensions = { width: 1024, height: 576 } }: DetailParams = body;

    const { location, style, season = 'лето', density = 'normal' } = scene;
    
    // Определяем тип локации
    const locationType = determineLocationType(location);
    const detailLib = DETAIL_LIBRARY[locationType] || DETAIL_LIBRARY['лес'];
    const seasonMod = SEASON_MODIFIERS[season] || SEASON_MODIFIERS['лето'];
    
    // Определяем плотность деталей
    const densityMultiplier = density === 'sparse' ? 0.5 : density === 'dense' ? 2.0 : 1.0;
    
    // Генерируем SVG деталей
    const detailsSVG = generateDetailsSVG(detailLib, seasonMod, dimensions, style, densityMultiplier);
    
    // Создаём отдельные элементы
    const detailElements = generateDetailElements(detailLib, seasonMod, dimensions, densityMultiplier);

    return NextResponse.json({
      success: true,
      agent: 'svg-details',
      specialization: 'Детали на фоне',
      
      svg: detailsSVG,
      
      elements: detailElements,
      
      specifications: {
        locationType,
        season,
        density,
        totalElements: detailElements.length,
        categories: Object.keys(detailLib)
      },
      
      colorPalette: seasonMod.colors,
      
      message: `Детали для "${location}" созданы (${season}, ${density})`
    });

  } catch (error) {
    console.error('[SVG-Details] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

function determineLocationType(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes('лес') || loc.includes('дерев')) return 'лес';
  if (loc.includes('море') || loc.includes('океан')) return 'море';
  if (loc.includes('город')) return 'город';
  if (loc.includes('косм')) return 'космос';
  if (loc.includes('замок')) return 'замок';
  if (loc.includes('гор')) return 'горы';
  return 'лес';
}

function generateDetailsSVG(
  detailLib: any, 
  seasonMod: any, 
  dimensions: any, 
  style: string,
  densityMultiplier: number
): string {
  const { width, height } = dimensions;
  
  // Генерируем детали разных размеров
  const smallDetails = generateSmallDetails(detailLib.small, seasonMod, dimensions, densityMultiplier);
  const mediumDetails = generateMediumDetails(detailLib.medium, seasonMod, dimensions, densityMultiplier);
  const largeDetails = generateLargeDetails(detailLib.large, seasonMod, dimensions, densityMultiplier);
  const floatingDetails = generateFloatingDetails(detailLib.floating, seasonMod, dimensions, densityMultiplier);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="details-layer" data-agent="details">
  <defs>
    <!-- Фильтр размытия для дальних деталей -->
    <filter id="detailBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1"/>
    </filter>
    
    <!-- Градиенты для элементов -->
    <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${seasonMod.colors[0]}"/>
      <stop offset="100%" stop-color="${adjustColor(seasonMod.colors[0], -20)}"/>
    </linearGradient>
    
    <radialGradient id="flowerGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${seasonMod.colors[1]}"/>
      <stop offset="100%" stop-color="${adjustColor(seasonMod.colors[1], -30)}"/>
    </radialGradient>
  </defs>
  
  <!-- Большие детали (дальний план) -->
  <g class="large-details" opacity="0.7" filter="url(#detailBlur)">
    ${largeDetails}
  </g>
  
  <!-- Средние детали (средний план) -->
  <g class="medium-details" opacity="0.85">
    ${mediumDetails}
  </g>
  
  <!-- Мелкие детали (передний план) -->
  <g class="small-details" opacity="1">
    ${smallDetails}
  </g>
  
  <!-- Плавающие детали -->
  <g class="floating-details" opacity="0.8">
    ${floatingDetails}
  </g>
  
  <!-- Стилевая обработка -->
  ${applyDetailStyle(style, dimensions)}
</svg>`;
}

function generateSmallDetails(items: string[], seasonMod: any, dimensions: any, density: number): string {
  const { width, height } = dimensions;
  const count = Math.floor(30 * density * seasonMod.density);
  let svg = '';
  
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = height * 0.6 + Math.random() * (height * 0.35);
    const size = 3 + Math.random() * 8;
    const color = seasonMod.colors[Math.floor(Math.random() * seasonMod.colors.length)];
    const itemType = items[Math.floor(Math.random() * items.length)];
    
    // Создаём разные формы для разных типов деталей
    switch (itemType) {
      case 'травинки':
      case 'папоротники':
        svg += `<path d="M${x},${y} Q${x-2},${y-size*2} ${x},${y-size*4}" stroke="${color}" stroke-width="1.5" fill="none"/>`;
        break;
      case 'цветы':
        svg += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/>`;
        svg += `<circle cx="${x}" cy="${y}" r="${size/2}" fill="${seasonMod.colors[1]}"/>`;
        break;
      case 'камешки':
      case 'ракушки':
        svg += `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size*0.6}" fill="${adjustColor(color, -30)}"/>`;
        break;
      default:
        svg += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" opacity="${0.6 + Math.random() * 0.4}"/>`;
    }
  }
  
  return svg;
}

function generateMediumDetails(items: string[], seasonMod: any, dimensions: any, density: number): string {
  const { width, height } = dimensions;
  const count = Math.floor(15 * density);
  let svg = '';
  
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = height * 0.55 + Math.random() * (height * 0.4);
    const size = 15 + Math.random() * 25;
    const color = seasonMod.colors[Math.floor(Math.random() * seasonMod.colors.length)];
    const itemType = items[Math.floor(Math.random() * items.length)];
    
    switch (itemType) {
      case 'кусты':
        svg += `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size*0.7}" fill="${color}"/>`;
        svg += `<ellipse cx="${x-size*0.5}" cy="${y+5}" rx="${size*0.7}" ry="${size*0.5}" fill="${adjustColor(color, -15)}"/>`;
        break;
      case 'камни':
      case 'валуны':
        svg += `<path d="M${x-size},${y} Q${x-size*1.2},${y-size*0.8} ${x},${y-size} Q${x+size*1.2},${y-size*0.8} ${x+size},${y} Z" fill="${adjustColor(color, -40)}"/>`;
        break;
      case 'фонари':
        svg += `<rect x="${x-3}" y="${y-size}" width="6" height="${size}" fill="#333"/>`;
        svg += `<circle cx="${x}" cy="${y-size-5}" r="8" fill="#FFD700" opacity="0.8"/>`;
        break;
      default:
        svg += `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size*0.6}" fill="${color}"/>`;
    }
  }
  
  return svg;
}

function generateLargeDetails(items: string[], seasonMod: any, dimensions: any, density: number): string {
  const { width, height } = dimensions;
  const count = Math.floor(5 * density);
  let svg = '';
  
  for (let i = 0; i < count; i++) {
    const x = 100 + i * (width / (count + 1)) + (Math.random() - 0.5) * 100;
    const y = height * 0.5 + Math.random() * (height * 0.3);
    const size = 40 + Math.random() * 60;
    const color = seasonMod.colors[Math.floor(Math.random() * seasonMod.colors.length)];
    const itemType = items[Math.floor(Math.random() * items.length)];
    
    switch (itemType) {
      case 'деревья':
        // Ствол
        svg += `<rect x="${x-size*0.1}" y="${y-size*0.3}" width="${size*0.2}" height="${size*0.5}" fill="#8B4513"/>`;
        // Крона
        svg += `<ellipse cx="${x}" cy="${y-size*0.5}" rx="${size*0.5}" ry="${size*0.4}" fill="${color}"/>`;
        break;
      case 'скалы':
        svg += `<polygon points="${x},${y} ${x-size},${y+size*0.5} ${x-size*0.5},${y-size*0.3} ${x+size*0.5},${y-size*0.2} ${x+size},${y+size*0.4}" fill="${adjustColor(color, -20)}"/>`;
        break;
      case 'здания':
        svg += `<rect x="${x-size*0.4}" y="${y-size}" width="${size*0.8}" height="${size}" fill="${adjustColor(color, -40)}"/>`;
        // Окна
        for (let w = 0; w < 3; w++) {
          svg += `<rect x="${x-size*0.3+w*size*0.2}" y="${y-size+size*0.1}" width="${size*0.15}" height="${size*0.2}" fill="#87CEEB"/>`;
        }
        break;
      default:
        svg += `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size*0.5}" fill="${color}" opacity="0.6"/>`;
    }
  }
  
  return svg;
}

function generateFloatingDetails(items: string[], seasonMod: any, dimensions: any, density: number): string {
  const { width, height } = dimensions;
  const count = Math.floor(10 * density * seasonMod.density);
  let svg = '';
  
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.7;
    const size = 5 + Math.random() * 15;
    const itemType = items[Math.floor(Math.random() * items.length)];
    
    switch (itemType) {
      case 'птицы':
        svg += `<path d="M${x},${y} Q${x-size},${y-size*0.3} ${x-size*2},${y} Q${x-size},${y+size*0.3} ${x},${y}" stroke="#333" stroke-width="2" fill="none"/>`;
        break;
      case 'бабочки':
        svg += `<ellipse cx="${x-size*0.5}" cy="${y}" rx="${size*0.4}" ry="${size*0.6}" fill="${seasonMod.colors[1]}" transform="rotate(-30 ${x-size*0.5} ${y})"/>`;
        svg += `<ellipse cx="${x+size*0.5}" cy="${y}" rx="${size*0.4}" ry="${size*0.6}" fill="${seasonMod.colors[1]}" transform="rotate(30 ${x+size*0.5} ${y})"/>`;
        break;
      case 'облака':
        svg += `<ellipse cx="${x}" cy="${y}" rx="${size*2}" ry="${size}" fill="rgba(255,255,255,0.7)"/>`;
        svg += `<ellipse cx="${x-size}" cy="${y+size*0.2}" rx="${size*1.5}" ry="${size*0.8}" fill="rgba(255,255,255,0.6)"/>`;
        break;
      case 'звёзды':
        svg += `<polygon points="${x},${y-size} ${x+size*0.3},${y-size*0.3} ${x+size},${y} ${x+size*0.3},${y+size*0.3} ${x},${y+size} ${x-size*0.3},${y+size*0.3} ${x-size},${y} ${x-size*0.3},${y-size*0.3}" fill="white" opacity="${0.5 + Math.random() * 0.5}"/>`;
        break;
      case 'листья':
        svg += `<ellipse cx="${x}" cy="${y}" rx="${size*0.5}" ry="${size}" fill="${seasonMod.colors[0]}" transform="rotate(${Math.random()*360} ${x} ${y})"/>`;
        break;
      case 'пузырьки':
        svg += `<circle cx="${x}" cy="${y}" r="${size*0.3}" fill="rgba(200,230,255,0.5)" stroke="rgba(150,200,255,0.3)" stroke-width="1"/>`;
        break;
      default:
        svg += `<circle cx="${x}" cy="${y}" r="${size*0.5}" fill="rgba(255,255,255,0.5)"/>`;
    }
  }
  
  return svg;
}

function applyDetailStyle(style: string, dimensions: any): string {
  switch (style) {
    case 'ghibli':
      return `<style>.details-layer * { filter: saturate(1.2); }</style>`;
    case 'anime':
      return `<style>.details-layer * { stroke-width: 1.5; }</style>`;
    case 'disney':
      return `<style>.details-layer * { filter: brightness(1.1); }</style>`;
    default:
      return '';
  }
}

function generateDetailElements(detailLib: any, seasonMod: any, dimensions: any, density: number): any[] {
  const elements: any[] = [];
  const { width, height } = dimensions;
  
  // Добавляем по одному элементу каждого типа для справки
  Object.entries(detailLib).forEach(([size, items]) => {
    items.forEach((item: string) => {
      elements.push({
        type: item,
        category: size,
        reference: `Элемент "${item}" в категории ${size}`
      });
    });
  });
  
  return elements;
}

function adjustColor(hexColor: string, amount: number): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const adjustR = Math.min(255, Math.max(0, r + amount));
  const adjustG = Math.min(255, Math.max(0, g + amount));
  const adjustB = Math.min(255, Math.max(0, b + amount));
  
  return `#${adjustR.toString(16).padStart(2, '0')}${adjustG.toString(16).padStart(2, '0')}${adjustB.toString(16).padStart(2, '0')}`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-details',
    name: 'Детали на фоне',
    specialization: 'Создание деталей фона',
    capabilities: [
      'Мелкие детали (трава, цветы, камни)',
      'Средние детали (кусты, камни, предметы)',
      'Крупные детали (деревья, скалы, здания)',
      'Плавающие элементы (птицы, облака, листья)',
      'Сезонные модификации',
      'Контроль плотности'
    ],
    detailCategories: Object.keys(DETAIL_LIBRARY),
    seasons: Object.keys(SEASON_MODIFIERS),
    status: 'ready'
  });
}
