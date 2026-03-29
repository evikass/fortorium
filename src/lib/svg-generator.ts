/**
 * ФОРТОРИУМ - Библиотека генерации SVG
 * Реальные функции для создания SVG контента
 */

// Типы
export interface SVGScene {
  width: number;
  height: number;
  style: 'ghibli' | 'disney' | 'pixar' | 'anime';
  location: string;
  timeOfDay: string;
  mood: string;
}

export interface SVGLayer {
  id: string;
  name: string;
  content: string;
  zIndex: number;
}

// ===== СТИЛЕВЫЕ КОНСТАНТЫ =====

export const STYLE_CONFIGS = {
  ghibli: {
    strokeWidth: 2,
    cornerRadius: 8,
    opacity: 0.9,
    gradients: true,
    softShadows: true,
    palette: {
      sky: ['#87CEEB', '#B0E0E6', '#E0FFFF'],
      grass: ['#90EE90', '#98FB98', '#7CFC00'],
      earth: ['#D2B48C', '#DEB887', '#F5DEB3'],
      water: ['#40E0D0', '#48D1CC', '#00CED1'],
      foliage: ['#228B22', '#32CD32', '#90EE90'],
    }
  },
  disney: {
    strokeWidth: 3,
    cornerRadius: 12,
    opacity: 1.0,
    gradients: true,
    softShadows: false,
    palette: {
      sky: ['#4169E1', '#6495ED', '#87CEEB'],
      grass: ['#32CD32', '#00FF00', '#7CFC00'],
      earth: ['#8B4513', '#A0522D', '#CD853F'],
      water: ['#1E90FF', '#00BFFF', '#87CEEB'],
      foliage: ['#006400', '#228B22', '#32CD32'],
    }
  },
  pixar: {
    strokeWidth: 1,
    cornerRadius: 4,
    opacity: 1.0,
    gradients: true,
    softShadows: true,
    palette: {
      sky: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
      grass: ['#2ECC71', '#27AE60', '#1ABC9C'],
      earth: ['#E74C3C', '#C0392B', '#D35400'],
      water: ['#3498DB', '#2980B9', '#1ABC9C'],
      foliage: ['#27AE60', '#2ECC71', '#82E0AA'],
    }
  },
  anime: {
    strokeWidth: 2,
    cornerRadius: 6,
    opacity: 0.95,
    gradients: false,
    softShadows: false,
    palette: {
      sky: ['#FF69B4', '#DDA0DD', '#E6E6FA'],
      grass: ['#98FB98', '#90EE90', '#00FA9A'],
      earth: ['#DEB887', '#D2B48C', '#BC8F8F'],
      water: ['#00CED1', '#20B2AA', '#48D1CC'],
      foliage: ['#FF69B4', '#FFB6C1', '#FFC0CB'],
    }
  }
};

// ===== ГЕНЕРАТОРЫ БАЗОВЫХ ЭЛЕМЕНТОВ =====

export function createSVGRoot(width: number, height: number, additionalAttrs = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" ${additionalAttrs}>`;
}

export function createDefs(content: string): string {
  return `<defs>${content}</defs>`;
}

export function createGradient(id: string, colors: string[], direction: 'vertical' | 'horizontal' | 'radial' = 'vertical'): string {
  if (direction === 'radial') {
    return `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">
      ${colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('\n')}
    </radialGradient>`;
  }
  
  const coords = direction === 'vertical' 
    ? 'x1="0%" y1="0%" x2="0%" y2="100%"' 
    : 'x1="0%" y1="0%" x2="100%" y2="0%"';
    
  return `<linearGradient id="${id}" ${coords}>
    ${colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('\n')}
  </linearGradient>`;
}

export function createFilter(id: string, type: 'shadow' | 'blur' | 'glow'): string {
  switch (type) {
    case 'shadow':
      return `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
      </filter>`;
    case 'blur':
      return `<filter id="${id}"><feGaussianBlur stdDeviation="2"/></filter>`;
    case 'glow':
      return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
  }
}

// ===== ГЕНЕРАТОРЫ ЭЛЕМЕНТОВ СЦЕНЫ =====

export function generateSky(scene: SVGScene): string {
  const config = STYLE_CONFIGS[scene.style];
  const colors = getTimeAdjustedColors(config.palette.sky, scene.timeOfDay);
  
  let skyContent = '';
  
  // Базовый градиент неба
  skyContent += `<rect width="100%" height="60%" fill="url(#skyGradient)"/>`;
  
  // Солнце/Луна
  if (scene.timeOfDay === 'ночь') {
    skyContent += generateMoon(scene.width * 0.8, scene.height * 0.15, 40);
    skyContent += generateStars(scene.width, scene.height * 0.6);
  } else if (scene.timeOfDay !== 'вечер' && scene.timeOfDay !== 'закат') {
    skyContent += generateSun(scene.width * 0.75, scene.height * 0.15, 35);
  }
  
  // Облака
  if (scene.timeOfDay !== 'ночь') {
    skyContent += generateClouds(scene.width, scene.height * 0.4, scene.style);
  }
  
  return skyContent;
}

