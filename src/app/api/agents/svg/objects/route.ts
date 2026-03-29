import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Предметы в сцене (Objects Artist)
 * Отвечает за создание предметов, мебели, реквизита, декораций
 */

// Библиотека предметов по категориям
const OBJECT_LIBRARY: Record<string, any> = {
  'мебель': {
    items: ['стол', 'стул', 'кровать', 'шкаф', 'диван', 'кресло', 'полка', 'лампы'],
    style: 'functional',
    complexity: 'medium'
  },
  'природа': {
    items: ['дерево', 'куст', 'цветок', 'камень', 'пень', 'ветка', 'лист'],
    style: 'organic',
    complexity: 'variable'
  },
  'архитектура': {
    items: ['окно', 'дверь', 'колонна', 'арка', 'лестница', 'балкон', 'крыша'],
    style: 'structural',
    complexity: 'high'
  },
  'транспорт': {
    items: ['машина', 'корабль', 'велосипед', 'повозка', 'лодка', 'карета'],
    style: 'mechanical',
    complexity: 'high'
  },
  'посуда': {
    items: ['чашка', 'тарелка', 'ваза', 'бутылка', 'чайник', 'кастрюля'],
    style: 'simple',
    complexity: 'low'
  },
  'книги_бумага': {
    items: ['книга', 'свиток', 'карта', 'письмо', 'газета', 'журнал'],
    style: 'flat',
    complexity: 'low'
  },
  'магические': {
    items: ['кристалл', 'посох', 'зелье', 'книга_заклинаний', 'амулет', 'меч'],
    style: 'mystical',
    complexity: 'high'
  },
  'технологии': {
    items: ['компьютер', 'телефон', 'робот', 'экран', 'кнопка', 'провод'],
    style: 'modern',
    complexity: 'medium'
  }
};

