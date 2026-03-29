import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Перспектива и ракурс (Perspective Artist)
 * Отвечает за линейную перспективу, глубину, точку схода, ракурс
 */

// Типы перспективы
const PERSPECTIVE_TYPES: Record<string, any> = {
  'one-point': {
    name: 'Одноточечная',
    description: 'Одна точка схода на линии горизонта',
    vanishingPoints: 1
  },
  'two-point': {
    name: 'Двухточечная',
    description: 'Две точки схода для углового вида',
    vanishingPoints: 2
  },
  'three-point': {
    name: 'Трёхточечная',
    description: 'Три точки для высокого/низкого ракурса',
    vanishingPoints: 3
  },
  'atmospheric': {
    name: 'Воздушная',
    description: 'Уменьшение контраста с расстоянием',
    vanishingPoints: 0
  },
  'isometric': {
    name: 'Изометрическая',
    description: 'Без точки схода, параллельные линии',
    vanishingPoints: 0
  }
};

// Ракурсы
const CAMERA_ANGLES: Record<string, any> = {
  'eye-level': { name: 'На уровне глаз', height: 0.5, drama: 'low', description: 'Нейтральный ракурс' },
  'low-angle': { name: 'Нижний ракурс', height: 0.8, drama: 'high', description: 'Герой выглядит величественно' },
  'high-angle': { name: 'Верхний ракурс', height: 0.2, drama: 'medium', description: 'Объект выглядит маленьким' },
  'birds-eye': { name: 'С высоты птичьего полёта', height: 0.05, drama: 'high', description: 'Панорамный вид сверху' },
  'worms-eye': { name: 'С земли', height: 0.95, drama: 'very-high', description: 'Драматичный вид снизу' },
  'dutch-angle': { name: 'Голландский угол', height: 0.5, tilt: 15, drama: 'high', description: 'Наклон для напряжения' }
};