export function generateGround(scene: SVGScene): string {
  const config = STYLE_CONFIGS[scene.style];
  const horizon = scene.height * 0.6;
  
  let groundContent = '';
  
  // Определяем тип поверхности по локации
  if (scene.location.includes('море') || scene.location.includes('океан')) {
    groundContent = generateWater(scene.width, scene.height - horizon, horizon, scene.style);
  } else if (scene.location.includes('город')) {
    groundContent = generateCityGround(scene.width, scene.height - horizon, horizon, scene.style);
  } else {
    groundContent = generateGrass(scene.width, scene.height - horizon, horizon, scene.style, scene.location);
  }
  
  return groundContent;
}

function generateSun(x: number, y: number, radius: number): string {
  return `
  <g class="sun" transform="translate(${x}, ${y})">
    <circle r="${radius}" fill="#FFD700" filter="url(#glow)"/>
    <circle r="${radius * 0.8}" fill="#FFF8DC"/>
    ${Array.from({length: 12}, (_, i) => {
      const angle = (i * 30) * Math.PI / 180;
      const x1 = Math.cos(angle) * radius * 1.2;
      const y1 = Math.sin(angle) * radius * 1.2;
      const x2 = Math.cos(angle) * radius * 1.6;
      const y2 = Math.sin(angle) * radius * 1.6;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>`;
    }).join('')}
  </g>`;
}

function generateMoon(x: number, y: number, radius: number): string {
  return `
  <g class="moon" transform="translate(${x}, ${y})">
    <circle r="${radius}" fill="#F5F5DC" filter="url(#glow)"/>
    <circle cx="${radius * 0.2}" cy="${-radius * 0.1}" r="${radius * 0.15}" fill="#E8E8E8"/>
    <circle cx="${-radius * 0.3}" cy="${radius * 0.2}" r="${radius * 0.1}" fill="#E8E8E8"/>
    <circle cx="${radius * 0.1}" cy="${radius * 0.3}" r="${radius * 0.08}" fill="#E8E8E8"/>
  </g>`;
}

function generateStars(width: number, maxHeight: number): string {
  const stars = [];
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * maxHeight;
    const size = Math.random() * 2 + 1;
    const opacity = Math.random() * 0.5 + 0.5;
    stars.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="white" opacity="${opacity}"/>`);
  }
  return stars.join('\n');
}

function generateClouds(width: number, maxY: number, style: string): string {
  const clouds = [];
  const numClouds = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < numClouds; i++) {
    const x = Math.random() * width;
    const y = Math.random() * maxY * 0.5;
    const scale = Math.random() * 0.5 + 0.5;
    clouds.push(generateCloud(x, y, scale, style));
  }
  
  return clouds.join('\n');
}

function generateCloud(x: number, y: number, scale: number, style: string): string {
  const config = STYLE_CONFIGS[style as keyof typeof STYLE_CONFIGS] || STYLE_CONFIGS.ghibli;
  const fill = style === 'ghibli' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)';
  
  return `
  <g class="cloud" transform="translate(${x}, ${y}) scale(${scale})">
    <ellipse cx="0" cy="0" rx="40" ry="25" fill="${fill}"/>
    <ellipse cx="35" cy="5" rx="30" ry="20" fill="${fill}"/>
    <ellipse cx="-30" cy="5" rx="25" ry="18" fill="${fill}"/>
    <ellipse cx="15" cy="-10" rx="25" ry="20" fill="${fill}"/>
  </g>`;
}

function generateWater(width: number, height: number, startY: number, style: string): string {
  const config = STYLE_CONFIGS[style as keyof typeof STYLE_CONFIGS] || STYLE_CONFIGS.ghibli;
  const colors = config.palette.water;
  
  let water = `<rect y="${startY}" width="${width}" height="${height}" fill="url(#waterGradient)"/>`;
  
  // Волны
  for (let i = 0; i < 5; i++) {
    const waveY = startY + height * (0.1 + i * 0.2);
    const amplitude = 5 + i * 2;
    water += `<path d="${generateWavePath(0, waveY, width, amplitude)}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`;
  }
  
  return water;
}

