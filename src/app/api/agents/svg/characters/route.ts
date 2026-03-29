import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Персонажи в сцене (Characters Artist)
 * Отвечает за создание персонажей, их позы, эмоции, пропорции
 */

// Шаблоны персонажей по стилям
const CHARACTER_STYLES: Record<string, any> = {
  'ghibli': {
    name: 'Studio Ghibli',
    proportions: { head: 0.25, body: 0.45, legs: 0.3 },
    features: ['крупные глаза', 'мягкие черты', 'выразительные позы'],
    colors: ['природные', 'пастельные']
  },
  'disney': {
    name: 'Disney Classic',
    proportions: { head: 0.2, body: 0.45, legs: 0.35 },
    features: ['выразительные глаза', 'театральные позы', 'чёткие силуэты'],
    colors: ['яркие', 'насыщенные']
  },
  'anime': {
    name: 'Anime',
    proportions: { head: 0.22, body: 0.43, legs: 0.35 },
    features: ['большие глаза', 'стилизованные волосы', 'динамичные позы'],
    colors: ['контрастные', 'стилизованные']
  },
  'pixar': {
    name: 'Pixar 3D',
    proportions: { head: 0.23, body: 0.44, legs: 0.33 },
    features: ['объёмные формы', 'детализированные лица', 'реалистичные пропорции'],
    colors: ['естественные', 'освещённые']
  }
};

// Эмоции
const EMOTIONS: Record<string, any> = {
  'радость': { eyes: 'open', mouth: 'smile', eyebrows: 'raised', color: '#FFD700' },
  'грусть': { eyes: 'half-closed', mouth: 'frown', eyebrows: 'drooped', color: '#6495ED' },
  'гнев': { eyes: 'narrowed', mouth: 'grimace', eyebrows: 'furrowed', color: '#FF4500' },
  'удивление': { eyes: 'wide', mouth: 'open', eyebrows: 'raised-high', color: '#9370DB' },
  'страх': { eyes: 'wide-small', mouth: 'open-small', eyebrows: 'raised-inner', color: '#808080' },
  'нейтральный': { eyes: 'normal', mouth: 'closed', eyebrows: 'neutral', color: '#A0A0A0' }
};

// Позы
const POSES: Record<string, any> = {
  'стоя': { legs: 'straight', arms: 'down', body: 'upright' },
  'сидя': { legs: 'bent', arms: 'relaxed', body: 'leaning' },
  'идёт': { legs: 'stepping', arms: 'swinging', body: 'forward' },
  'бежит': { legs: 'running', arms: 'pumping', body: 'leaning-forward' },
  'прыгает': { legs: 'tucked', arms: 'up', body: 'airborne' },
  'присел': { legs: 'crouched', arms: 'ready', body: 'low' },
  'лежит': { legs: 'extended', arms: 'relaxed', body: 'horizontal' },
  'жест': { legs: 'stance', arms: 'gesturing', body: 'engaged' }
};

