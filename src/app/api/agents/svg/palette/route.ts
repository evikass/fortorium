import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Цветовая палитра (Color Palette Artist)
 * Отвечает за цветовую гармонию, контрасты, насыщенность и общую цветовую схему
 */

// Цветовые гармонии
const COLOR_HARMONIES: Record<string, any> = {
  'complementary': {
    name: 'Комплементарная',
    description: 'Противоположные цвета на цветовом круге',
    generate: (base: string) => [base, rotateHue(base, 180)]
  },
  'analogous': {
    name: 'Аналоговая',
    description: 'Соседние цвета на цветовом круге',
    generate: (base: string) => [rotateHue(base, -30), base, rotateHue(base, 30)]
  },
  'triadic': {
    name: 'Триада',
    description: 'Три равноудалённых цвета',
    generate: (base: string) => [base, rotateHue(base, 120), rotateHue(base, 240)]
  },
  'split-complementary': {
    name: 'Раздельная комплементарная',
    description: 'Базовый + два соседа комплементарного',
    generate: (base: string) => [base, rotateHue(base, 150), rotateHue(base, 210)]
  },
  'tetradic': {
    name: 'Тетрада',
    description: 'Четыре равноудалённых цвета',
    generate: (base: string) => [base, rotateHue(base, 90), rotateHue(base, 180), rotateHue(base, 270)]
  }
};

// Цветовые схемы по стилю
const STYLE_PALETTES: Record<string, any> = {
  'ghibli': {
    name: 'Studio Ghibli',
    base: '#87CEEB',
    accent: '#F4D03F',
    neutrals: ['#F5F5DC', '#D2B48C', '#8FBC8F'],
    characteristics: ['пастельные', 'тёплые', 'природные', 'мягкие']
  },
  'disney': {
    name: 'Disney Classic',
    base: '#4169E1',
    accent: '#FFD700',
    neutrals: ['#FFFFFF', '#E8E8E8', '#708090'],
    characteristics: ['яркие', 'насыщенные', 'сказочные', 'контрастные']
  },
  'pixar': {
    name: 'Pixar Modern',
    base: '#FF6B6B',
    accent: '#4ECDC4',
    neutrals: ['#F7F7F7', '#C9D6DF', '#95A5A6'],
    characteristics: ['современные', 'динамичные', 'фотореалистичные', 'сбалансированные']
  },
  'anime': {
    name: 'Anime Style',
    base: '#FF69B4',
    accent: '#00CED1',
    neutrals: ['#FFF0F5', '#E6E6FA', '#D3D3D3'],
    characteristics: ['стилизованные', 'контрастные', 'выразительные', 'динамичные']
  }
};

// Психология цвета
const COLOR_PSYCHOLOGY: Record<string, any> = {
  'радость': { colors: ['#FFD700', '#FFA500', '#FF6347'], warmth: 0.8, saturation: 1.2 },
  'спокойствие': { colors: ['#87CEEB', '#98FB98', '#E0FFFF'], warmth: 0.0, saturation: 0.8 },
  'напряжение': { colors: ['#8B0000', '#4A0000', '#2F4F4F'], warmth: 0.3, saturation: 1.0 },
  'таинственность': { colors: ['#4B0082', '#2E0854', '#191970'], warmth: -0.2, saturation: 0.9 },
  'волшебство': { colors: ['#9370DB', '#DDA0DD', '#E6E6FA'], warmth: 0.2, saturation: 1.1 },
  'грусть': { colors: ['#4682B4', '#5F9EA0', '#708090'], warmth: -0.1, saturation: 0.7 },
  'энергия': { colors: ['#FF4500', '#FF6347', '#FFA07A'], warmth: 0.9, saturation: 1.3 },
  'романтика': { colors: ['#FFB6C1', '#FF69B4', '#FFC0CB'], warmth: 0.5, saturation: 1.0 }
};

