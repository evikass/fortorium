import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Типографика и шрифты (Typography & Fonts)
 * Отвечает за шрифты, текстовые блоки, заголовки, слоганы
 */

// Шрифтовые пары по стилям
const FONT_PAIRS: Record<string, any> = {
  'ghibli': {
    heading: { family: 'Georgia, serif', weight: 'bold', style: 'magical' },
    body: { family: 'Georgia, serif', weight: 'normal', style: 'warm' },
    accent: { family: 'Palatino, serif', weight: 'normal', style: 'elegant' },
    characteristics: ['мягкие засечки', 'теплота', 'сказочность']
  },
  'disney': {
    heading: { family: 'Impact, sans-serif', weight: 'bold', style: 'playful' },
    body: { family: 'Arial, sans-serif', weight: 'normal', style: 'clean' },
    accent: { family: 'Comic Sans MS, cursive', weight: 'bold', style: 'fun' },
    characteristics: ['игривость', 'читаемость', 'динамика']
  },
  'pixar': {
    heading: { family: 'Helvetica, sans-serif', weight: 'bold', style: 'modern' },
    body: { family: 'Helvetica, sans-serif', weight: 'normal', style: 'clean' },
    accent: { family: 'Futura, sans-serif', weight: 'bold', style: 'geometric' },
    characteristics: ['современность', 'геометрия', 'минимализм']
  },
  'anime': {
    heading: { family: 'Arial Black, sans-serif', weight: 'bold', style: 'dynamic' },
    body: { family: 'Verdana, sans-serif', weight: 'normal', style: 'sharp' },
    accent: { family: 'Impact, sans-serif', weight: 'bold', style: 'impactful' },
    characteristics: ['динамика', 'контраст', 'экспрессия']
  },
  'corporate': {
    heading: { family: 'Arial, sans-serif', weight: 'bold', style: 'professional' },
    body: { family: 'Arial, sans-serif', weight: 'normal', style: 'clean' },
    accent: { family: 'Georgia, serif', weight: 'bold', style: 'elegant' },
    characteristics: ['профессионализм', 'надёжность', 'ясность']
  },
  'creative': {
    heading: { family: 'Georgia, serif', weight: 'bold', style: 'artistic' },
    body: { family: 'Palatino, serif', weight: 'normal', style: 'elegant' },
    accent: { family: 'Courier New, monospace', weight: 'bold', style: 'creative' },
    characteristics: ['креативность', 'индивидуальность', 'смелость']
  }
};

// Типы текстовых блоков
const TEXT_TYPES: Record<string, any> = {
  'heading': { sizes: { xl: 64, lg: 48, md: 36, sm: 28 }, spacing: 1.2 },
  'subheading': { sizes: { xl: 36, lg: 28, md: 22, sm: 18 }, spacing: 1.3 },
  'body': { sizes: { xl: 20, lg: 18, md: 16, sm: 14 }, spacing: 1.5 },
  'caption': { sizes: { xl: 14, lg: 12, md: 11, sm: 10 }, spacing: 1.4 },
  'slogan': { sizes: { xl: 42, lg: 32, md: 26, sm: 20 }, spacing: 1.1 },
  'cta': { sizes: { xl: 28, lg: 22, md: 18, sm: 16 }, spacing: 1.2 }
};