// Глубина кадра
const DEPTH_ZONES: Record<string, any> = {
  'foreground': { name: 'Передний план', z: 0, scale: 1.2, blur: 0, opacity: 1 },
  'midground': { name: 'Средний план', z: 0.5, scale: 1.0, blur: 0, opacity: 0.95 },
  'background': { name: 'Задний план', z: 1.0, scale: 0.8, blur: 2, opacity: 0.8 },
  'far-distance': { name: 'Дальняя дистанция', z: 1.5, scale: 0.6, blur: 5, opacity: 0.6 }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      perspectiveType = 'one-point',
      cameraAngle = 'eye-level',
      horizonLine = 0.5,
      dimensions = { width: 1024, height: 576 }
    } = body;
    
    const { width, height } = dimensions;
    
    // Получаем настройки перспективы
    const perspective = PERSPECTIVE_TYPES[perspectiveType] || PERSPECTIVE_TYPES['one-point'];
    const camera = CAMERA_ANGLES[cameraAngle] || CAMERA_ANGLES['eye-level'];
    
    // Рассчитываем точку(и) схода
    const vanishingPoints = calculateVanishingPoints(perspective, camera, dimensions, horizonLine);
    
    // Генерируем SVG перспективной сетки
    const perspectiveSVG = generatePerspectiveSVG(
      perspective,
      camera,
      vanishingPoints,
      dimensions,
      horizonLine
    );
    
    // Генерируем глубинные зоны
    const depthZones = generateDepthZones(dimensions);

    return NextResponse.json({
      success: true,
      agent: 'svg-perspective',
      specialization: 'Перспектива и ракурс',
      
      svg: perspectiveSVG,
      
      perspective: {
        type: perspective,
        vanishingPoints
      },
      
      camera: {
        angle: camera,
        horizonLine: horizonLine * height
      },
      
      depthZones,
      
      transformMatrix: calculateTransformMatrix(vanishingPoints, dimensions),
      
      message: `Перспектива "${perspective.name}" создана (${camera.name})`
    });

  } catch (error) {
    console.error('[SVG-Perspective] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

function calculateVanishingPoints(
  perspective: any,
  camera: any,
  dimensions: any,
  horizonLine: number
): any[] {
  const { width, height } = dimensions;
  const horizonY = height * (camera.height || horizonLine);
  
  const points: any[] = [];
  
  switch (perspective.vanishingPoints) {
    case 1:
      // Одноточечная - центр на линии горизонта
      points.push({ id: 'VP1', x: width / 2, y: horizonY });
      break;
      
    case 2:
      // Двухточечная - по бокам
      points.push({ id: 'VP1', x: -width * 0.5, y: horizonY });
      points.push({ id: 'VP2', x: width * 1.5, y: horizonY });
      break;
      
    case 3:
      // Трёхточечная - две по бокам + одна сверху/снизу
      points.push({ id: 'VP1', x: -width * 0.5, y: horizonY });
      points.push({ id: 'VP2', x: width * 1.5, y: horizonY });
      points.push({ id: 'VP3', x: width / 2, y: camera.height > 0.5 ? -height : height * 2 });
      break;
  }
  
  return points;
}

function generatePerspectiveSVG(
  perspective: any,
  camera: any,
  vanishingPoints: any[],
  dimensions: any,
  horizonLine: number
): string {
  const { width, height } = dimensions;
  const horizonY = height * (camera.height || horizonLine);
  
  let gridLines = '';
  let vanishingPointsSVG = '';
  
  // Рисуем линии горизонта
  gridLines += `<line x1="0" y1="${horizonY}" x2="${width}" y2="${horizonY}" stroke="rgba(0,150,255,0.5)" stroke-width="2"/>`;
  
  // Рисуем линии перспективы
  if (perspective.vanishingPoints >= 1 && vanishingPoints.length > 0) {
    const vp = vanishingPoints[0];
    
    // Линии от точки схода
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI;
      const lineLength = Math.max(width, height) * 2;
      const endX = vp.x + Math.cos(angle) * lineLength;
      const endY = vp.y + Math.sin(angle) * lineLength;
      
      gridLines += `<line x1="${vp.x}" y1="${vp.y}" x2="${endX}" y2="${endY}" stroke="rgba(255,0,0,0.15)" stroke-width="1"/>`;
    }
  }
  
  // Для двухточечной перспективы
  if (perspective.vanishingPoints >= 2 && vanishingPoints.length >= 2) {
    const vp1 = vanishingPoints[0];
    const vp2 = vanishingPoints[1];
    
    // Линии от первой точки
    for (let i = 0; i < 10; i++) {
      const y = i * height / 10;
      gridLines += `<line x1="${vp1.x}" y1="${vp1.y}" x2="${vp2.x}" y2="${y}" stroke="rgba(255,100,0,0.1)" stroke-width="1"/>`;
    }
    
    // Линии от второй точки
    for (let i = 0; i < 10; i++) {
      const y = i * height / 10;
      gridLines += `<line x1="${vp2.x}" y1="${vp2.y}" x2="${vp1.x}" y2="${y}" stroke="rgba(0,100,255,0.1)" stroke-width="1"/>`;
    }
  }
  
  // Рисуем точки схода
  vanishingPoints.forEach((vp, i) => {
    const inView = vp.x >= 0 && vp.x <= width && vp.y >= 0 && vp.y <= height;
    vanishingPointsSVG += `
      <circle cx="${vp.x}" cy="${vp.y}" r="8" fill="${inView ? 'rgba(255,0,0,0.8)' : 'rgba(255,0,0,0.3)'}" stroke="white" stroke-width="2"/>
      <text x="${vp.x}" y="${vp.y - 15}" text-anchor="middle" font-size="12" fill="rgba(255,0,0,0.8)">${vp.id}</text>
    `;
  });
  
  // Ракурс - наклон для голландского угла
  const tiltTransform = camera.tilt 
    ? `transform="rotate(${camera.tilt} ${width/2} ${height/2})"` 
    : '';
  
  // Генерируем сетку пола
  const floorGrid = generateFloorGrid(vanishingPoints, dimensions, horizonY);
  
  // Глубинные маркеры
  const depthMarkers = generateDepthMarkers(dimensions);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="perspective-guide" data-agent="perspective" ${tiltTransform}>
  <defs>
    <marker id="perspectiveArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="rgba(0,150,255,0.8)"/>
    </marker>
  </defs>
  
  <!-- Глубинные маркеры -->
  <g class="depth-markers">
    ${depthMarkers}
  </g>
  
  <!-- Линии перспективы -->
  <g class="perspective-lines">
    ${gridLines}
  </g>
  
  <!-- Сетка пола -->
  <g class="floor-grid">
    ${floorGrid}
  </g>
  
  <!-- Точки схода -->
  <g class="vanishing-points">
    ${vanishingPointsSVG}
  </g>
  
  <!-- Линия горизонта с меткой -->
  <g class="horizon">
    <line x1="0" y1="${horizonY}" x2="${width}" y2="${horizonY}" stroke="rgba(0,150,255,0.5)" stroke-width="2"/>
    <text x="20" y="${horizonY - 10}" font-size="14" fill="rgba(0,150,255,0.8)">Линия горизонта</text>
  </g>
  
  <!-- Информация -->
  <g class="info" transform="translate(20, 30)">
    <text font-size="14" fill="rgba(0,0,0,0.6)">${perspective.name}</text>
    <text y="20" font-size="12" fill="rgba(0,0,0,0.4)">${camera.name}</text>
  </g>
</svg>`;
}

function generateFloorGrid(vanishingPoints: any[], dimensions: any, horizonY: number): string {
  const { width, height } = dimensions;
  
  if (vanishingPoints.length === 0) return '';
  
  const vp = vanishingPoints[0];
  let grid = '';
  
  // Горизонтальные линии пола
  for (let i = 0; i < 10; i++) {
    const y = horizonY + (height - horizonY) * (i / 10);
    const perspective = (y - horizonY) / (height - horizonY);
    const leftX = width / 2 - (width / 2) * perspective;
    const rightX = width / 2 + (width / 2) * perspective;
    
    grid += `<line x1="${leftX}" y1="${y}" x2="${rightX}" y2="${y}" stroke="rgba(100,100,100,0.2)" stroke-width="1"/>`;
  }
  
  // Вертикальные линии пола (к точке схода)
  for (let i = 0; i <= 10; i++) {
    const bottomX = width * (i / 10);
    grid += `<line x1="${bottomX}" y1="${height}" x2="${vp.x}" y2="${horizonY}" stroke="rgba(100,100,100,0.15)" stroke-width="1"/>`;
  }
  
  return grid;
}

function generateDepthMarkers(dimensions: any): string {
  const { width, height } = dimensions;
  
  return Object.entries(DEPTH_ZONES).map(([key, zone]: [string, any], i) => {
    const y = height * (0.2 + i * 0.25);
    return `
      <rect x="10" y="${y}" width="8" height="20" fill="rgba(0,100,255,0.3)" rx="2"/>
      <text x="25" y="${y + 15}" font-size="10" fill="rgba(0,0,0,0.5)">${zone.name}</text>
    `;
  }).join('');
}

function generateDepthZones(dimensions: any): any[] {
  const { width, height } = dimensions;
  
  return Object.entries(DEPTH_ZONES).map(([key, zone]: [string, any]) => ({
    id: key,
    name: zone.name,
    scale: zone.scale,
    blur: zone.blur,
    opacity: zone.opacity,
    yRange: {
      start: zone.z < 0.5 ? height * 0.6 : zone.z < 1 ? height * 0.3 : 0,
      end: zone.z < 0.5 ? height : zone.z < 1 ? height * 0.6 : height * 0.3
    }
  }));
}

function calculateTransformMatrix(vanishingPoints: any[], dimensions: any): string {
  if (vanishingPoints.length === 0) return 'matrix(1,0,0,1,0,0)';
  
  const vp = vanishingPoints[0];
  const { width, height } = dimensions;
  
  // Упрощённая матрица трансформации
  const scaleX = 1;
  const skewY = (vp.x - width / 2) / width * 0.5;
  
  return `matrix(${scaleX}, ${skewY}, 0, 1, 0, 0)`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-perspective',
    name: 'Перспектива и ракурс',
    specialization: 'Линейная перспектива и глубина',
    capabilities: [
      'Одно-, двух-, трёхточечная перспектива',
      'Воздушная перспектива',
      'Изометрия',
      'Ракурсы камеры',
      'Точки схода',
      'Глубинные зоны'
    ],
    perspectiveTypes: Object.keys(PERSPECTIVE_TYPES),
    cameraAngles: Object.keys(CAMERA_ANGLES),
    depthZones: Object.keys(DEPTH_ZONES),
    status: 'ready'
  });
}