// SVG шаблоны для базовых предметов
const OBJECT_TEMPLATES: Record<string, string> = {
  'стол': `<g class="object table">
    <rect x="0" y="0" width="100" height="10" fill="#8B4513" rx="2"/>
    <rect x="5" y="10" width="10" height="40" fill="#6B3510"/>
    <rect x="85" y="10" width="10" height="40" fill="#6B3510"/>
  </g>`,
  
  'стул': `<g class="object chair">
    <rect x="0" y="20" width="40" height="5" fill="#8B4513"/>
    <rect x="0" y="0" width="5" height="50" fill="#6B3510"/>
    <rect x="35" y="25" width="5" height="25" fill="#6B3510"/>
    <rect x="0" y="0" width="40" height="20" fill="#A0522D" rx="3"/>
  </g>`,
  
  'дерево': `<g class="object tree">
    <rect x="20" y="60" width="20" height="50" fill="#8B4513"/>
    <ellipse cx="30" cy="40" rx="40" ry="45" fill="#228B22"/>
    <ellipse cx="15" cy="55" rx="25" ry="30" fill="#2E8B2E"/>
    <ellipse cx="45" cy="50" rx="25" ry="35" fill="#1E7B1E"/>
  </g>`,
  
  'книга': `<g class="object book">
    <rect x="0" y="0" width="40" height="50" fill="#8B0000" rx="2"/>
    <rect x="3" y="3" width="34" height="44" fill="#FFE4C4"/>
    <line x1="20" y1="10" x2="20" y2="40" stroke="#8B0000" stroke-width="1"/>
  </g>`,
  
  'лампа': `<g class="object lamp">
    <ellipse cx="25" cy="10" rx="25" ry="15" fill="#FFD700"/>
    <rect x="20" y="25" width="10" height="30" fill="#333"/>
    <ellipse cx="25" cy="60" rx="20" ry="5" fill="#333"/>
    <ellipse cx="25" cy="10" rx="20" ry="10" fill="rgba(255,255,200,0.5)"/>
  </g>`,
  
  'окно': `<g class="object window">
    <rect x="0" y="0" width="80" height="100" fill="#87CEEB" stroke="#8B4513" stroke-width="5"/>
    <line x1="40" y1="0" x2="40" y2="100" stroke="#8B4513" stroke-width="3"/>
    <line x1="0" y1="50" x2="80" y2="50" stroke="#8B4513" stroke-width="3"/>
  </g>`,
  
  'дверь': `<g class="object door">
    <rect x="0" y="0" width="60" height="120" fill="#8B4513" rx="3"/>
    <rect x="5" y="5" width="50" height="110" fill="#A0522D" rx="2"/>
    <circle cx="50" cy="60" r="5" fill="#FFD700"/>
  </g>`,
  
  'кристалл': `<g class="object crystal">
    <polygon points="30,0 60,30 45,80 15,80 0,30" fill="#9370DB" opacity="0.8"/>
    <polygon points="30,0 60,30 45,50 30,30" fill="#DDA0DD" opacity="0.6"/>
    <polygon points="30,0 0,30 15,50 30,30" fill="#BA55D3" opacity="0.6"/>
    <ellipse cx="30" cy="40" rx="15" ry="10" fill="rgba(255,255,255,0.3)"/>
  </g>`
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      category = 'мебель',
      items = [],
      style = 'ghibli',
      count = 5,
      dimensions = { width: 1024, height: 576 },
      placement = 'auto'
    } = body;
    
    const { width, height } = dimensions;
    
    // Получаем библиотеку предметов
    const categoryData = OBJECT_LIBRARY[category] || OBJECT_LIBRARY['мебель'];
    const selectedItems = items.length > 0 ? items : categoryData.items.slice(0, count);
    
    // Генерируем SVG для каждого предмета
    const objectsData = selectedItems.map((itemName: string, i: number) => {
      const template = OBJECT_TEMPLATES[itemName] || generateGenericObject(itemName);
      const position = calculateObjectPosition(i, selectedItems.length, dimensions, placement);
      
      return {
        name: itemName,
        svg: template,
        position,
        scale: position.scale || 1,
        rotation: position.rotation || 0
      };
    });
    
    // Создаём общий SVG
    const objectsSVG = generateObjectsSVG(objectsData, style, dimensions);

    return NextResponse.json({
      success: true,
      agent: 'svg-objects',
      specialization: 'Предметы в сцене',
      
      svg: objectsSVG,
      
      objects: objectsData,
      
      category: categoryData,
      
      availableTemplates: Object.keys(OBJECT_TEMPLATES),
      
      message: `${objectsData.length} предметов создано (${category})`
    });

  } catch (error) {
    console.error('[SVG-Objects] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

function generateGenericObject(name: string): string {
  // Генерируем простой объект если нет шаблона
  const colors = ['#8B4513', '#D2691E', '#A0522D', '#CD853F'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return `<g class="object ${name}">
    <rect x="0" y="0" width="50" height="50" fill="${color}" rx="5"/>
    <text x="25" y="30" text-anchor="middle" font-size="10" fill="white">${name}</text>
  </g>`;
}

function calculateObjectPosition(
  index: number, 
  total: number, 
  dimensions: any, 
  placement: string
): any {
  const { width, height } = dimensions;
  
  if (placement === 'auto') {
    // Автоматическое размещение по сетке
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const cellWidth = width / cols;
    const cellHeight = height / cols;
    
    return {
      x: cellWidth * col + cellWidth / 2,
      y: height * 0.6 + cellHeight * row,
      scale: 0.8 + Math.random() * 0.4,
      rotation: (Math.random() - 0.5) * 20
    };
  }
  
  return { x: width / 2, y: height / 2, scale: 1, rotation: 0 };
}

function generateObjectsSVG(
  objectsData: any[], 
  style: string, 
  dimensions: any
): string {
  const { width, height } = dimensions;
  
  const objectsContent = objectsData.map((obj, i) => {
    const transform = `transform="translate(${obj.position.x - 25}, ${obj.position.y - 25}) scale(${obj.position.scale}) rotate(${obj.position.rotation || 0} 25 25)"`;
    
    return `<g class="object-item" data-name="${obj.name}" data-index="${i}" ${transform}>
      ${obj.svg}
    </g>`;
  }).join('');
  
  // Стилевые модификаторы
  const styleFilter = getStyleFilter(style);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="objects-layer" data-agent="objects">
  <defs>
    <filter id="objectShadow">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
    ${styleFilter}
  </defs>
  
  <!-- Предметы -->
  <g class="objects-container" filter="url(#objectShadow)">
    ${objectsContent}
  </g>
  
  <!-- Легенда -->
  <g class="legend" transform="translate(10, 10)">
    <text font-size="12" fill="rgba(0,0,0,0.6)">Предметов: ${objectsData.length}</text>
  </g>
</svg>`;
}

function getStyleFilter(style: string): string {
  switch (style) {
    case 'ghibli':
      return `<filter id="styleFilter"><feColorMatrix type="saturate" values="1.2"/></filter>`;
    case 'anime':
      return `<filter id="styleFilter"><feConvolveMatrix kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"/></filter>`;
    default:
      return '';
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-objects',
    name: 'Предметы в сцене',
    specialization: 'Создание предметов и реквизита',
    capabilities: [
      'Мебель',
      'Природные объекты',
      'Архитектурные элементы',
      'Транспорт',
      'Посуда',
      'Книги и документы',
      'Магические предметы',
      'Технологии'
    ],
    categories: Object.keys(OBJECT_LIBRARY),
    templates: Object.keys(OBJECT_TEMPLATES),
    status: 'ready'
  });
}