// Цветовые схемы для текста
const TEXT_COLOR_SCHEMES: Record<string, string[]> = {
  'dark': ['#1a1a2e', '#2a2a3e', '#3a3a4e'],
  'light': ['#ffffff', '#f5f5f5', '#e0e0e0'],
  'accent': ['#ff6b6b', '#4ecdc4', '#ffe66d'],
  'brand': ['#6366f1', '#8b5cf6', '#a855f7']
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      style = 'ghibli',
      textType = 'heading',
      content = '',
      colors = 'dark',
      dimensions = { width: 1024, height: 576 },
      taskType = 'scene', // scene, banner, ad, social
      customText = {}
    } = body;
    
    const { width, height } = dimensions;
    const fontPair = FONT_PAIRS[style] || FONT_PAIRS['ghibli'];
    const textConfig = TEXT_TYPES[textType] || TEXT_TYPES['heading'];
    const textColor = TEXT_COLOR_SCHEMES[colors] || TEXT_COLOR_SCHEMES['dark'];
    
    // Генерируем SVG с типографикой
    const svg = generateTypographySVG({
      width,
      height,
      fontPair,
      textConfig,
      textColor,
      content,
      taskType,
      customText,
      style
    });

    return NextResponse.json({
      success: true,
      agent: 'svg-typography',
      specialization: 'Типографика и шрифты',
      
      svg: svg,
      
      fonts: {
        heading: fontPair.heading,
        body: fontPair.body,
        accent: fontPair.accent
      },
      
      sizes: textConfig.sizes,
      colors: textColor,
      
      recommendations: {
        headingSize: textConfig.sizes.lg,
        bodySize: textConfig.sizes.md,
        lineHeight: textConfig.spacing,
        contrast: 'WCAG AA'
      },
      
      message: `Типографика настроена (${style})`
    });

  } catch (error) {
    console.error('[SVG-Typography] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

function generateTypographySVG(config: any): string {
  const { width, height, fontPair, textConfig, textColor, content, taskType, customText, style } = config;
  
  // Примеры текстов для разных типов задач
  const sampleTexts: Record<string, any> = {
    'scene': {
      title: 'Название сцены',
      subtitle: 'Описание происходящего'
    },
    'banner': {
      title: customText?.title || 'Заголовок баннера',
      subtitle: customText?.subtitle || 'Подзаголовок с преимуществами',
      cta: customText?.cta || 'Узнать больше'
    },
    'ad': {
      title: customText?.title || 'Рекламный заголовок',
      subtitle: customText?.subtitle || 'Уникальное предложение',
      price: customText?.price || 'от 999₽',
      cta: customText?.cta || 'Купить сейчас'
    },
    'social': {
      title: customText?.title || 'Пост заголовок',
      hashtag: customText?.hashtag || '#реклама #бренд'
    }
  };
  
  const texts = sampleTexts[taskType] || sampleTexts['scene'];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="textShadow">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
    <filter id="textGlow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    
    <!-- Градиенты для текста -->
    <linearGradient id="textGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${textColor[0]}"/>
      <stop offset="100%" stop-color="${textColor[1]}"/>
    </linearGradient>
  </defs>
  
  <!-- Фон демонстрации -->
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  
  <!-- Заголовок стиля -->
  <text x="${width/2}" y="50" text-anchor="middle" font-size="24" font-weight="bold" fill="white">
    🔤 Типографика: ${style}
  </text>
  
  <!-- Демонстрация шрифтов -->
  <g transform="translate(50, 100)">
    <!-- Heading Font -->
    <text x="0" y="0" font-size="14" fill="#888">Заголовок:</text>
    <text x="0" y="40" 
          font-family="${fontPair.heading.family}" 
          font-size="48" 
          font-weight="${fontPair.heading.weight}"
          fill="${textColor[0]}"
          filter="url(#textShadow)">
      ${texts.title || 'Заголовок'}
    </text>
    
    <!-- Subtitle -->
    <text x="0" y="100" font-size="14" fill="#888">Подзаголовок:</text>
    <text x="0" y="135" 
          font-family="${fontPair.body.family}" 
          font-size="24"
          fill="${textColor[1]}">
      ${texts.subtitle || 'Подзаголовок текста'}
    </text>
    
    <!-- Body Text -->
    <text x="0" y="190" font-size="14" fill="#888">Основной текст:</text>
    <text x="0" y="220" 
          font-family="${fontPair.body.family}" 
          font-size="16"
          fill="${textColor[2]}">
      <tspan x="0" dy="0">Основной текст демонстрирует читаемость</tspan>
      <tspan x="0" dy="24">выбранного шрифта в различных контекстах.</tspan>
      <tspan x="0" dy="24">Важно учитывать межстрочный интервал.</tspan>
    </text>
  </g>
  
  <!-- Примеры размеров -->
  <g transform="translate(${width - 300}, 100)">
    <text x="0" y="0" font-size="14" fill="#888">Размеры:</text>
    
    <text x="0" y="40" font-family="${fontPair.heading.family}" font-size="64" fill="${textColor[0]}" opacity="0.9">Aa</text>
    <text x="80" y="40" font-family="${fontPair.heading.family}" font-size="48" fill="${textColor[0]}" opacity="0.7">Aa</text>
    <text x="140" y="40" font-family="${fontPair.heading.family}" font-size="36" fill="${textColor[0]}" opacity="0.5">Aa</text>
    <text x="190" y="40" font-family="${fontPair.heading.family}" font-size="24" fill="${textColor[0]}" opacity="0.4">Aa</text>
    
    <text x="0" y="70" font-size="10" fill="#666">64px | 48px | 36px | 24px</text>
  </g>
  
  <!-- Специальные элементы для разных типов задач -->
  ${taskType === 'banner' || taskType === 'ad' ? `
    <!-- CTA кнопка -->
    <g transform="translate(50, ${height - 150})">
      <rect x="0" y="0" width="200" height="50" rx="8" fill="${textColor[0]}"/>
      <text x="100" y="32" text-anchor="middle" font-family="${fontPair.accent.family}" font-size="18" font-weight="bold" fill="white">
        ${texts.cta || 'Нажать'}
      </text>
    </g>
    
    ${texts.price ? `
      <text x="280" y="${height - 120}" font-family="${fontPair.heading.family}" font-size="36" font-weight="bold" fill="${textColor[0]}">
        ${texts.price}
      </text>
    ` : ''}
  ` : ''}
  
  ${taskType === 'social' ? `
    <!-- Хэштег -->
    <text x="${width - 50}" y="${height - 50}" text-anchor="end" font-family="${fontPair.body.family}" font-size="16" fill="${textColor[1]}">
      ${texts.hashtag || '#тег'}
    </text>
  ` : ''}
  
  <!-- Характеристики -->
  <g transform="translate(50, ${height - 60})">
    <text font-size="10" fill="#666">
      Font: ${fontPair.heading.family} | Weight: ${fontPair.heading.weight} | Style: ${fontPair.heading.style}
    </text>
  </g>
  
  <!-- Водяной знак -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • Типографика</text>
</svg>`;
}

// Генерация текстового блока для вставки в SVG
export function generateTextBlock(config: {
  x: number;
  y: number;
  text: string;
  type: 'heading' | 'subheading' | 'body' | 'caption' | 'slogan' | 'cta';
  style: string;
  color?: string;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
}): string {
  const { x, y, text, type, style, color = '#ffffff', maxWidth, align = 'left' } = config;
  
  const fontPair = FONT_PAIRS[style] || FONT_PAIRS['ghibli'];
  const textConfig = TEXT_TYPES[type] || TEXT_TYPES['body'];
  
  const fontFamily = type === 'heading' || type === 'slogan' 
    ? fontPair.heading.family 
    : fontPair.body.family;
  
  const fontWeight = type === 'heading' || type === 'slogan' || type === 'cta'
    ? 'bold' 
    : 'normal';
  
  const fontSize = textConfig.sizes.lg;
  const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
  
  return `<text x="${x}" y="${y}" 
    font-family="${fontFamily}" 
    font-size="${fontSize}" 
    font-weight="${fontWeight}"
    fill="${color}"
    text-anchor="${anchor}"
    ${maxWidth ? `textLength="${maxWidth}" lengthAdjust="spacing"` : ''}>
    ${text}
  </text>`;
}

// Генерация CTA кнопки
export function generateCTAButton(config: {
  x: number;
  y: number;
  text: string;
  width?: number;
  height?: number;
  bgColor?: string;
  textColor?: string;
  style: string;
}): string {
  const { x, y, text, width = 180, height = 45, bgColor = '#ff6b6b', textColor = '#ffffff', style } = config;
  
  const fontPair = FONT_PAIRS[style] || FONT_PAIRS['ghibli'];
  
  return `<g class="cta-button">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${bgColor}"/>
    <text x="${x + width/2}" y="${y + height/2 + 6}" 
          text-anchor="middle" 
          font-family="${fontPair.accent.family}" 
          font-size="16" 
          font-weight="bold"
          fill="${textColor}">
      ${text}
    </text>
  </g>`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-typography',
    name: 'Типографика и шрифты',
    specialization: 'Шрифты, текстовые блоки, заголовки, слоганы',
    capabilities: [
      'Подбор шрифтовых пар',
      'Размерная типографика',
      'Текстовые блоки для баннеров',
      'CTA кнопки',
      'Хэштеги и подписи',
      'Контраст и читаемость'
    ],
    fontPairs: Object.keys(FONT_PAIRS),
    textTypes: Object.keys(TEXT_TYPES),
    colorSchemes: Object.keys(TEXT_COLOR_SCHEMES),
    status: 'ready'
  });
}