function generateWavePath(startX: number, y: number, width: number, amplitude: number): string {
  const segments = 20;
  const segmentWidth = width / segments;
  let path = `M ${startX} ${y}`;
  
  for (let i = 0; i <= segments; i++) {
    const x = startX + i * segmentWidth;
    const waveY = y + Math.sin(i * 0.5) * amplitude;
    path += ` L ${x} ${waveY}`;
  }
  
  return path;
}

function generateGrass(width: number, height: number, startY: number, style: string, location: string): string {
  const config = STYLE_CONFIGS[style as keyof typeof STYLE_CONFIGS] || STYLE_CONFIGS.ghibli;
  let ground = '';
  
  // Базовая земля
  if (location.includes('горы')) {
    ground = generateMountains(width, height, startY, config);
  } else if (location.includes('лес')) {
    ground = generateForestGround(width, height, startY, config);
  } else if (location.includes('сад')) {
    ground = generateGardenGround(width, height, startY, config);
  } else if (location.includes('пустыня')) {
    ground = `<rect y="${startY}" width="${width}" height="${height}" fill="#DEB887"/>`;
    ground += generateDunes(width, height, startY);
  } else {
    // Стандартная трава
    ground = `<rect y="${startY}" width="${width}" height="${height}" fill="url(#grassGradient)"/>`;
    ground += generateGrassBlades(width, height, startY, config);
  }
  
  return ground;
}

function generateMountains(width: number, height: number, startY: number, config: typeof STYLE_CONFIGS.ghibli): string {
  let mountains = '';
  
  // Дальние горы
  mountains += `<polygon points="0,${startY + height} 150,${startY - 50} 300,${startY + height}" fill="${config.palette.earth[2]}" opacity="0.5"/>`;
  mountains += `<polygon points="200,${startY + height} 400,${startY - 100} 600,${startY + height}" fill="${config.palette.earth[1]}" opacity="0.6"/>`;
  mountains += `<polygon points="500,${startY + height} 700,${startY - 70} ${width},${startY + height}" fill="${config.palette.earth[0]}" opacity="0.7"/>`;
  
  // Ближние горы
  mountains += `<polygon points="0,${startY + height} 200,${startY + 20} 400,${startY + height}" fill="${config.palette.foliage[0]}" opacity="0.8"/>`;
  mountains += `<polygon points="300,${startY + height} 550,${startY + 40} ${width},${startY + height}" fill="${config.palette.foliage[1]}"/>`;
  
  // Снежные шапки
  mountains += `<polygon points="380,${startY - 100} 400,${startY - 120} 420,${startY - 100}" fill="white" opacity="0.9"/>`;
  
  return mountains;
}

function generateForestGround(width: number, height: number, startY: number, config: typeof STYLE_CONFIGS.ghibli): string {
  let forest = `<rect y="${startY}" width="${width}" height="${height}" fill="url(#grassGradient)"/>`;
  
  // Деревья
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * width;
    const y = startY + Math.random() * height * 0.3;
    const scale = Math.random() * 0.5 + 0.5;
    forest += generateTree(x, y, scale, config);
  }
  
  return forest;
}

function generateTree(x: number, y: number, scale: number, config: typeof STYLE_CONFIGS.ghibli): string {
  return `
  <g class="tree" transform="translate(${x}, ${y}) scale(${scale})">
    <rect x="-8" y="0" width="16" height="60" fill="${config.palette.earth[0]}"/>
    <ellipse cx="0" cy="-20" rx="40" ry="50" fill="${config.palette.foliage[0]}"/>
    <ellipse cx="-20" cy="0" rx="25" ry="30" fill="${config.palette.foliage[1]}"/>
    <ellipse cx="20" cy="-10" rx="25" ry="35" fill="${config.palette.foliage[1]}"/>
  </g>`;
}

function generateGardenGround(width: number, height: number, startY: number, config: typeof STYLE_CONFIGS.ghibli): string {
  let garden = `<rect y="${startY}" width="${width}" height="${height}" fill="url(#grassGradient)"/>`;
  
  // Цветы
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = startY + Math.random() * height * 0.5;
    garden += generateFlower(x, y, Math.random() * 0.5 + 0.3);
  }
  
  return garden;
}

