import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * SVG-агент: Анимация и динамика (Animation Artist)
 * Отвечает за анимацию всех элементов сцены, движение, динамику
 */

// Типы анимации
const ANIMATION_TYPES: Record<string, any> = {
  'entrance': { name: 'Появление', description: 'Вход элемента в сцену' },
  'exit': { name: 'Исчезновение', description: 'Выход элемента из сцены' },
  'idle': { name: 'Покой', description: 'Микро-движения в покое' },
  'action': { name: 'Действие', description: 'Активное движение' },
  'transition': { name: 'Переход', description: 'Плавное изменение' },
  'emphasis': { name: 'Акцент', description: 'Привлечение внимания' },
  'loop': { name: 'Цикл', description: 'Бесконечное повторение' }
};

// Движения
const MOTION_TYPES: Record<string, any> = {
  'linear': { name: 'Линейное', easing: 'linear' },
  'ease-in': { name: 'Плавный вход', easing: 'ease-in' },
  'ease-out': { name: 'Плавный выход', easing: 'ease-out' },
  'ease-in-out': { name: 'Плавный', easing: 'ease-in-out' },
  'bounce': { name: 'Отскок', easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  'elastic': { name: 'Эластичный', easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  'spring': { name: 'Пружина', easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
};

// Анимации персонажей
const CHARACTER_ANIMATIONS: Record<string, any> = {
  'walk': { name: 'Ходьба', frames: 8, duration: 1000, loop: true },
  'run': { name: 'Бег', frames: 6, duration: 600, loop: true },
  'jump': { name: 'Прыжок', frames: 12, duration: 800, loop: false },
  'wave': { name: 'Махать', frames: 10, duration: 1000, loop: true },
  'blink': { name: 'Моргание', frames: 3, duration: 300, loop: true },
  'breathe': { name: 'Дыхание', frames: 4, duration: 3000, loop: true },
  'talk': { name: 'Разговор', frames: 6, duration: 500, loop: true },
  'nod': { name: 'Кивок', frames: 4, duration: 600, loop: false }
};

// Анимации объектов
const OBJECT_ANIMATIONS: Record<string, any> = {
  'float': { name: 'Парение', frames: 4, duration: 2000, loop: true },
  'rotate': { name: 'Вращение', frames: 1, duration: 3000, loop: true },
  'pulse': { name: 'Пульсация', frames: 2, duration: 1000, loop: true },
  'shake': { name: 'Дрожание', frames: 4, duration: 500, loop: true },
  'swing': { name: 'Качание', frames: 4, duration: 1500, loop: true },
  'glow': { name: 'Свечение', frames: 2, duration: 2000, loop: true }
};

// Анимации эффектов
const EFFECT_ANIMATIONS: Record<string, any> = {
  'fade-in': { name: 'Проявление', type: 'opacity', from: 0, to: 1 },
  'fade-out': { name: 'Затухание', type: 'opacity', from: 1, to: 0 },
  'scale-up': { name: 'Увеличение', type: 'scale', from: 0, to: 1 },
  'scale-down': { name: 'Уменьшение', type: 'scale', from: 1, to: 0 },
  'slide-in-left': { name: 'Въезд слева', type: 'translate', from: '-100%', to: '0' },
  'slide-in-right': { name: 'Въезд справа', type: 'translate', from: '100%', to: '0' },
  'slide-in-up': { name: 'Въезд снизу', type: 'translate', from: '100%', to: '0' },
  'slide-in-down': { name: 'Въезд сверху', type: 'translate', from: '-100%', to: '0' }
};

// Параметры динамики
const DYNAMICS_PARAMS: Record<string, any> = {
  'slow': { speed: 0.5, name: 'Медленно' },
  'normal': { speed: 1.0, name: 'Нормально' },
  'fast': { speed: 1.5, name: 'Быстро' },
  'very-fast': { speed: 2.0, name: 'Очень быстро' },
  'slow-motion': { speed: 0.25, name: 'Слоу-мо' }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      elements = [],
      animationType = 'idle',
      motionType = 'ease-in-out',
      duration = 1000,
      dynamics = 'normal',
      loop = false,
      dimensions = { width: 1024, height: 576 }
    } = body;
    
    const { width, height } = dimensions;
    
    // Получаем настройки
    const animType = ANIMATION_TYPES[animationType] || ANIMATION_TYPES['idle'];
    const motion = MOTION_TYPES[motionType] || MOTION_TYPES['ease-in-out'];
    const dynamicsParams = DYNAMICS_PARAMS[dynamics] || DYNAMICS_PARAMS['normal'];
    
    // Генерируем анимации для каждого элемента
    const animationsData = elements.map((element: any, i: number) => {
      const isCharacter = element.type === 'character';
      const animLibrary = isCharacter ? CHARACTER_ANIMATIONS : OBJECT_ANIMATIONS;
      const specificAnim = animLibrary[element.animation || 'idle'] || animLibrary['idle'];
      
      return {
        element: element.name || `element-${i}`,
        type: isCharacter ? 'character' : 'object',
        animation: specificAnim,
        css: generateCSSAnimation(element, specificAnim, motion, duration * dynamicsParams.speed, loop, i),
        keyframes: generateKeyframes(element, specificAnim, dimensions),
        delay: i * 100, // Каскадное появление
        duration: duration * dynamicsParams.speed
      };
    });
    
    // Генерируем общий SVG с анимациями
    const animationSVG = generateAnimationSVG(animationsData, dimensions);
    
    // Генерируем CSS
    const animationCSS = generateAnimationCSS(animationsData);

    return NextResponse.json({
      success: true,
      agent: 'svg-animation',
      specialization: 'Анимация и динамика',
      
      svg: animationSVG,
      
      css: animationCSS,
      
      animations: animationsData,
      
      settings: {
        type: animType,
        motion: motion,
        dynamics: dynamicsParams,
        duration: duration * dynamicsParams.speed,
        loop
      },
      
      message: `Анимации для ${animationsData.length} элементов созданы`
    });

  } catch (error) {
    console.error('[SVG-Animation] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

function generateCSSAnimation(
  element: any,
  animation: any,
  motion: any,
  duration: number,
  loop: boolean,
  index: number
): string {
  const animName = `anim-${element.name || index}`;
  const delay = index * 100;
  
  return `animation: ${animName} ${duration}ms ${motion.easing} ${delay}ms ${loop ? 'infinite' : 'forwards'};`;
}

function generateKeyframes(
  element: any,
  animation: any,
  dimensions: any
): string {
  const animName = `anim-${element.name || 'element'}`;
  
  // Генерируем ключевые кадры в зависимости от типа анимации
  switch (animation.name) {
    case 'Дыхание':
      return `@keyframes ${animName} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }`;
    
    case 'Моргание':
      return `@keyframes ${animName} {
        0%, 90%, 100% { transform: scaleY(1); }
        95% { transform: scaleY(0.1); }
      }`;
    
    case 'Парение':
      return `@keyframes ${animName} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }`;
    
    case 'Вращение':
      return `@keyframes ${animName} {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }`;
    
    case 'Пульсация':
      return `@keyframes ${animName} {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }`;
    
    case 'Качание':
      return `@keyframes ${animName} {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
      }`;
    
    case 'Свечение':
      return `@keyframes ${animName} {
        0%, 100% { filter: drop-shadow(0 0 5px currentColor); }
        50% { filter: drop-shadow(0 0 20px currentColor); }
      }`;
    
    default:
      return `@keyframes ${animName} {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-2px); }
        75% { transform: translateY(2px); }
      }`;
  }
}

function generateAnimationSVG(animationsData: any[], dimensions: any): string {
  const { width, height } = dimensions;
  
  // Демонстрационные элементы с анимациями
  const demoElements = animationsData.map((anim, i) => {
    const x = (i % 5) * (width / 5) + width / 10;
    const y = Math.floor(i / 5) * 150 + 100;
    
    return `
      <g class="demo-element" transform="translate(${x}, ${y})">
        <circle cx="0" cy="0" r="30" fill="${anim.type === 'character' ? '#FF6B6B' : '#4ECDC4'}" style="${anim.css}"/>
        <text x="0" y="50" text-anchor="middle" font-size="10" fill="#666">${anim.animation.name}</text>
      </g>
    `;
  }).join('');
  
  // Таймлайн
  const timelineSVG = generateTimelineSVG(animationsData, dimensions);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="animation-preview" data-agent="animation">
  <defs>
    <style>
      ${animationsData.map(a => a.keyframes).join('\n')}
    </style>
    
    <!-- Фильтры для эффектов -->
    <filter id="motionBlur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
    </filter>
    
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Демонстрация анимаций -->
  <g class="demo-area">
    ${demoElements}
  </g>
  
  <!-- Таймлайн -->
  ${timelineSVG}
  
  <!-- Информация -->
  <g class="info" transform="translate(10, ${height - 50})">
    <text font-size="14" fill="#333">Анимаций: ${animationsData.length}</text>
    <text y="20" font-size="12" fill="#666">Тип: ${animationsData[0]?.animation?.name || 'Нет'}</text>
  </g>
</svg>`;
}

function generateTimelineSVG(animationsData: any[], dimensions: any): string {
  const { width, height } = dimensions;
  const timelineY = height - 30;
  const totalTime = Math.max(...animationsData.map(a => a.duration + a.delay));
  const scale = (width - 40) / totalTime;
  
  const tracks = animationsData.map((anim, i) => {
    const startX = 20 + anim.delay * scale;
    const trackWidth = anim.duration * scale;
    const y = timelineY - 20 - i * 15;
    
    return `
      <rect x="${startX}" y="${y}" width="${trackWidth}" height="10" fill="${anim.type === 'character' ? '#FF6B6B' : '#4ECDC4'}" rx="2"/>
      <text x="10" y="${y + 8}" font-size="8" fill="#999">${anim.element}</text>
    `;
  }).join('');
  
  return `
    <g class="timeline" transform="translate(0, 0)">
      <line x1="20" y1="${timelineY - 10}" x2="${width - 20}" y2="${timelineY - 10}" stroke="#ddd" stroke-width="1"/>
      ${tracks}
    </g>
  `;
}

function generateAnimationCSS(animationsData: any[]): string {
  const keyframes = animationsData.map(a => a.keyframes).join('\n\n');
  
  const elementStyles = animationsData.map((a, i) => {
    return `.element-${i} { ${a.css} }`;
  }).join('\n');
  
  return `${keyframes}

/* Element styles */
${elementStyles}`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-animation',
    name: 'Анимация и динамика',
    specialization: 'Анимация элементов сцены',
    capabilities: [
      'Анимации персонажей',
      'Анимации объектов',
      'Эффекты переходов',
      'Типы движения',
      'Динамика сцены',
      'CSS keyframes'
    ],
    animationTypes: Object.keys(ANIMATION_TYPES),
    motionTypes: Object.keys(MOTION_TYPES),
    characterAnimations: Object.keys(CHARACTER_ANIMATIONS),
    objectAnimations: Object.keys(OBJECT_ANIMATIONS),
    effectAnimations: Object.keys(EFFECT_ANIMATIONS),
    dynamics: Object.keys(DYNAMICS_PARAMS),
    status: 'ready'
  });
}
