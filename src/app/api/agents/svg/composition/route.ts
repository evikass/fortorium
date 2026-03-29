import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Композиция и ритм (Composition Artist)
 * Отвеляет за правила третей, золотое сечение, направляющие линии, визуальный ритм
 */

// Правила композиции
const COMPOSITION_RULES: Record<string, any> = {
  'rule-of-thirds': {
    name: 'Правило третей',
    description: 'Деление кадра на 9 равных частей',
    guides: (w: number, h: number) => [
      { type: 'vertical', x: w / 3 },
      { type: 'vertical', x: w * 2 / 3 },
      { type: 'horizontal', y: h / 3 },
      { type: 'horizontal', y: h * 2 / 3 }
    ],
    focalPoints: (w: number, h: number) => [
      { x: w / 3, y: h / 3 },
      { x: w * 2 / 3, y: h / 3 },
      { x: w / 3, y: h * 2 / 3 },
      { x: w * 2 / 3, y: h * 2 / 3 }
    ]
  },
  'golden-ratio': {
    name: 'Золотое сечение',
    description: 'Божественная пропорция 1.618',
    guides: (w: number, h: number) => {
      const phi = 1.618;
      return [
        { type: 'vertical', x: w / phi },
        { type: 'vertical', x: w - w / phi },
        { type: 'horizontal', y: h / phi },
        { type: 'horizontal', y: h - h / phi }
      ];
    },
    focalPoints: (w: number, h: number) => {
      const phi = 1.618;
      return [
        { x: w / phi, y: h / phi },
        { x: w - w / phi, y: h / phi },
        { x: w / phi, y: h - h / phi },
        { x: w - w / phi, y: h - h / phi }
      ];
    }
  },
  'golden-spiral': {
    name: 'Золотая спираль',
    description: 'Спираль Фибоначчи',
    guides: (w: number, h: number) => [], // Спираль рисуется отдельно
    focalPoints: (w: number, h: number) => [{ x: w * 0.618, y: h * 0.618 }]
  },
  'centered': {
    name: 'Центральная композиция',
    description: 'Симметрия вокруг центра',
    guides: (w: number, h: number) => [
      { type: 'vertical', x: w / 2 },
      { type: 'horizontal', y: h / 2 },
      { type: 'diagonal', x1: 0, y1: 0, x2: w, y2: h },
      { type: 'diagonal', x1: w, y1: 0, x2: 0, y2: h }
    ],
    focalPoints: (w: number, h: number) => [{ x: w / 2, y: h / 2 }]
  },
  'diagonal': {
    name: 'Диагональная композиция',
    description: 'Динамичные диагональные линии',
    guides: (w: number, h: number) => [
      { type: 'diagonal', x1: 0, y1: h, x2: w, y2: 0 },
      { type: 'diagonal', x1: 0, y1: 0, x2: w, y2: h }
    ],
    focalPoints: (w: number, h: number) => [{ x: w / 2, y: h / 2 }]
  },
  'frame-within-frame': {
    name: 'Рамка в рамке',
    description: 'Естественное обрамление',
    guides: (w: number, h: number) => [],
    focalPoints: (w: number, h: number) => [{ x: w / 2, y: h / 2 }]
  }
};

// Визуальный ритм
const RHYTHM_PATTERNS: Record<string, any> = {
  'regular': { name: 'Регулярный', description: 'Равномерное повторение', interval: 50 },
  'alternating': { name: 'Чередующийся', description: 'ABAB паттерн', interval: 40 },
  'progressive': { name: 'Прогрессивный', description: 'Увеличение/уменьшение', interval: 'dynamic' },
  'flowing': { name: 'Текущий', description: 'Плавные переходы', interval: 'organic' },
  'random': { name: 'Случайный', description: 'Хаотичное размещение', interval: 'random' }
};

// Направляющие линии
const LEADING_LINES: Record<string, any> = {
  'converging': { name: 'Сходящиеся', description: 'Линии ведут к одной точке' },
  'diverging': { name: 'Расходящиеся', description: 'Линии расходятся от центра' },
  'curved': { name: 'Изогнутые', description: 'S-образные и C-образные кривые' },
  'zigzag': { name: 'Зигзагообразные', description: 'Энергичные зигзаги' },
  'vertical': { name: 'Вертикальные', description: 'Ввысь, величественность' },
  'horizontal': { name: 'Горизонтальные', description: 'Спокойствие, широта' }
};