// Временные схемы
const TIME_PALETTES: Record<string, any> = {
  'утро': { 
    baseAdjust: { brightness: 1.1, warmth: 0.2, saturation: 0.9 },
    skyTones: ['#FFE4B5', '#FFDEAD', '#F5DEB3'],
    shadowTone: '#4A4A6A'
  },
  'день': { 
    baseAdjust: { brightness: 1.0, warmth: 0.0, saturation: 1.0 },
    skyTones: ['#87CEEB', '#ADD8E6', '#B0E0E6'],
    shadowTone: '#696969'
  },
  'вечер': { 
    baseAdjust: { brightness: 0.9, warmth: 0.4, saturation: 1.1 },
    skyTones: ['#FF8C00', '#FF7F50', '#FF6347'],
    shadowTone: '#2F2F4F'
  },
  'ночь': { 
    baseAdjust: { brightness: 0.3, warmth: -0.2, saturation: 0.8 },
    skyTones: ['#191970', '#000080', '#00008B'],
    shadowTone: '#0A0A1A'
  },
  'рассвет': { 
    baseAdjust: { brightness: 0.85, warmth: 0.5, saturation: 1.0 },
    skyTones: ['#FFB6C1', '#FFA07A', '#FFD700'],
    shadowTone: '#3D3D5C'
  },
  'закат': { 
    baseAdjust: { brightness: 0.75, warmth: 0.6, saturation: 1.2 },
    skyTones: ['#FF4500', '#DC143C', '#8B0000'],
    shadowTone: '#1A1A2E'
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { style, mood, timeOfDay, harmony, customBase } = body;

    // Получаем базовую палитру стиля
    const stylePalette = STYLE_PALETTES[style] || STYLE_PALETTES['ghibli'];
    
    // Получаем психологию настроения
    const moodPalette = COLOR_PSYCHOLOGY[mood] || COLOR_PSYCHOLOGY['радость'];
    
    // Получаем временные корректировки
    const timePalette = TIME_PALETTES[timeOfDay] || TIME_PALETTES['день'];
    
    // Генерируем цветовую гармонию
    const baseColor = customBase || stylePalette.base;
    const harmonyType = harmony || 'analogous';
    const harmonyColors = COLOR_HARMONIES[harmonyType]?.generate(baseColor) || [baseColor];
    
    // Создаём полную палитру
    const fullPalette = generateFullPalette(stylePalette, moodPalette, timePalette, harmonyColors);
    
    // Генерируем SVG с цветовыми образцами
    const paletteSVG = generatePaletteSVG(fullPalette, harmonyType);

    return NextResponse.json({
      success: true,
      agent: 'svg-palette',
      specialization: 'Цветовая палитра',
      
      svg: paletteSVG,
      
      palette: fullPalette,
      
      harmony: {
        type: harmonyType,
        name: COLOR_HARMONIES[harmonyType]?.name,
        colors: harmonyColors
      },
      
      style: stylePalette,
      mood: moodPalette,
      time: timePalette,
      
      css: generateCSSVariables(fullPalette),
      
      message: `Палитра создана (${style}, ${mood}, ${timeOfDay})`
    });

  } catch (error) {
    console.error('[SVG-Palette] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

function generateFullPalette(
  stylePalette: any, 
  moodPalette: any, 
  timePalette: any, 
  harmonyColors: string[]
): any {
  const baseAdjust = timePalette.baseAdjust;
  
  return {
    primary: {
      main: adjustColorWithParams(stylePalette.base, baseAdjust),
      light: adjustColorWithParams(stylePalette.base, { ...baseAdjust, brightness: 1.3 }),
      dark: adjustColorWithParams(stylePalette.base, { ...baseAdjust, brightness: 0.7 })
    },
    secondary: {
      main: adjustColorWithParams(stylePalette.accent, baseAdjust),
      light: adjustColorWithParams(stylePalette.accent, { ...baseAdjust, brightness: 1.3 }),
      dark: adjustColorWithParams(stylePalette.accent, { ...baseAdjust, brightness: 0.7 })
    },
    neutral: stylePalette.neutrals.map((c: string) => adjustColorWithParams(c, baseAdjust)),
    harmony: harmonyColors.map((c: string) => adjustColorWithParams(c, baseAdjust)),
    mood: moodPalette.colors,
    sky: timePalette.skyTones,
    shadow: timePalette.shadowTone,
    
    // Специальные цвета
    special: {
      highlight: adjustColorWithParams('#FFFFFF', { brightness: 0.9 }),
      midtone: adjustColorWithParams(stylePalette.base, { ...baseAdjust, saturation: 0.7 }),
      shadow: adjustColorWithParams('#000000', { brightness: 0.3 }),
      ambient: adjustColorWithParams(moodPalette.colors[0], { saturation: 0.3, brightness: 1.5 })
    },
    
    // Градиенты
    gradients: {
      sky: [timePalette.skyTones[0], timePalette.skyTones[2]],
      ground: [stylePalette.neutrals[0], stylePalette.neutrals[2]],
      shadow: [timePalette.shadowTone, 'transparent']
    }
  };
}

function generatePaletteSVG(palette: any, harmonyType: string): string {
  const width = 800;
  const height = 400;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="palette-reference" data-agent="palette">
  <defs>
    <!-- Градиенты -->
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${palette.sky[0]}"/>
      <stop offset="100%" stop-color="${palette.sky[2]}"/>
    </linearGradient>
    
    <linearGradient id="groundGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${palette.gradients.ground[0]}"/>
      <stop offset="100%" stop-color="${palette.gradients.ground[1]}"/>
    </linearGradient>
    
    <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${palette.gradients.shadow[0]}"/>
      <stop offset="100%" stop-color="${palette.gradients.shadow[1]}"/>
    </linearGradient>
  </defs>
  
  <!-- Заголовок -->
  <text x="${width/2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">Цветовая палитра (${harmonyType})</text>
  
  <!-- Основные цвета -->
  <g transform="translate(50, 50)">
    <text x="0" y="0" font-size="12" fill="#666">Основные:</text>
    <rect x="0" y="10" width="60" height="40" fill="${palette.primary.main}" rx="4"/>
    <rect x="70" y="10" width="60" height="40" fill="${palette.primary.light}" rx="4"/>
    <rect x="140" y="10" width="60" height="40" fill="${palette.primary.dark}" rx="4"/>
    <text x="30" y="70" text-anchor="middle" font-size="8" fill="#999">Main</text>
    <text x="100" y="70" text-anchor="middle" font-size="8" fill="#999">Light</text>
    <text x="170" y="70" text-anchor="middle" font-size="8" fill="#999">Dark</text>
  </g>
  
  <!-- Вторичные цвета -->
  <g transform="translate(280, 50)">
    <text x="0" y="0" font-size="12" fill="#666">Акцентные:</text>
    <rect x="0" y="10" width="60" height="40" fill="${palette.secondary.main}" rx="4"/>
    <rect x="70" y="10" width="60" height="40" fill="${palette.secondary.light}" rx="4"/>
    <rect x="140" y="10" width="60" height="40" fill="${palette.secondary.dark}" rx="4"/>
  </g>
  
  <!-- Гармония -->
  <g transform="translate(50, 130)">
    <text x="0" y="0" font-size="12" fill="#666">Гармония (${harmonyType}):</text>
    ${palette.harmony.map((color: string, i: number) => 
      `<rect x="${i * 70}" y="10" width="60" height="40" fill="${color}" rx="4"/>`
    ).join('')}
  </g>
  
  <!-- Нейтральные -->
  <g transform="translate(50, 210)">
    <text x="0" y="0" font-size="12" fill="#666">Нейтральные:</text>
    ${palette.neutral.map((color: string, i: number) => 
      `<rect x="${i * 50}" y="10" width="40" height="30" fill="${color}" rx="4" stroke="#ddd"/>`
    ).join('')}
  </g>
  
  <!-- Настроение -->
  <g transform="translate(350, 210)">
    <text x="0" y="0" font-size="12" fill="#666">Настроение:</text>
    ${palette.mood.map((color: string, i: number) => 
      `<rect x="${i * 50}" y="10" width="40" height="30" fill="${color}" rx="4"/>`
    ).join('')}
  </g>
  
  <!-- Градиенты -->
  <g transform="translate(50, 290)">
    <text x="0" y="0" font-size="12" fill="#666">Градиенты:</text>
    <rect x="0" y="10" width="200" height="30" fill="url(#skyGrad)" rx="4"/>
    <text x="100" y="60" text-anchor="middle" font-size="10" fill="#999">Небо</text>
    
    <rect x="220" y="10" width="200" height="30" fill="url(#groundGrad)" rx="4"/>
    <text x="320" y="60" text-anchor="middle" font-size="10" fill="#999">Земля</text>
    
    <rect x="440" y="10" width="200" height="30" fill="url(#shadowGrad)" rx="4"/>
    <text x="540" y="60" text-anchor="middle" font-size="10" fill="#999">Тень</text>
  </g>
  
  <!-- Специальные -->
  <g transform="translate(550, 50)">
    <text x="0" y="0" font-size="12" fill="#666">Специальные:</text>
    <rect x="0" y="10" width="30" height="30" fill="${palette.special.highlight}" rx="4" stroke="#ddd"/>
    <rect x="40" y="10" width="30" height="30" fill="${palette.special.shadow}" rx="4"/>
    <rect x="80" y="10" width="30" height="30" fill="${palette.special.ambient}" rx="4"/>
    <rect x="120" y="10" width="30" height="30" fill="${palette.shadow}" rx="4"/>
  </g>
</svg>`;
}

function generateCSSVariables(palette: any): string {
  return `:root {
  /* Primary */
  --color-primary: ${palette.primary.main};
  --color-primary-light: ${palette.primary.light};
  --color-primary-dark: ${palette.primary.dark};
  
  /* Secondary */
  --color-secondary: ${palette.secondary.main};
  --color-secondary-light: ${palette.secondary.light};
  --color-secondary-dark: ${palette.secondary.dark};
  
  /* Neutrals */
  --color-neutral-1: ${palette.neutral[0]};
  --color-neutral-2: ${palette.neutral[1]};
  --color-neutral-3: ${palette.neutral[2]};
  
  /* Special */
  --color-highlight: ${palette.special.highlight};
  --color-shadow: ${palette.special.shadow};
  --color-ambient: ${palette.special.ambient};
  --color-sky-shadow: ${palette.shadow};
  
  /* Gradients */
  --gradient-sky: linear-gradient(180deg, ${palette.gradients.sky[0]}, ${palette.gradients.sky[1]});
  --gradient-ground: linear-gradient(180deg, ${palette.gradients.ground[0]}, ${palette.gradients.ground[1]});
}`;
}

function adjustColorWithParams(hexColor: string, params: { brightness?: number; warmth?: number; saturation?: number }): string {
  let r = parseInt(hexColor.slice(1, 3), 16);
  let g = parseInt(hexColor.slice(3, 5), 16);
  let b = parseInt(hexColor.slice(5, 7), 16);
  
  // Brightness
  if (params.brightness) {
    r = Math.min(255, Math.max(0, Math.round(r * params.brightness)));
    g = Math.min(255, Math.max(0, Math.round(g * params.brightness)));
    b = Math.min(255, Math.max(0, Math.round(b * params.brightness)));
  }
  
  // Warmth
  if (params.warmth) {
    r = Math.min(255, Math.max(0, r + Math.round(params.warmth * 50)));
    b = Math.min(255, Math.max(0, b - Math.round(params.warmth * 30)));
  }
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function rotateHue(hexColor: string, degrees: number): string {
  // Упрощённая функция поворота оттенка
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Сдвигаем RGB значения для имитации поворота оттенка
  const shift = degrees / 60;
  let newR = r, newG = g, newB = b;
  
  if (shift >= 1 && shift < 2) {
    newR = Math.min(255, r + 50);
    newG = Math.min(255, g + 30);
  } else if (shift >= 2 && shift < 3) {
    newG = Math.min(255, g + 50);
    newB = Math.max(0, b - 30);
  } else if (shift >= 3 && shift < 4) {
    newR = Math.max(0, r - 50);
    newG = Math.min(255, g + 20);
  } else if (shift >= 4 && shift < 5) {
    newR = Math.max(0, r - 30);
    newB = Math.min(255, b + 50);
  } else if (shift >= 5 && shift < 6) {
    newR = Math.min(255, r + 30);
    newB = Math.min(255, b + 30);
  }
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-palette',
    name: 'Цветовая палитра',
    specialization: 'Цветовая гармония и схема',
    capabilities: [
      'Генерация цветовых гармоний',
      'Стилевые цветовые схемы',
      'Психология цвета для настроения',
      'Временные цветовые корректировки',
      'CSS переменные',
      'Градиенты'
    ],
    harmonies: Object.keys(COLOR_HARMONIES),
    styles: Object.keys(STYLE_PALETTES),
    moods: Object.keys(COLOR_PSYCHOLOGY),
    times: Object.keys(TIME_PALETTES),
    status: 'ready'
  });
}
