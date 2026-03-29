import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Расстановка (Layout Artist)
 * Отвечает за логичное расположение предметов и персонажей в сцене
 */

// Принципы расстановки
const LAYOUT_PRINCIPLES: Record<string, any> = {
  'focal-center': {
    name: 'Фокус в центре',
    description: 'Главный объект в центре внимания',
    apply: true
  },
  'rule-of-thirds': {
    name: 'Правило третей',
    description: 'Объекты на пересечениях линий',
    apply: true
  },
  'depth-layers': {
    name: 'Слои глубины',
    description: 'Передний, средний, задний план',
    apply: true
  },
  'visual-flow': {
    name: 'Визуальный поток',
    description: 'Направление взгляда зрителя',
    apply: true
  },
  'balance': {
    name: 'Баланс',
    description: 'Равномерное распределение визуального веса',
    apply: true
  }
};

// Зоны сцены
const SCENE_ZONES: Record<string, any> = {
  'center': { name: 'Центр', importance: 10, description: 'Главное действие' },
  'left': { name: 'Слева', importance: 7, description: 'Второстепенные элементы' },
  'right': { name: 'Справа', importance: 7, description: 'Второстепенные элементы' },
  'foreground-left': { name: 'Передний план слева', importance: 5, description: 'Детали переднего плана' },
  'foreground-right': { name: 'Передний план справа', importance: 5, description: 'Детали переднего плана' },
  'background': { name: 'Фон', importance: 3, description: 'Окружение' }
};

// Приоритеты объектов
const PRIORITY_RULES: Record<string, any> = {
  'protagonist': { priority: 10, zones: ['center'], scale: 1.0 },
  'antagonist': { priority: 9, zones: ['left', 'right'], scale: 0.95 },
  'supporting': { priority: 7, zones: ['left', 'right'], scale: 0.85 },
  'background-char': { priority: 4, zones: ['background'], scale: 0.6 },
  'main-object': { priority: 8, zones: ['center', 'left', 'right'], scale: 0.9 },
  'prop': { priority: 5, zones: ['foreground-left', 'foreground-right'], scale: 0.7 },
  'decoration': { priority: 2, zones: ['background'], scale: 0.5 }
};