function generateFlower(x: number, y: number, scale: number): string {
  const colors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB', '#00CED1'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return `
  <g class="flower" transform="translate(${x}, ${y}) scale(${scale})">
    <line x1="0" y1="0" x2="0" y2="20" stroke="#228B22" stroke-width="2"/>
    <circle cx="0" cy="0" r="8" fill="${color}"/>
    <circle cx="0" cy="0" r="3" fill="#FFD700"/>
  </g>`;
}

function generateDunes(width: number, height: number, startY: number): string {
  let dunes = '';
  for (let i = 0; i < 5; i++) {
    const x1 = i * width / 4 - width / 8;
    const x2 = x1 + width / 3;
    const peakX = (x1 + x2) / 2;
    const peakY = startY + Math.random() * 30;
    dunes += `<path d="M ${x1} ${startY + height} Q ${peakX} ${peakY} ${x2} ${startY + height}" fill="rgba(210,180,140,${0.3 + i * 0.1})"/>`;
  }
  return dunes;
}

function generateCityGround(width: number, height: number, startY: number, style: string): string {
  let city = `<rect y="${startY}" width="${width}" height="${height}" fill="#4A4A4A"/>`;
  
  // Здания
  for (let i = 0; i < 12; i++) {
    const x = i * (width / 12);
    const buildingHeight = Math.random() * height * 0.8 + height * 0.2;
    const buildingWidth = width / 14;
    city += generateBuilding(x, startY + height - buildingHeight, buildingWidth, buildingHeight, style);
  }
  
  return city;
}

function generateBuilding(x: number, y: number, width: number, height: number, style: string): string {
  const color = ['#2C3E50', '#34495E', '#5D6D7E', '#7F8C8D'][Math.floor(Math.random() * 4)];
  let building = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}"/>`;
  
  // Окна
  const windowRows = Math.floor(height / 20);
  const windowCols = Math.floor(width / 15);
  
  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const wx = x + 5 + col * 15;
      const wy = y + 10 + row * 20;
      const lit = Math.random() > 0.5;
      building += `<rect x="${wx}" y="${wy}" width="8" height="10" fill="${lit ? '#FFD700' : '#1A1A2E'}"/>`;
    }
  }
  
  return building;
}

function generateGrassBlades(width: number, height: number, startY: number, config: typeof STYLE_CONFIGS.ghibli): string {
  let blades = '';
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = startY + Math.random() * height * 0.2;
    const bladeHeight = Math.random() * 15 + 5;
    const curve = Math.random() * 10 - 5;
    blades += `<path d="M ${x} ${y} q ${curve} ${-bladeHeight/2} 0 ${-bladeHeight}" stroke="${config.palette.foliage[1]}" stroke-width="1.5" fill="none"/>`;
  }
  return blades;
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function getTimeAdjustedColors(colors: string[], timeOfDay: string): string[] {
  // Базовая корректировка цветов по времени суток
  return colors; // Можно добавить реальную корректировку
}

// ===== ГЛАВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ СЦЕНЫ =====

export function generateFullScene(scene: SVGScene): string {
  const config = STYLE_CONFIGS[scene.style];
  
  return `${createSVGRoot(scene.width, scene.height)}
${createDefs(`
  ${createGradient('skyGradient', getTimeAdjustedColors(config.palette.sky, scene.timeOfDay), 'vertical')}
  ${createGradient('grassGradient', config.palette.foliage, 'vertical')}
  ${createGradient('waterGradient', config.palette.water, 'vertical')}
  ${createFilter('shadow', 'shadow')}
  ${createFilter('glow', 'glow')}
`)}
  
  <!-- Небо -->
  <g class="layer-sky">
    ${generateSky(scene)}
  </g>
  
  <!-- Земля -->
  <g class="layer-ground">
    ${generateGround(scene)}
  </g>
  
  <!-- Атмосфера -->
  <g class="layer-atmosphere">
    ${generateAtmosphere(scene)}
  </g>
  
  <!-- Виньетка -->
  <defs>
    <radialGradient id="vignette">
      <stop offset="50%" stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.15)"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
  
  <!-- Водяной знак -->
  <text x="${scene.width - 10}" y="${scene.height - 10}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
</svg>`;
}

function generateAtmosphere(scene: SVGScene): string {
  let atmosphere = '';
  
  if (scene.mood === 'таинственный' || scene.mood === 'волшебный') {
    // Туман
    atmosphere += `<rect y="${scene.height * 0.5}" width="${scene.width}" height="${scene.height * 0.5}" fill="url(#fogGradient)" opacity="0.3"/>`;
  }
  
  if (scene.timeOfDay === 'вечер' || scene.timeOfDay === 'закат') {
    // Тёплый оверлей
    atmosphere += `<rect width="100%" height="100%" fill="rgba(255,100,50,0.1)"/>`;
  }
  
  if (scene.mood === 'грустный') {
    // Холодный оверлей
    atmosphere += `<rect width="100%" height="100%" fill="rgba(100,150,200,0.1)"/>`;
  }
  
  return atmosphere;
}

// ===== ЭКСПОРТ ДОПОЛНИТЕЛЬНЫХ ФУНКЦИЙ =====

export { STYLE_CONFIGS };