// Баланс
const BALANCE_TYPES: Record<string, any> = {
  'symmetrical': { name: 'Симметричный', weight: 'equal' },
  'asymmetrical': { name: 'Асимметричный', weight: 'visual-balance' },
  'radial': { name: 'Радиальный', weight: 'center-focused' }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      rule = 'rule-of-thirds',
      rhythm = 'flowing',
      leadingLine = 'converging',
      balance = 'asymmetrical',
      dimensions = { width: 1024, height: 576 }
    } = body;
    
    const { width, height } = dimensions;
    
    // Получаем правило композиции
    const compositionRule = COMPOSITION_RULES[rule] || COMPOSITION_RULES['rule-of-thirds'];
    const guides = compositionRule.guides(width, height);
    const focalPoints = compositionRule.focalPoints(width, height);
    
    // Генерируем SVG композиционной сетки
    const compositionSVG = generateCompositionSVG(
      compositionRule, 
      guides, 
      focalPoints, 
      rhythm,
      leadingLine,
      dimensions
    );
    
    // Создаём рекомендации по размещению
    const placementGuide = generatePlacementGuide(focalPoints, balance, dimensions);

    return NextResponse.json({
      success: true,
      agent: 'svg-composition',
      specialization: 'Композиция и ритм',
      
      svg: compositionSVG,
      
      composition: {
        rule: compositionRule.name,
        description: compositionRule.description,
        guides,
        focalPoints
      },
      
      rhythm: {
        type: rhythm,
        ...RHYTHM_PATTERNS[rhythm]
      },
      
      leadingLines: {
        type: leadingLine,
        ...LEADING_LINES[leadingLine]
      },
      
      balance: {
        type: balance,
        ...BALANCE_TYPES[balance]
      },
      
      placementGuide,
      
      message: `Композиция "${compositionRule.name}" создана`
    });

  } catch (error) {
    console.error('[SVG-Composition] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

function generateCompositionSVG(
  rule: any,
  guides: any[],
  focalPoints: any[],
  rhythm: string,
  leadingLine: string,
  dimensions: any
): string {
  const { width, height } = dimensions;
  
  let guidesSVG = '';
  let focalPointsSVG = '';
  
  // Рисуем направляющие линии
  guides.forEach((guide: any) => {
    if (guide.type === 'vertical') {
      guidesSVG += `<line x1="${guide.x}" y1="0" x2="${guide.x}" y2="${height}" stroke="rgba(255,0,0,0.3)" stroke-width="1" stroke-dasharray="5,5"/>`;
    } else if (guide.type === 'horizontal') {
      guidesSVG += `<line x1="0" y1="${guide.y}" x2="${width}" y2="${guide.y}" stroke="rgba(255,0,0,0.3)" stroke-width="1" stroke-dasharray="5,5"/>`;
    } else if (guide.type === 'diagonal') {
      guidesSVG += `<line x1="${guide.x1}" y1="${guide.y1}" x2="${guide.x2}" y2="${guide.y2}" stroke="rgba(255,0,0,0.3)" stroke-width="1" stroke-dasharray="5,5"/>`;
    }
  });
  
  // Рисуем точки фокуса
  focalPoints.forEach((point: any, i: number) => {
    focalPointsSVG += `
      <circle cx="${point.x}" cy="${point.y}" r="15" fill="none" stroke="rgba(0,255,0,0.5)" stroke-width="2"/>
      <circle cx="${point.x}" cy="${point.y}" r="3" fill="rgba(0,255,0,0.8)"/>
      <text x="${point.x}" y="${point.y - 25}" text-anchor="middle" font-size="12" fill="rgba(0,255,0,0.8)">Фокус ${i + 1}</text>
    `;
  });
  
  // Добавляем золотую спираль если нужно
  const spiralSVG = rule.name === 'Золотая спираль' ? generateGoldenSpiral(dimensions) : '';
  
  // Добавляем ритм паттерн
  const rhythmSVG = generateRhythmOverlay(rhythm, dimensions);
  
  // Добавляем направляющие линии
  const leadingLinesSVG = generateLeadingLinesOverlay(leadingLine, dimensions);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="composition-guide" data-agent="composition">
  <defs>
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(200,200,200,0.2)" stroke-width="0.5"/>
    </pattern>
    
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,165,0,0.8)"/>
    </marker>
  </defs>
  
  <!-- Сетка -->
  <rect width="100%" height="100%" fill="url(#grid)"/>
  
  <!-- Направляющие линии -->
  <g class="guides">
    ${guidesSVG}
  </g>
  
  <!-- Точки фокуса -->
  <g class="focal-points">
    ${focalPointsSVG}
  </g>
  
  <!-- Золотая спираль -->
  ${spiralSVG}
  
  <!-- Ритм -->
  ${rhythmSVG}
  
  <!-- Направляющие -->
  ${leadingLinesSVG}
  
  <!-- Рамка безопасной зоны -->
  <rect x="5%" y="5%" width="90%" height="90%" fill="none" stroke="rgba(255,255,0,0.3)" stroke-width="1" stroke-dasharray="10,5"/>
  
  <!-- Название правила -->
  <text x="${width/2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="rgba(0,0,0,0.5)">${rule.name}</text>
</svg>`;
}

function generateGoldenSpiral(dimensions: any): string {
  const { width, height } = dimensions;
  let path = '';
  
  // Упрощённая золотая спираль
  const phi = 1.618;
  let x = width * 0.1;
  let y = height * 0.1;
  let size = Math.min(width, height) * 0.8;
  
  for (let i = 0; i < 8; i++) {
    const newSize = size / phi;
    path += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" stroke="rgba(128,0,128,0.3)" stroke-width="1"/>`;
    size = newSize;
  }
  
  return `<g class="golden-spiral">${path}</g>`;
}