// Отношения между объектами
const SPATIAL_RELATIONS: Record<string, any> = {
  'near': { name: 'Рядом', distance: 50 },
  'beside': { name: 'Рядом с', distance: 80 },
  'behind': { name: 'Позади', distance: 100, zOffset: 1 },
  'in-front': { name: 'Перед', distance: 100, zOffset: -1 },
  'between': { name: 'Между', distance: 0, requiresTwo: true },
  'facing': { name: 'Лицом к', rotation: 'face' },
  'back-to-back': { name: 'Спиной к спине', rotation: 'opposite' }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      objects = [],
      characters = [],
      composition = 'rule-of-thirds',
      dimensions = { width: 1024, height: 576 },
      constraints = []
    } = body;
    
    const { width, height } = dimensions;
    
    // Анализируем входные данные
    const allElements = [
      ...objects.map((obj: any) => ({ ...obj, type: 'object' })),
      ...characters.map((char: any) => ({ ...char, type: 'character' }))
    ];
    
    // Сортируем по приоритету
    const sortedElements = sortElementsByPriority(allElements);
    
    // Рассчитываем позиции
    const positionedElements = calculateLayout(
      sortedElements, 
      composition, 
      dimensions, 
      constraints
    );
    
    // Проверяем коллизии и корректируем
    const finalLayout = resolveCollisions(positionedElements, dimensions);
    
    // Генерируем SVG схемы расстановки
    const layoutSVG = generateLayoutSVG(finalLayout, dimensions);
    
    // Создаём отчёт по расстановке
    const layoutReport = generateLayoutReport(finalLayout);

    return NextResponse.json({
      success: true,
      agent: 'svg-layout',
      specialization: 'Расстановка в сцене',
      
      svg: layoutSVG,
      
      layout: finalLayout,
      
      report: layoutReport,
      
      principles: LAYOUT_PRINCIPLES,
      
      message: `Расстановка для ${finalLayout.length} элементов создана`
    });

  } catch (error) {
    console.error('[SVG-Layout] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

function sortElementsByPriority(elements: any[]): any[] {
  return elements.sort((a, b) => {
    const priorityA = PRIORITY_RULES[a.role]?.priority || PRIORITY_RULES['prop']?.priority || 5;
    const priorityB = PRIORITY_RULES[b.role]?.priority || PRIORITY_RULES['prop']?.priority || 5;
    return priorityB - priorityA;
  });
}

function calculateLayout(
  elements: any[],
  composition: string,
  dimensions: any,
  constraints: any[]
): any[] {
  const { width, height } = dimensions;
  
  // Точки интереса в зависимости от композиции
  const focalPoints = getFocalPoints(composition, dimensions);
  
  return elements.map((element, index) => {
    const priority = PRIORITY_RULES[element.role] || PRIORITY_RULES['prop'];
    
    // Выбираем лучшую позицию
    const bestPosition = findBestPosition(
      element, 
      index, 
      elements, 
      focalPoints, 
      dimensions,
      priority
    );
    
    return {
      ...element,
      position: bestPosition,
      zone: determineZone(bestPosition, dimensions),
      priority: priority.priority
    };
  });
}

function getFocalPoints(composition: string, dimensions: any): any[] {
  const { width, height } = dimensions;
  
  switch (composition) {
    case 'rule-of-thirds':
      return [
        { x: width / 3, y: height / 3, weight: 1 },
        { x: width * 2 / 3, y: height / 3, weight: 1 },
        { x: width / 3, y: height * 2 / 3, weight: 1 },
        { x: width * 2 / 3, y: height * 2 / 3, weight: 1 }
      ];
    case 'golden-ratio':
      const phi = 1.618;
      return [
        { x: width / phi, y: height / phi, weight: 1.5 },
        { x: width - width / phi, y: height / phi, weight: 1.5 }
      ];
    default:
      return [{ x: width / 2, y: height / 2, weight: 2 }];
  }
}

function findBestPosition(
  element: any,
  index: number,
  allElements: any[],
  focalPoints: any[],
  dimensions: any,
  priority: any
): any {
  const { width, height } = dimensions;
  
  // Для главных элементов - ближе к фокусным точкам
  if (priority.priority >= 8) {
    const focalPoint = focalPoints[index % focalPoints.length];
    return {
      x: focalPoint.x,
      y: height * 0.6 + (priority.priority - 8) * 20,
      scale: priority.scale,
      rotation: 0
    };
  }
  
  // Для второстепенных - распределяем по зонам
  const zones = priority.zones;
  const zone = zones[index % zones.length];
  const zonePosition = getZonePosition(zone, dimensions);
  
  return {
    x: zonePosition.x + (Math.random() - 0.5) * 100,
    y: zonePosition.y,
    scale: priority.scale,
    rotation: 0
  };
}

function getZonePosition(zone: string, dimensions: any): any {
  const { width, height } = dimensions;
  
  const positions: Record<string, any> = {
    'center': { x: width / 2, y: height * 0.65 },
    'left': { x: width * 0.25, y: height * 0.6 },
    'right': { x: width * 0.75, y: height * 0.6 },
    'foreground-left': { x: width * 0.15, y: height * 0.85 },
    'foreground-right': { x: width * 0.85, y: height * 0.85 },
    'background': { x: width / 2, y: height * 0.4 }
  };
  
  return positions[zone] || positions['center'];
}

function determineZone(position: any, dimensions: any): string {
  const { width, height } = dimensions;
  const relX = position.x / width;
  const relY = position.y / height;
  
  if (relY > 0.75) return 'foreground';
  if (relY < 0.45) return 'background';
  if (relX < 0.35) return 'left';
  if (relX > 0.65) return 'right';
  return 'center';
}

function resolveCollisions(elements: any[], dimensions: any): any[] {
  const { width, height } = dimensions;
  const minDistance = 80;
  
  const resolved = [...elements];
  
  for (let i = 0; i < resolved.length; i++) {
    for (let j = i + 1; j < resolved.length; j++) {
      const el1 = resolved[i];
      const el2 = resolved[j];
      
      const dx = el2.position.x - el1.position.x;
      const dy = el2.position.y - el1.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        // Раздвигаем элементы
        const pushX = (minDistance - distance) / 2 * (dx / distance || 1);
        const pushY = (minDistance - distance) / 2 * (dy / distance || 1);
        
        resolved[i] = {
          ...el1,
          position: {
            ...el1.position,
            x: el1.position.x - pushX,
            y: el1.position.y - pushY
          }
        };
        
        resolved[j] = {
          ...el2,
          position: {
            ...el2.position,
            x: el2.position.x + pushX,
            y: el2.position.y + pushY
          }
        };
      }
    }
  }
  
  return resolved;
}

function generateLayoutSVG(elements: any[], dimensions: any): string {
  const { width, height } = dimensions;
  
  const elementsSVG = elements.map((el, i) => {
    const color = el.type === 'character' ? '#FF6B6B' : '#4ECDC4';
    const size = 30 + (el.priority || 5) * 3;
    
    return `
      <circle cx="${el.position.x}" cy="${el.position.y}" r="${size}" fill="${color}" stroke="white" stroke-width="2" opacity="0.7"/>
      <text x="${el.position.x}" y="${el.position.y + 5}" text-anchor="middle" font-size="12" fill="white">${el.name || el.type}</text>
      <text x="${el.position.x}" y="${el.position.y + size + 15}" text-anchor="middle" font-size="10" fill="rgba(0,0,0,0.5)">${el.zone}</text>
    `;
  }).join('');
  
  // Сетка зон
  const zonesSVG = `
    <rect x="0" y="0" width="${width}" height="${height * 0.4}" fill="rgba(200,200,255,0.1)" stroke="rgba(100,100,200,0.3)"/>
    <text x="10" y="20" font-size="10" fill="rgba(100,100,200,0.5)">Задний план</text>
    
    <rect x="0" y="${height * 0.4}" width="${width}" height="${height * 0.35}" fill="rgba(200,255,200,0.1)" stroke="rgba(100,200,100,0.3)"/>
    <text x="10" y="${height * 0.55}" font-size="10" fill="rgba(100,200,100,0.5)">Средний план</text>
    
    <rect x="0" y="${height * 0.75}" width="${width}" height="${height * 0.25}" fill="rgba(255,200,200,0.1)" stroke="rgba(200,100,100,0.3)"/>
    <text x="10" y="${height * 0.9}" font-size="10" fill="rgba(200,100,100,0.5)">Передний план</text>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="layout-guide" data-agent="layout">
  <defs>
    <filter id="layoutGlow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Зоны -->
  ${zonesSVG}
  
  <!-- Элементы -->
  <g class="elements" filter="url(#layoutGlow)">
    ${elementsSVG}
  </g>
  
  <!-- Линии связей -->
  <g class="connections" opacity="0.3">
    ${generateConnections(elements)}
  </g>
  
  <!-- Инфо -->
  <text x="${width - 10}" y="20" text-anchor="end" font-size="12" fill="rgba(0,0,0,0.5)">Элементов: ${elements.length}</text>
</svg>`;
}

function generateConnections(elements: any[]): string {
  let connections = '';
  
  // Соединяем персонажей линиями взаимодействия
  const characters = elements.filter(e => e.type === 'character');
  
  for (let i = 0; i < characters.length - 1; i++) {
    const el1 = characters[i];
    const el2 = characters[i + 1];
    
    connections += `<line x1="${el1.position.x}" y1="${el1.position.y}" x2="${el2.position.x}" y2="${el2.position.y}" stroke="rgba(150,150,150,0.5)" stroke-width="1" stroke-dasharray="5,5"/>`;
  }
  
  return connections;
}

function generateLayoutReport(elements: any[]): any {
  const zones: Record<string, number> = {};
  const types: Record<string, number> = {};
  
  elements.forEach(el => {
    zones[el.zone] = (zones[el.zone] || 0) + 1;
    types[el.type] = (types[el.type] || 0) + 1;
  });
  
  return {
    totalElements: elements.length,
    zonesDistribution: zones,
    typesDistribution: types,
    recommendations: generateRecommendations(elements)
  };
}

function generateRecommendations(elements: any[]): string[] {
  const recommendations: string[] = [];
  
  const protagonistCount = elements.filter(e => e.role === 'protagonist').length;
  if (protagonistCount > 1) {
    recommendations.push('Несколько главных героев - рассмотрите иерархию');
  }
  
  const backgroundCount = elements.filter(e => e.zone === 'background').length;
  if (backgroundCount === 0) {
    recommendations.push('Добавьте элементы на задний план для глубины');
  }
  
  return recommendations;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-layout',
    name: 'Расстановка',
    specialization: 'Логичная расстановка объектов',
    capabilities: [
      'Приоритизация объектов',
      'Разрешение коллизий',
      'Баланс композиции',
      'Зоны сцены',
      'Пространственные отношения'
    ],
    principles: Object.keys(LAYOUT_PRINCIPLES),
    zones: Object.keys(SCENE_ZONES),
    priorityRules: Object.keys(PRIORITY_RULES),
    relations: Object.keys(SPATIAL_RELATIONS),
    status: 'ready'
  });
}