// Роли персонажей
const CHARACTER_ROLES: Record<string, any> = {
  'protagonist': {
    name: 'Главный герой',
    design: 'detiled',
    colors: 'vibrant',
    size: 'medium'
  },
  'supporting': {
    name: 'Второстепенный',
    design: 'simplified',
    colors: 'muted',
    size: 'medium'
  },
  'antagonist': {
    name: 'Антагонист',
    design: 'sharp',
    colors: 'dark',
    size: 'large'
  },
  'background': {
    name: 'Фоновый',
    design: 'minimal',
    colors: 'neutral',
    size: 'small'
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      characters = [],
      style = 'ghibli',
      dimensions = { width: 1024, height: 576 }
    } = body;
    
    const { width, height } = dimensions;
    
    // Получаем стиль
    const styleData = CHARACTER_STYLES[style] || CHARACTER_STYLES['ghibli'];
    
    // Генерируем персонажей
    const charactersData = characters.map((char: any, i: number) => {
      const role = CHARACTER_ROLES[char.role] || CHARACTER_ROLES['supporting'];
      const emotion = EMOTIONS[char.emotion] || EMOTIONS['нейтральный'];
      const pose = POSES[char.pose] || POSES['стоя'];
      
      const position = calculateCharacterPosition(i, characters.length, dimensions, char.role);
      const svg = generateCharacterSVG(char, styleData, emotion, pose, position);
      
      return {
        name: char.name,
        role: role.name,
        emotion: char.emotion,
        pose: char.pose,
        svg,
        position,
        scale: position.scale
      };
    });
    
    // Общий SVG
    const charactersSVG = generateCharactersSVG(charactersData, style, dimensions);

    return NextResponse.json({
      success: true,
      agent: 'svg-characters',
      specialization: 'Персонажи в сцене',
      
      svg: charactersSVG,
      
      characters: charactersData,
      
      style: styleData,
      
      message: `${charactersData.length} персонажей создано`
    });

  } catch (error) {
    console.error('[SVG-Characters] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

function calculateCharacterPosition(
  index: number,
  total: number,
  dimensions: any,
  role: string
): any {
  const { width, height } = dimensions;
  
  // Позиционирование по роли
  const baseY = height * 0.7; // Базовая линия земли
  const scale = role === 'protagonist' ? 1.2 : role === 'background' ? 0.6 : 0.9;
  
  // Распределение по горизонтали
  const spacing = width / (total + 1);
  const x = spacing * (index + 1);
  
  // Вариация по Y для глубины
  const y = baseY - (scale - 0.8) * 50;
  
  return { x, y, scale };
}

function generateCharacterSVG(
  character: any,
  style: any,
  emotion: any,
  pose: any,
  position: any
): string {
  const scale = position.scale * 100; // Высота персонажа в пикселях
  const { proportions } = style;
  
  const headSize = scale * proportions.head;
  const bodySize = scale * proportions.body;
  const legsSize = scale * proportions.legs;
  
  // Базовый цвет персонажа
  const skinColor = '#FFE4C4';
  const hairColor = character.hairColor || '#4A3728';
  const clothesColor = character.clothesColor || '#4169E1';
  
  // Генерируем части тела
  const head = generateHeadSVG(headSize, emotion, hairColor, style);
  const body = generateBodySVG(bodySize, pose, clothesColor);
  const legs = generateLegsSVG(legsSize, pose);
  const arms = generateArmsSVG(bodySize * 0.7, pose);

  return `<g class="character" data-name="${character.name}" data-role="${character.role}">
  <!-- Тень -->
  <ellipse cx="0" cy="${legsSize * 0.1}" rx="${scale * 0.15}" ry="${scale * 0.03}" fill="rgba(0,0,0,0.2)"/>
  
  <!-- Ноги -->
  <g class="legs" transform="translate(0, ${-legsSize * 0.1})">
    ${legs}
  </g>
  
  <!-- Тело -->
  <g class="body" transform="translate(0, ${-legsSize - bodySize * 0.5})">
    ${body}
  </g>
  
  <!-- Руки -->
  <g class="arms" transform="translate(0, ${-legsSize - bodySize * 0.3})">
    ${arms}
  </g>
  
  <!-- Голова -->
  <g class="head" transform="translate(0, ${-legsSize - bodySize - headSize * 0.3})">
    ${head}
  </g>
</g>`;
}

function generateHeadSVG(size: number, emotion: any, hairColor: string, style: any): string {
  const halfSize = size / 2;
  
  // Глаза в зависимости от эмоции
  let eyesSVG = '';
  const eyeY = size * 0.35;
  const eyeSpacing = size * 0.2;
  
  switch (emotion.eyes) {
    case 'wide':
      eyesSVG = `
        <ellipse cx="${-eyeSpacing}" cy="${eyeY}" rx="${size * 0.12}" ry="${size * 0.15}" fill="white"/>
        <circle cx="${-eyeSpacing}" cy="${eyeY}" r="${size * 0.08}" fill="#333"/>
        <ellipse cx="${eyeSpacing}" cy="${eyeY}" rx="${size * 0.12}" ry="${size * 0.15}" fill="white"/>
        <circle cx="${eyeSpacing}" cy="${eyeY}" r="${size * 0.08}" fill="#333"/>
      `;
      break;
    case 'narrowed':
      eyesSVG = `
        <ellipse cx="${-eyeSpacing}" cy="${eyeY}" rx="${size * 0.1}" ry="${size * 0.05}" fill="#333"/>
        <ellipse cx="${eyeSpacing}" cy="${eyeY}" rx="${size * 0.1}" ry="${size * 0.05}" fill="#333"/>
      `;
      break;
    default:
      eyesSVG = `
        <ellipse cx="${-eyeSpacing}" cy="${eyeY}" rx="${size * 0.1}" ry="${size * 0.12}" fill="white"/>
        <circle cx="${-eyeSpacing}" cy="${eyeY}" r="${size * 0.06}" fill="#333"/>
        <ellipse cx="${eyeSpacing}" cy="${eyeY}" rx="${size * 0.1}" ry="${size * 0.12}" fill="white"/>
        <circle cx="${eyeSpacing}" cy="${eyeY}" r="${size * 0.06}" fill="#333"/>
      `;
  }
  
  // Рот
  let mouthSVG = '';
  const mouthY = size * 0.6;
  
  switch (emotion.mouth) {
    case 'smile':
      mouthSVG = `<path d="M${-size * 0.15},${mouthY} Q0,${mouthY + size * 0.15} ${size * 0.15},${mouthY}" stroke="#333" stroke-width="2" fill="none"/>`;
      break;
    case 'frown':
      mouthSVG = `<path d="M${-size * 0.15},${mouthY + size * 0.05} Q0,${mouthY - size * 0.1} ${size * 0.15},${mouthY + size * 0.05}" stroke="#333" stroke-width="2" fill="none"/>`;
      break;
    case 'open':
      mouthSVG = `<ellipse cx="0" cy="${mouthY}" rx="${size * 0.1}" ry="${size * 0.08}" fill="#333"/>`;
      break;
    default:
      mouthSVG = `<line x1="${-size * 0.1}" y1="${mouthY}" x2="${size * 0.1}" y2="${mouthY}" stroke="#333" stroke-width="2"/>`;
  }

  return `
  <!-- Лицо -->
  <ellipse cx="0" cy="0" rx="${halfSize * 0.9}" ry="${halfSize}" fill="#FFE4C4"/>
  
  <!-- Волосы -->
  <ellipse cx="0" cy="${-size * 0.15}" rx="${halfSize}" ry="${halfSize * 0.7}" fill="${hairColor}"/>
  
  <!-- Глаза -->
  ${eyesSVG}
  
  <!-- Нос -->
  <ellipse cx="0" cy="${size * 0.45}" rx="${size * 0.03}" ry="${size * 0.05}" fill="#DEB887"/>
  
  <!-- Рот -->
  ${mouthSVG}
  
  <!-- Брови -->
  <line x1="${-size * 0.2}" y1="${size * 0.2}" x2="${-size * 0.08}" y2="${size * 0.22}" stroke="${hairColor}" stroke-width="2"/>
  <line x1="${size * 0.08}" y1="${size * 0.22}" x2="${size * 0.2}" y2="${size * 0.2}" stroke="${hairColor}" stroke-width="2"/>
  `;
}

function generateBodySVG(size: number, pose: any, clothesColor: string): string {
  return `
  <ellipse cx="0" cy="0" rx="${size * 0.25}" ry="${size * 0.4}" fill="${clothesColor}"/>
  <ellipse cx="0" cy="${-size * 0.25}" rx="${size * 0.2}" ry="${size * 0.15}" fill="${clothesColor}" opacity="0.8"/>
  `;
}

function generateLegsSVG(size: number, pose: any): string {
  const legSpacing = size * 0.15;
  
  if (pose.legs === 'stepping' || pose.legs === 'running') {
    return `
      <rect x="${-legSpacing - size * 0.08}" y="0" width="${size * 0.12}" height="${size * 0.9}" fill="#4A4A4A" rx="5" transform="rotate(-15)"/>
      <rect x="${legSpacing - size * 0.04}" y="0" width="${size * 0.12}" height="${size * 0.9}" fill="#4A4A4A" rx="5" transform="rotate(15)"/>
    `;
  }
  
  return `
    <rect x="${-legSpacing - size * 0.06}" y="0" width="${size * 0.12}" height="${size * 0.85}" fill="#4A4A4A" rx="5"/>
    <rect x="${legSpacing - size * 0.06}" y="0" width="${size * 0.12}" height="${size * 0.85}" fill="#4A4A4A" rx="5"/>
  `;
}

function generateArmsSVG(size: number, pose: any): string {
  const armLength = size * 0.8;
  
  if (pose.arms === 'gesturing') {
    return `
      <rect x="${-size * 0.35}" y="0" width="${size * 0.1}" height="${armLength}" fill="#FFE4C4" rx="5" transform="rotate(-60)"/>
      <rect x="${size * 0.25}" y="0" width="${size * 0.1}" height="${armLength}" fill="#FFE4C4" rx="5" transform="rotate(30)"/>
    `;
  }
  
  if (pose.arms === 'up') {
    return `
      <rect x="${-size * 0.2}" y="${-armLength * 0.3}" width="${size * 0.1}" height="${armLength}" fill="#FFE4C4" rx="5" transform="rotate(-120)"/>
      <rect x="${size * 0.1}" y="${-armLength * 0.3}" width="${size * 0.1}" height="${armLength}" fill="#FFE4C4" rx="5" transform="rotate(120)"/>
    `;
  }
  
  return `
    <rect x="${-size * 0.3}" y="0" width="${size * 0.1}" height="${armLength}" fill="#FFE4C4" rx="5" transform="rotate(10)"/>
    <rect x="${size * 0.2}" y="0" width="${size * 0.1}" height="${armLength}" fill="#FFE4C4" rx="5" transform="rotate(-10)"/>
  `;
}

function generateCharactersSVG(
  charactersData: any[],
  style: string,
  dimensions: any
): string {
  const { width, height } = dimensions;
  
  const charactersContent = charactersData.map((char, i) => {
    return `<g class="character-container" transform="translate(${char.position.x}, ${char.position.y}) scale(${char.position.scale})">
      ${char.svg}
    </g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="characters-layer" data-agent="characters">
  <defs>
    <filter id="characterShadow">
      <feDropShadow dx="3" dy="3" stdDeviation="2" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Персонажи -->
  <g class="characters-container" filter="url(#characterShadow)">
    ${charactersContent}
  </g>
  
  <!-- Легенда -->
  <g class="legend" transform="translate(10, 10)">
    <text font-size="12" fill="rgba(0,0,0,0.6)">Персонажей: ${charactersData.length}</text>
  </g>
</svg>`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-characters',
    name: 'Персонажи в сцене',
    specialization: 'Создание персонажей',
    capabilities: [
      'Пропорции по стилям',
      'Эмоции и выражения',
      'Позы и жесты',
      'Роли персонажей',
      'Одежда и аксессуары'
    ],
    styles: Object.keys(CHARACTER_STYLES),
    emotions: Object.keys(EMOTIONS),
    poses: Object.keys(POSES),
    roles: Object.keys(CHARACTER_ROLES),
    status: 'ready'
  });
}