function generateRhythmOverlay(rhythm: string, dimensions: any): string {
  const { width, height } = dimensions;
  let svg = '';
  
  switch (rhythm) {
    case 'regular':
      for (let x = 50; x < width; x += 50) {
        svg += `<circle cx="${x}" cy="${height - 20}" r="3" fill="rgba(100,100,255,0.5)"/>`;
      }
      break;
    case 'alternating':
      for (let x = 50; x < width; x += 80) {
        svg += `<circle cx="${x}" cy="${height - 20}" r="3" fill="rgba(100,100,255,0.5)"/>`;
        svg += `<rect x="${x + 40}" y="${height - 23}" width="6" height="6" fill="rgba(255,100,100,0.5)"/>`;
      }
      break;
    case 'progressive':
      for (let i = 0; i < 10; i++) {
        const size = 3 + i * 2;
        svg += `<circle cx="${50 + i * 60}" cy="${height - 20}" r="${size}" fill="rgba(100,100,255,${0.3 + i * 0.05})"/>`;
      }
      break;
    case 'flowing':
      svg += `<path d="M 0,${height-20} Q ${width*0.25},${height-40} ${width*0.5},${height-20} T ${width},${height-20}" stroke="rgba(100,100,255,0.5)" stroke-width="2" fill="none"/>`;
      break;
  }
  
  return `<g class="rhythm-pattern">${svg}</g>`;
}

function generateLeadingLinesOverlay(leadingLine: string, dimensions: any): string {
  const { width, height } = dimensions;
  let svg = '';
  
  switch (leadingLine) {
    case 'converging':
      svg += `
        <line x1="0" y1="0" x2="${width/2}" y2="${height/2}" stroke="rgba(255,165,0,0.5)" stroke-width="2" marker-end="url(#arrowhead)"/>
        <line x1="${width}" y1="0" x2="${width/2}" y2="${height/2}" stroke="rgba(255,165,0,0.5)" stroke-width="2" marker-end="url(#arrowhead)"/>
        <line x1="0" y1="${height}" x2="${width/2}" y2="${height/2}" stroke="rgba(255,165,0,0.5)" stroke-width="2" marker-end="url(#arrowhead)"/>
        <line x1="${width}" y1="${height}" x2="${width/2}" y2="${height/2}" stroke="rgba(255,165,0,0.5)" stroke-width="2" marker-end="url(#arrowhead)"/>
      `;
      break;
    case 'curved':
      svg += `
        <path d="M 0,${height*0.7} Q ${width*0.3},${height*0.3} ${width*0.5},${height*0.5} T ${width},${height*0.3}" stroke="rgba(255,165,0,0.5)" stroke-width="2" fill="none"/>
      `;
      break;
    case 'vertical':
      svg += `
        <line x1="${width*0.3}" y1="${height}" x2="${width*0.3}" y2="0" stroke="rgba(255,165,0,0.5)" stroke-width="2" marker-end="url(#arrowhead)"/>
        <line x1="${width*0.7}" y1="${height}" x2="${width*0.7}" y2="0" stroke="rgba(255,165,0,0.5)" stroke-width="2" marker-end="url(#arrowhead)"/>
      `;
      break;
    case 'horizontal':
      svg += `
        <line x1="0" y1="${height*0.5}" x2="${width}" y2="${height*0.5}" stroke="rgba(255,165,0,0.5)" stroke-width="2" marker-end="url(#arrowhead)"/>
      `;
      break;
  }
  
  return `<g class="leading-lines">${svg}</g>`;
}

function generatePlacementGuide(focalPoints: any[], balance: string, dimensions: any): any[] {
  const { width, height } = dimensions;
  
  return focalPoints.map((point, i) => ({
    index: i + 1,
    position: { x: point.x, y: point.y },
    relativePosition: {
      x: Math.round(point.x / width * 100) + '%',
      y: Math.round(point.y / height * 100) + '%'
    },
    recommendation: getPlacementRecommendation(point, dimensions),
    weight: balance === 'symmetrical' ? 'equal' : i === 0 ? 'primary' : 'secondary'
  }));
}

function getPlacementRecommendation(point: any, dimensions: any): string {
  const { width, height } = dimensions;
  const relativeX = point.x / width;
  const relativeY = point.y / height;
  
  if (relativeY < 0.4) return 'Идеально для удалённых объектов или неба';
  if (relativeY > 0.7) return 'Подходит для переднего плана и деталей';
  if (relativeX < 0.4 || relativeX > 0.6) return 'Хорошо для ключевых персонажей';
  return 'Центральная зона — для главного действия';
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-composition',
    name: 'Композиция и ритм',
    specialization: 'Правила композиции и визуальный ритм',
    capabilities: [
      'Правила третей',
      'Золотое сечение',
      'Золотая спираль',
      'Центральная композиция',
      'Диагональная композиция',
      'Визуальный ритм',
      'Направляющие линии',
      'Баланс'
    ],
    rules: Object.keys(COMPOSITION_RULES),
    rhythms: Object.keys(RHYTHM_PATTERNS),
    leadingLines: Object.keys(LEADING_LINES),
    balanceTypes: Object.keys(BALANCE_TYPES),
    status: 'ready'
  });
}
