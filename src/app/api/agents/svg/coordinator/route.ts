import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 120;

/**
 * SVG-координатор v6.7.0
 * AI-анализ ТЗ для понимания ЛЮБОГО описания персонажа
 */

// AI-анализ технического задания - понимает ЛЮБОЕ описание
async function analyzeTZWithAI(tz: string): Promise<{
  characterType: string;
  characterName: string;
  characterDescription: string;
  mood: string;
  location: string;
  timeOfDay: string;
  keywords: string[];
  customElements: string[];
}> {
  // Если ТЗ пустое, возвращаем настройки по умолчанию
  if (!tz || tz.trim().length < 3) {
    return {
      characterType: 'cat_detective',
      characterName: 'Кот-детектив',
      characterDescription: 'Отважный кот-детектив в шляпе',
      mood: 'сказочный',
      location: 'волшебный лес',
      timeOfDay: 'день',
      keywords: [],
      customElements: []
    };
  }

  try {
    const zai = await ZAI.create();
    
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Ты — анализатор описаний для SVG-анимации. Твоя задача — извлечь из описания структурированные данные.

Доступные типы персонажей:
- cat_detective: коты, кошки, детективы, сыщики, животные-детективы
- wizard: волшебники, маги, чародеи, колдуны
- fairy: феи, эльфы, волшебные существа с крыльями
- knight: рыцари, воины, богатыри, герои в броне
- princess: принцессы, королевы, знатные дамы
- robot: роботы, андроиды, механизмы
- astronaut: астронавты, космонавты, исследователи космоса
- pirate: пираты, мореплаватели, капитаны кораблей
- animal: лесные животные (медведи, лисы, волки, зайцы и т.д.)
- hero: общие герои, путешественники, исследователи
- child: дети, малыши, ребята

Настроения: сказочный, мрачный, весёлый, таинственный, приключенческий, романтичный, героический

Времена суток: день, ночь, вечер, рассвет

Локации: волшебный лес, город, море/пляж, горы, космос, замок, деревня, пустыня, джунгли

Ответь ТОЛЬКО валидным JSON без markdown:
{"characterType":"...","characterName":"...","characterDescription":"...","mood":"...","location":"...","timeOfDay":"...","keywords":[...],"customElements":[...]}`
        },
        {
          role: 'user',
          content: `Проанализируй это описание для анимации: "${tz}"

Определи:
1. Тип главного персонажа (выбери наиболее подходящий из списка)
2. Имя персонажа на русском
3. Краткое описание персонажа для SVG
4. Настроение сцены
5. Локацию
6. Время суток
7. Ключевые слова из описания
8. Дополнительные элементы для генерации (например: грибы, цветы, река, замок и т.д.)`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('[AI-TZ-Analysis] Raw response:', content.substring(0, 200));
    
    // Парсим JSON из ответа
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[AI-TZ-Analysis] Parsed:', parsed);
      return {
        characterType: parsed.characterType || 'cat_detective',
        characterName: parsed.characterName || 'Персонаж',
        characterDescription: parsed.characterDescription || '',
        mood: parsed.mood || 'сказочный',
        location: parsed.location || 'волшебный лес',
        timeOfDay: parsed.timeOfDay || 'день',
        keywords: parsed.keywords || [],
        customElements: parsed.customElements || []
      };
    }
  } catch (error: any) {
    console.error('[AI-TZ-Analysis] Error:', error.message);
  }

  // Fallback - простое сопоставление если AI не сработал
  return analyzeTZFallback(tz);
}

// Fallback анализ по ключевым словам (если AI недоступен)
function analyzeTZFallback(tz: string): {
  characterType: string;
  characterName: string;
  characterDescription: string;
  mood: string;
  location: string;
  timeOfDay: string;
  keywords: string[];
  customElements: string[];
} {
  const lowerTz = (tz || '').toLowerCase();
  
  const characterPatterns: Record<string, {name: string, patterns: string[]}> = {
    'cat_detective': { name: 'Кот-детектив', patterns: ['кот', 'кошк', 'детектив', 'сыщик', 'cat', 'detective'] },
    'wizard': { name: 'Волшебник', patterns: ['волшебник', 'маг', 'чародей', 'wizard', 'magic'] },
    'fairy': { name: 'Фея', patterns: ['фея', 'эльф', 'fairy', 'крылья'] },
    'knight': { name: 'Рыцарь', patterns: ['рыцарь', 'воин', 'knight', 'меч', 'броня'] },
    'princess': { name: 'Принцесса', patterns: ['принцесс', 'королев', 'princess'] },
    'robot': { name: 'Робот', patterns: ['робот', 'android', 'robot', 'механ'] },
    'astronaut': { name: 'Астронавт', patterns: ['астронавт', 'космонавт', 'космос', 'astronaut'] },
    'pirate': { name: 'Пират', patterns: ['пират', 'море', 'pirate', 'корабль'] },
    'animal': { name: 'Лесной житель', patterns: ['медвед', 'лис', 'волк', 'заяц', 'животное'] },
    'hero': { name: 'Герой', patterns: ['герой', 'путешеств', 'исследов', 'приключен'] }
  };

  let detectedCharacter = 'cat_detective';
  let detectedName = 'Кот-детектив';

  for (const [charType, data] of Object.entries(characterPatterns)) {
    if (data.patterns.some(p => lowerTz.includes(p))) {
      detectedCharacter = charType;
      detectedName = data.name;
      break;
    }
  }

  return {
    characterType: detectedCharacter,
    characterName: detectedName,
    characterDescription: '',
    mood: 'сказочный',
    location: 'волшебный лес',
    timeOfDay: 'день',
    keywords: [],
    customElements: []
  };
}

const SVG_AGENTS = [
  { id: 'palette', name: 'Цветовая палитра', icon: '🎨', order: 1 },
  { id: 'background', name: 'Фон', icon: '🌄', order: 2 },
  { id: 'landscape', name: 'Ландшафт', icon: '🌳', order: 3 },
  { id: 'perspective', name: 'Перспектива', icon: '📐', order: 4 },
  { id: 'composition', name: 'Композиция', icon: '📊', order: 5 },
  { id: 'lighting', name: 'Освещение', icon: '💡', order: 6 },
  { id: 'details', name: 'Детали', icon: '✨', order: 7 },
  { id: 'objects', name: 'Предметы', icon: '🪑', order: 8 },
  { id: 'characters', name: 'Персонажи', icon: '👤', order: 9 },
  { id: 'layout', name: 'Расстановка', icon: '📍', order: 10 },
  { id: 'animation', name: 'Анимация', icon: '🎬', order: 11 },
  { id: 'typography', name: 'Типографика', icon: '🔤', order: 12 }
];

const STYLE_PALETTES: Record<string, any> = {
  ghibli: {
    sky: ['#87CEEB', '#B0E0E6', '#E0F7FA', '#F0FFF0', '#FFF8E7'],
    skyDark: ['#5C9DC0', '#7EB8D4', '#A8D8E8', '#C8E8F0', '#E8F8F0'],
    ground: ['#4CAF50', '#6BB86B', '#8BC34A', '#A5D66A', '#C5E1A5'],
    groundDark: ['#3D9140', '#5AA55A', '#7AB04A', '#95C55A', '#B5D590'],
    accent: ['#FF7043', '#FF8A65', '#FFAB91', '#FFCCBC', '#FFE0B2'],
    skin: ['#FFCCBC', '#FFAB91', '#FF8A65', '#E07050', '#C05030'],
    skinShadow: ['#E8A090', '#D08070', '#B06050', '#904030', '#703020'],
    hair: ['#5D4037', '#7D5A47', '#8D6E63', '#A08880', '#BCAAA4'],
    water: ['#4DD0E1', '#80DEEA', '#B2EBF2', '#D0F0F5', '#E8F8FA'],
    trunk: ['#5D4037', '#6D4C41', '#795548', '#8D6E63', '#A1887F'],
    leaves: ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A'],
    shadow: 'rgba(0,0,0,0.15)',
    fog: 'rgba(200,220,240,0.3)',
    glow: 'rgba(255,200,100,0.4)'
  },
  disney: {
    sky: ['#1E88E5', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB'],
    skyDark: ['#1565C0', '#1E88E5', '#42A5F5', '#64B5F6', '#90CAF9'],
    ground: ['#43A047', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9'],
    groundDark: ['#2E7D32', '#43A047', '#66BB6A', '#81C784', '#A5D6A7'],
    accent: ['#FFC107', '#FFCA28', '#FFD54F', '#FFE082', '#FFECB3'],
    skin: ['#FFCCBC', '#FFAB91', '#FF8A65', '#E07050', '#C05030'],
    skinShadow: ['#E8A090', '#D08070', '#B06050', '#904030', '#703020'],
    hair: ['#4E342E', '#6D4C41', '#8D6E63', '#A1887F', '#BCAAA4'],
    water: ['#29B6F6', '#4FC3F7', '#81D4FA', '#B3E5FC', '#E1F5FE'],
    trunk: ['#4E342E', '#5D4037', '#6D4C41', '#795548', '#8D6E63'],
    leaves: ['#1B5E20', '#2E7D32', '#388E3C', '#43A047', '#4CAF50'],
    shadow: 'rgba(0,0,0,0.2)',
    fog: 'rgba(180,200,220,0.35)',
    glow: 'rgba(255,220,100,0.5)'
  },
  pixar: {
    sky: ['#5C6BC0', '#7986CB', '#9FA8DA', '#C5CAE9', '#E8EAF6'],
    skyDark: ['#3949AB', '#5C6BC0', '#7986CB', '#9FA8DA', '#C5CAE9'],
    ground: ['#26A69A', '#4DB6AC', '#80CBC4', '#B2DFDB', '#E0F2F1'],
    groundDark: ['#00897B', '#26A69A', '#4DB6AC', '#80CBC4', '#B2DFDB'],
    accent: ['#EF5350', '#EF9A9A', '#FFCDD2', '#FFEBEE', '#FFF5F5'],
    skin: ['#FFCCBC', '#FFAB91', '#FF8A65', '#E07050', '#C05030'],
    skinShadow: ['#E8A090', '#D08070', '#B06050', '#904030', '#703020'],
    hair: ['#37474F', '#546E7A', '#78909C', '#90A4AE', '#B0BEC5'],
    water: ['#29B6F6', '#4FC3F7', '#81D4FA', '#B3E5FC', '#E1F5FE'],
    trunk: ['#37474F', '#455A64', '#546E7A', '#607D8B', '#78909C'],
    leaves: ['#00695C', '#00897B', '#26A69A', '#4DB6AC', '#80CBC4'],
    shadow: 'rgba(0,0,0,0.25)',
    fog: 'rgba(200,210,230,0.3)',
    glow: 'rgba(255,180,120,0.4)'
  },
  anime: {
    sky: ['#E91E63', '#F06292', '#F48FB1', '#F8BBD9', '#FCE4EC'],
    skyDark: ['#C2185B', '#E91E63', '#F06292', '#F48FB1', '#F8BBD9'],
    ground: ['#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5'],
    groundDark: ['#7B1FA2', '#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7'],
    accent: ['#FFEB3B', '#FFF176', '#FFF59D', '#FFF9C4', '#FFFDE7'],
    skin: ['#FFE0B2', '#FFCC80', '#FFB74D', '#E09A40', '#C08030'],
    skinShadow: ['#E8C8A0', '#D0A870', '#B08850', '#906830', '#704820'],
    hair: ['#311B92', '#512DA8', '#673AB7', '#9575CD', '#B39DDB'],
    water: ['#00BCD4', '#26C6DA', '#4DD0E1', '#80DEEA', '#B2EBF2'],
    trunk: ['#4A148C', '#6A1B9A', '#7B1FA2', '#8E24AA', '#9C27B0'],
    leaves: ['#4A148C', '#6A1B9A', '#7B1FA2', '#8E24AA', '#9C27B0'],
    shadow: 'rgba(0,0,0,0.18)',
    fog: 'rgba(240,200,230,0.3)',
    glow: 'rgba(255,220,150,0.5)'
  }
};

// Детерминированный генератор случайных чисел
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Генератор детализированного дерева
function generateDetailedTree(x: number, y: number, scale: number, palette: any, rand: () => number, treeType: string = 'oak'): string {
  // Увеличенные базовые размеры для более высоких деревьев
  const trunkHeight = (rand() * 60 + 100) * scale;  // было 40+60, стало 60+100
  const trunkWidth = (rand() * 12 + 14) * scale;    // было 8+10, стало 12+14
  const canopyRadius = (rand() * 45 + 55) * scale;  // было 30+40, стало 45+55
  
  // Типы деревьев
  const treeStyles: Record<string, () => string> = {
    oak: () => {
      // Дуб - округлая крона
      return `
        <!-- Ствол дуба -->
        <path d="M${x-trunkWidth/2} ${y} 
          Q${x-trunkWidth/2-3} ${y-trunkHeight*0.3} ${x-trunkWidth/3} ${y-trunkHeight*0.7}
          Q${x-trunkWidth/4} ${y-trunkHeight} ${x} ${y-trunkHeight}
          Q${x+trunkWidth/4} ${y-trunkHeight} ${x+trunkWidth/3} ${y-trunkHeight*0.7}
          Q${x+trunkWidth/2+3} ${y-trunkHeight*0.3} ${x+trunkWidth/2} ${y}
          Z" fill="${palette.trunk[0]}"/>
        <path d="M${x-trunkWidth/3} ${y-trunkHeight*0.2} Q${x} ${y-trunkHeight*0.4} ${x+trunkWidth/3} ${y-trunkHeight*0.2}" fill="${palette.trunk[2]}" opacity="0.5"/>
        
        <!-- Крона дуба - множество наложенных эллипсов -->
        <ellipse cx="${x}" cy="${y-trunkHeight-canopyRadius*0.8}" rx="${canopyRadius*1.1}" ry="${canopyRadius*0.9}" fill="${palette.leaves[1]}"/>
        <ellipse cx="${x-canopyRadius*0.5}" cy="${y-trunkHeight-canopyRadius*0.5}" rx="${canopyRadius*0.8}" ry="${canopyRadius*0.7}" fill="${palette.leaves[0]}"/>
        <ellipse cx="${x+canopyRadius*0.5}" cy="${y-trunkHeight-canopyRadius*0.6}" rx="${canopyRadius*0.75}" ry="${canopyRadius*0.65}" fill="${palette.leaves[1]}"/>
        <ellipse cx="${x}" cy="${y-trunkHeight-canopyRadius*1.1}" rx="${canopyRadius*0.7}" ry="${canopyRadius*0.6}" fill="${palette.leaves[2]}"/>
        <ellipse cx="${x-canopyRadius*0.3}" cy="${y-trunkHeight-canopyRadius*0.9}" rx="${canopyRadius*0.5}" ry="${canopyRadius*0.45}" fill="${palette.leaves[3]}" opacity="0.7"/>
        
        <!-- Блики на кроне -->
        <ellipse cx="${x-canopyRadius*0.3}" cy="${y-trunkHeight-canopyRadius*0.9}" rx="${canopyRadius*0.35}" ry="${canopyRadius*0.3}" fill="${palette.leaves[4]}" opacity="0.5"/>
      `;
    },
    
    pine: () => {
      // Сосна - треугольная крона
      const layers = 4;
      let svg = `<path d="M${x-trunkWidth/2} ${y} L${x} ${y-trunkHeight*0.3} L${x+trunkWidth/2} ${y} Z" fill="${palette.trunk[0]}"/>`;
      
      for (let i = 0; i < layers; i++) {
        const layerY = y - trunkHeight * 0.3 - i * canopyRadius * 0.35;
        const layerWidth = canopyRadius * (1.5 - i * 0.25);
        const layerHeight = canopyRadius * 0.45;
        svg += `
          <path d="M${x-layerWidth} ${layerY} 
            L${x} ${layerY-layerHeight} 
            L${x+layerWidth} ${layerY} Z" 
            fill="${palette.leaves[Math.min(i, palette.leaves.length-1)]}"/>
        `;
      }
      // Верхушка
      svg += `<path d="M${x-canopyRadius*0.2} ${y-trunkHeight-canopyRadius*1.2} L${x} ${y-trunkHeight-canopyRadius*1.5} L${x+canopyRadius*0.2} ${y-trunkHeight-canopyRadius*1.2} Z" fill="${palette.leaves[3]}"/>`;
      return svg;
    },
    
    birch: () => {
      // Берёза - тонкий ствол с пятнами
      const thinTrunk = trunkWidth * 0.5;
      return `
        <!-- Ствол берёзы с пятнами -->
        <path d="M${x-thinTrunk/2} ${y} L${x-thinTrunk/3} ${y-trunkHeight} L${x+thinTrunk/3} ${y-trunkHeight} L${x+thinTrunk/2} ${y} Z" fill="#F5F5F5"/>
        ${Array.from({length: 6}, (_, i) => {
          const spotY = y - trunkHeight * 0.15 - i * trunkHeight * 0.13;
          const spotW = rand() * thinTrunk * 0.4 + thinTrunk * 0.2;
          return `<ellipse cx="${x + (rand()-0.5)*thinTrunk*0.3}" cy="${spotY}" rx="${spotW}" ry="${rand()*3+2}" fill="#333" opacity="0.3"/>`;
        }).join('')}
        
        <!-- Крона берёзы - лёгкая, ажурная -->
        <ellipse cx="${x}" cy="${y-trunkHeight-canopyRadius*0.6}" rx="${canopyRadius*0.9}" ry="${canopyRadius*0.7}" fill="${palette.leaves[2]}" opacity="0.8"/>
        <ellipse cx="${x-canopyRadius*0.3}" cy="${y-trunkHeight-canopyRadius*0.4}" rx="${canopyRadius*0.5}" ry="${canopyRadius*0.4}" fill="${palette.leaves[3]}" opacity="0.7"/>
        <ellipse cx="${x+canopyRadius*0.4}" cy="${y-trunkHeight-canopyRadius*0.5}" rx="${canopyRadius*0.45}" ry="${canopyRadius*0.35}" fill="${palette.leaves[2]}" opacity="0.6"/>
        <!-- Свисающие ветки -->
        <path d="M${x-canopyRadius*0.6} ${y-trunkHeight-canopyRadius*0.3} Q${x-canopyRadius*0.8} ${y-trunkHeight} ${x-canopyRadius*0.4} ${y-trunkHeight*0.9}" stroke="${palette.leaves[1]}" stroke-width="3" fill="none" opacity="0.6"/>
        <path d="M${x+canopyRadius*0.5} ${y-trunkHeight-canopyRadius*0.4} Q${x+canopyRadius*0.7} ${y-trunkHeight*0.95} ${x+canopyRadius*0.3} ${y-trunkHeight*0.85}" stroke="${palette.leaves[1]}" stroke-width="2" fill="none" opacity="0.5"/>
      `;
    },
    
    willow: () => {
      // Ива - плакучая форма
      return `
        <!-- Ствол ивы -->
        <path d="M${x-trunkWidth/2} ${y} Q${x-trunkWidth/2.5} ${y-trunkHeight*0.5} ${x-trunkWidth/4} ${y-trunkHeight} Q${x} ${y-trunkHeight*1.05} ${x+trunkWidth/4} ${y-trunkHeight} Q${x+trunkWidth/2.5} ${y-trunkHeight*0.5} ${x+trunkWidth/2} ${y} Z" fill="${palette.trunk[0]}"/>
        
        <!-- Крона ивы - свисающие ветви -->
        <ellipse cx="${x}" cy="${y-trunkHeight-canopyRadius*0.4}" rx="${canopyRadius*1.2}" ry="${canopyRadius*0.5}" fill="${palette.leaves[1]}" opacity="0.7"/>
        
        <!-- Свисающие ветви -->
        ${Array.from({length: 8}, (_, i) => {
          const branchX = x + (i - 3.5) * canopyRadius * 0.25;
          const curve = rand() * 20 - 10;
          return `<path d="M${branchX} ${y-trunkHeight} Q${branchX+curve} ${y-trunkHeight*0.6} ${branchX+curve*0.5} ${y-trunkHeight*0.15}" 
            stroke="${palette.leaves[rand()*2|0]}" stroke-width="${rand()*2+1}" fill="none" opacity="${rand()*0.3+0.5}"/>`;
        }).join('')}
        
        <!-- Дополнительные свисающие ветви -->
        ${Array.from({length: 5}, (_, i) => {
          const branchX = x + (i - 2) * canopyRadius * 0.35;
          return `<path d="M${branchX} ${y-trunkHeight-canopyRadius*0.2} Q${branchX+rand()*15-7} ${y-trunkHeight*0.4} ${branchX+rand()*10-5} ${y-trunkHeight*0.1}" 
            stroke="${palette.leaves[2]}" stroke-width="${rand()*1.5+0.5}" fill="none" opacity="${rand()*0.3+0.4}"/>`;
        }).join('')}
      `;
    },
    
    autumn: () => {
      // Осеннее дерево - разноцветная листва
      const autumnColors = ['#D32F2F', '#F57C00', '#FFC107', '#FF9800', '#E65100'];
      return `
        <!-- Ствол -->
        <path d="M${x-trunkWidth/2} ${y} 
          Q${x-trunkWidth/2-2} ${y-trunkHeight*0.4} ${x-trunkWidth/3} ${y-trunkHeight*0.8}
          Q${x-trunkWidth/4} ${y-trunkHeight} ${x} ${y-trunkHeight}
          Q${x+trunkWidth/4} ${y-trunkHeight} ${x+trunkWidth/3} ${y-trunkHeight*0.8}
          Q${x+trunkWidth/2+2} ${y-trunkHeight*0.4} ${x+trunkWidth/2} ${y}
          Z" fill="${palette.trunk[1]}"/>
        
        <!-- Осенняя крона - разноцветные пятна -->
        <ellipse cx="${x}" cy="${y-trunkHeight-canopyRadius*0.7}" rx="${canopyRadius}" ry="${canopyRadius*0.8}" fill="${autumnColors[0]}" opacity="0.8"/>
        <ellipse cx="${x-canopyRadius*0.4}" cy="${y-trunkHeight-canopyRadius*0.5}" rx="${canopyRadius*0.6}" ry="${canopyRadius*0.5}" fill="${autumnColors[1]}" opacity="0.85"/>
        <ellipse cx="${x+canopyRadius*0.35}" cy="${y-trunkHeight-canopyRadius*0.6}" rx="${canopyRadius*0.55}" ry="${canopyRadius*0.45}" fill="${autumnColors[2]}" opacity="0.8"/>
        <ellipse cx="${x-canopyRadius*0.2}" cy="${y-trunkHeight-canopyRadius*0.9}" rx="${canopyRadius*0.4}" ry="${canopyRadius*0.35}" fill="${autumnColors[3]}" opacity="0.75"/>
        <ellipse cx="${x+canopyRadius*0.2}" cy="${y-trunkHeight-canopyRadius*0.95}" rx="${canopyRadius*0.35}" ry="${canopyRadius*0.3}" fill="${autumnColors[4]}" opacity="0.7"/>
        
        <!-- Падающие листья -->
        ${Array.from({length: 6}, () => {
          const lx = x + rand() * canopyRadius * 2 - canopyRadius;
          const ly = y - trunkHeight - canopyRadius + rand() * canopyRadius * 2;
          const color = autumnColors[Math.floor(rand() * autumnColors.length)];
          return `<ellipse cx="${lx}" cy="${ly}" rx="${rand()*4+2}" ry="${rand()*3+1.5}" fill="${color}" opacity="${rand()*0.4+0.3}" transform="rotate(${rand()*360} ${lx} ${ly})"/>`;
        }).join('')}
      `;
    }
  };
  
  return treeStyles[treeType]?.() || treeStyles.oak();
}

// Генератор кустарника
function generateBush(x: number, y: number, scale: number, palette: any, rand: () => number): string {
  const bushRadius = (rand() * 20 + 15) * scale;
  return `
    <!-- Кустарник -->
    <ellipse cx="${x}" cy="${y-bushRadius*0.3}" rx="${bushRadius*1.2}" ry="${bushRadius*0.8}" fill="${palette.leaves[1]}"/>
    <ellipse cx="${x-bushRadius*0.4}" cy="${y-bushRadius*0.15}" rx="${bushRadius*0.7}" ry="${bushRadius*0.5}" fill="${palette.leaves[0]}"/>
    <ellipse cx="${x+bushRadius*0.35}" cy="${y-bushRadius*0.2}" rx="${bushRadius*0.6}" ry="${bushRadius*0.45}" fill="${palette.leaves[2]}"/>
    <ellipse cx="${x-bushRadius*0.15}" cy="${y-bushRadius*0.5}" rx="${bushRadius*0.4}" ry="${bushRadius*0.3}" fill="${palette.leaves[3]}" opacity="0.6"/>
    
    <!-- Цветы на кусте (иногда) -->
    ${rand() > 0.5 ? Array.from({length: 3}, () => {
      const fx = x + (rand() - 0.5) * bushRadius;
      const fy = y - rand() * bushRadius * 0.6;
      return `<circle cx="${fx}" cy="${fy}" r="${rand()*3+2}" fill="${palette.accent[Math.floor(rand()*palette.accent.length)]}" opacity="0.8"/>`;
    }).join('') : ''}
  `;
}

// Генератор холма
function generateHill(startX: number, baseY: number, width: number, height: number, palette: any): string {
  return `
    <path d="M${startX} ${baseY} 
      Q${startX + width*0.25} ${baseY - height*0.7} ${startX + width*0.5} ${baseY - height}
      Q${startX + width*0.75} ${baseY - height*0.7} ${startX + width} ${baseY}
      Z" fill="${palette.ground[2]}" opacity="0.6"/>
    <path d="M${startX + width*0.1} ${baseY - height*0.2}
      Q${startX + width*0.35} ${baseY - height*0.8} ${startX + width*0.5} ${baseY - height*0.9}
      Q${startX + width*0.65} ${baseY - height*0.8} ${startX + width*0.9} ${baseY - height*0.2}
      Q${startX + width*0.5} ${baseY - height*0.4} ${startX + width*0.1} ${baseY - height*0.2}
      Z" fill="${palette.ground[3]}" opacity="0.4"/>
  `;
}

// Генератор персонажей по типу
function generateCharacter(type: string, w: number, h: number, palette: any, rand: () => number): string {
  const posX = w * 0.45;
  const posY = h * 0.52;

  const characters: Record<string, () => string> = {
    // Кот-детектив (по умолчанию)
    cat_detective: () => `
    <!-- КОТ-ДЕТЕКТИВ (главный герой) -->
    <g transform="translate(${posX}, ${posY})" filter="url(#fCharShadow)">
      <!-- Тень на земле -->
      <ellipse cx="0" cy="100" rx="55" ry="15" fill="rgba(0,0,0,0.2)"/>
      <!-- Хвост -->
      <path d="M40 70 Q70 50 65 30 Q60 10 70 0" stroke="#8B7355" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M40 70 Q70 50 65 30 Q60 10 70 0" stroke="#A08060" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- Задние лапы -->
      <ellipse cx="-25" cy="95" rx="18" ry="10" fill="#8B7355"/>
      <ellipse cx="25" cy="95" rx="18" ry="10" fill="#8B7355"/>
      <ellipse cx="-25" cy="92" rx="14" ry="7" fill="#A08060"/>
      <ellipse cx="25" cy="92" rx="14" ry="7" fill="#A08060"/>
      <!-- Тело (плащ детектива) -->
      <path d="M-40 20 Q-50 50 -45 85 Q-30 100 0 105 Q30 100 45 85 Q50 50 40 20 Q25 5 0 8 Q-25 5 -40 20" fill="#4A4A4A"/>
      <path d="M-38 25 Q-45 50 -42 75" stroke="#6A6A6A" stroke-width="3" fill="none"/>
      <path d="M38 25 Q45 50 42 75" stroke="#6A6A6A" stroke-width="3" fill="none"/>
      <circle cx="0" cy="35" r="3" fill="#2A2A2A"/>
      <circle cx="0" cy="50" r="3" fill="#2A2A2A"/>
      <circle cx="0" cy="65" r="3" fill="#2A2A2A"/>
      <!-- Пояс -->
      <rect x="-35" y="72" width="70" height="8" rx="2" fill="#3A3A3A"/>
      <rect x="-8" y="70" width="16" height="12" rx="2" fill="#8B7355"/>
      <!-- Передние лапы -->
      <ellipse cx="-35" cy="75" rx="12" ry="8" fill="#8B7355"/>
      <ellipse cx="35" cy="75" rx="12" ry="8" fill="#8B7355"/>
      <ellipse cx="-35" cy="73" rx="8" ry="5" fill="#A08060"/>
      <ellipse cx="35" cy="73" rx="8" ry="5" fill="#A08060"/>
      <!-- Голова кота -->
      <ellipse cx="0" cy="-25" rx="38" ry="35" fill="#8B7355"/>
      <!-- Уши -->
      <path d="M-28 -52 L-20 -75 L-8 -50 Z" fill="#8B7355"/>
      <path d="M28 -52 L20 -75 L8 -50 Z" fill="#8B7355"/>
      <path d="M-24 -52 L-20 -68 L-12 -52 Z" fill="#E8B4B4"/>
      <path d="M24 -52 L20 -68 L12 -52 Z" fill="#E8B4B4"/>
      <!-- Морда -->
      <ellipse cx="0" cy="-15" rx="22" ry="18" fill="#C4A882"/>
      <!-- Глаза -->
      <ellipse cx="-12" cy="-30" rx="10" ry="12" fill="white"/>
      <ellipse cx="12" cy="-30" rx="10" ry="12" fill="white"/>
      <ellipse cx="-10" cy="-28" rx="5" ry="8" fill="#4A8B4A"/>
      <ellipse cx="10" cy="-28" rx="5" ry="8" fill="#4A8B4A"/>
      <circle cx="-8" cy="-32" r="3" fill="white"/>
      <circle cx="12" cy="-32" r="3" fill="white"/>
      <circle cx="-12" cy="-26" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="8" cy="-26" r="1.5" fill="white" opacity="0.6"/>
      <!-- Нос -->
      <path d="M0 -15 L-4 -8 L4 -8 Z" fill="#E8A0A0"/>
      <!-- Рот -->
      <path d="M0 -8 Q-6 -3 -10 -5" fill="none" stroke="#5A4040" stroke-width="1.5"/>
      <path d="M0 -8 Q6 -3 10 -5" fill="none" stroke="#5A4040" stroke-width="1.5"/>
      <!-- Усы -->
      <line x1="-8" y1="-10" x2="-30" y2="-15" stroke="#4A4A4A" stroke-width="1"/>
      <line x1="-8" y1="-8" x2="-32" y2="-8" stroke="#4A4A4A" stroke-width="1"/>
      <line x1="-8" y1="-6" x2="-28" y2="-2" stroke="#4A4A4A" stroke-width="1"/>
      <line x1="8" y1="-10" x2="30" y2="-15" stroke="#4A4A4A" stroke-width="1"/>
      <line x1="8" y1="-8" x2="32" y2="-8" stroke="#4A4A4A" stroke-width="1"/>
      <line x1="8" y1="-6" x2="28" y2="-2" stroke="#4A4A4A" stroke-width="1"/>
      <!-- Шляпа детектива -->
      <ellipse cx="0" cy="-55" rx="42" ry="8" fill="#3A3A3A"/>
      <path d="M-32 -55 Q-35 -70 -25 -78 Q-10 -85 0 -85 Q10 -85 25 -78 Q35 -70 32 -55" fill="#4A4A4A"/>
      <rect x="-30" y="-62" width="60" height="8" fill="#3A3A3A"/>
      <rect x="-32" y="-58" width="64" height="4" fill="#8B4513"/>
      <path d="M20 -78 Q30 -95 25 -85 Q22 -90 28 -100" stroke="#2A2A2A" stroke-width="2" fill="none"/>
      <!-- Лупа -->
      <g transform="translate(45, 40) rotate(25)">
        <circle cx="0" cy="0" r="18" fill="none" stroke="#8B7355" stroke-width="5"/>
        <circle cx="0" cy="0" r="14" fill="rgba(200,220,255,0.3)"/>
        <line x1="14" y1="14" x2="28" y2="28" stroke="#8B7355" stroke-width="6" stroke-linecap="round"/>
        <ellipse cx="-5" cy="-5" rx="6" ry="4" fill="white" opacity="0.4"/>
      </g>
      <!-- Записная книжка -->
      <g transform="translate(-50, 50) rotate(-10)">
        <rect x="-12" y="-18" width="24" height="36" rx="2" fill="#2A2A2A"/>
        <rect x="-10" y="-16" width="20" height="32" fill="#F5F5DC"/>
        <line x1="-8" y1="-10" x2="6" y2="-10" stroke="#4A4A4A" stroke-width="1"/>
        <line x1="-8" y1="-5" x2="6" y2="-5" stroke="#4A4A4A" stroke-width="1"/>
        <line x1="-8" y1="0" x2="6" y2="0" stroke="#4A4A4A" stroke-width="1"/>
        <line x1="-8" y1="5" x2="3" y2="5" stroke="#4A4A4A" stroke-width="1"/>
      </g>
    </g>`,

    // Волшебник
    wizard: () => `
    <!-- Волшебник -->
    <g transform="translate(${w*0.45}, ${h*0.52})" filter="url(#fCharShadow)">
      <ellipse cx="0" cy="100" rx="45" ry="14" fill="rgba(0,0,0,0.2)"/>
      <!-- Мантия -->
      <path d="M-40 30 Q-50 60 -40 95 Q0 115 40 95 Q50 60 40 30 Q20 10 0 15 Q-20 10 -40 30" fill="#5A3A8A"/>
      <path d="M-25 45 Q0 55 25 45" fill="none" stroke="#7A5AAA" stroke-width="2" opacity="0.5"/>
      <!-- Голова -->
      <circle cx="0" cy="-10" r="30" fill="${palette.skin[0]}"/>
      <!-- Борода -->
      <path d="M-18 10 Q-25 45 -10 65 Q0 75 10 65 Q25 45 18 10" fill="#E0E0E0"/>
      <!-- Глаза -->
      <ellipse cx="-10" cy="-15" rx="6" ry="7" fill="white"/>
      <ellipse cx="10" cy="-15" rx="6" ry="7" fill="white"/>
      <circle cx="-8" cy="-14" r="4" fill="#4A3A6B"/>
      <circle cx="12" cy="-14" r="4" fill="#4A3A6B"/>
      <circle cx="-7" cy="-16" r="1.5" fill="white"/>
      <circle cx="13" cy="-16" r="1.5" fill="white"/>
      <!-- Брови -->
      <path d="M-16 -25 Q-10 -30 -4 -24" fill="none" stroke="#666" stroke-width="2"/>
      <path d="M4 -24 Q10 -30 16 -25" fill="none" stroke="#666" stroke-width="2"/>
      <!-- Нос -->
      <path d="M0 -5 Q4 5 0 8 Q-3 5 0 -5" fill="${palette.skinShadow[0]}" opacity="0.4"/>
      <!-- Шляпа волшебника -->
      <path d="M-35 -20 Q-40 -50 -25 -80 Q-10 -110 0 -120 Q10 -110 25 -80 Q40 -50 35 -20 Q15 -35 0 -38 Q-15 -35 -35 -20" fill="#4A3A7A"/>
      <ellipse cx="0" cy="-20" rx="35" ry="12" fill="#5A4A8A"/>
      <!-- Звёзды на шляпе -->
      <circle cx="-15" cy="-60" r="3" fill="${palette.accent[0]}"/>
      <circle cx="10" cy="-80" r="4" fill="${palette.accent[1]}"/>
      <circle cx="-5" cy="-100" r="3" fill="${palette.accent[0]}"/>
      <circle cx="0" cy="-115" r="5" fill="${palette.accent[1]}"/>
      <!-- Посох -->
      <line x1="40" y1="15" x2="55" y2="95" stroke="#8B4513" stroke-width="6"/>
      <line x1="40" y1="15" x2="55" y2="95" stroke="#A0522D" stroke-width="3"/>
      <circle cx="45" cy="5" r="15" fill="${palette.accent[0]}" filter="url(#fGlow)"/>
      <circle cx="45" cy="5" r="10" fill="${palette.accent[1]}"/>
      <circle cx="42" cy="0" r="4" fill="white" opacity="0.6"/>
    </g>`,

    // Фея
    fairy: () => `
    <!-- Фея -->
    <g transform="translate(${w*0.45}, ${h*0.55})" filter="url(#fCharShadow)">
      <ellipse cx="0" cy="80" rx="30" ry="10" fill="rgba(0,0,0,0.15)"/>
      <!-- Крылья -->
      <ellipse cx="-25" cy="-5" rx="25" ry="40" fill="${palette.accent[0]}" opacity="0.35"/>
      <ellipse cx="25" cy="-5" rx="25" ry="40" fill="${palette.accent[0]}" opacity="0.35"/>
      <path d="M-35 -15 Q-45 0 -28 10" fill="none" stroke="white" stroke-width="1.5" opacity="0.5"/>
      <path d="M35 -15 Q45 0 28 10" fill="none" stroke="white" stroke-width="1.5" opacity="0.5"/>
      <!-- Платье -->
      <path d="M-20 25 Q-25 55 -18 75 Q0 85 18 75 Q25 55 20 25 Q12 10 0 15 Q-12 10 -20 25" fill="#5DDDCD"/>
      <path d="M-12 40 Q0 50 12 40" fill="none" stroke="#7EEEE0" stroke-width="2" opacity="0.6"/>
      <!-- Руки -->
      <path d="M-22 20 Q-35 25 -30 40" fill="none" stroke="${palette.skin[0]}" stroke-width="6" stroke-linecap="round"/>
      <path d="M22 20 Q35 25 30 40" fill="none" stroke="${palette.skin[0]}" stroke-width="6" stroke-linecap="round"/>
      <!-- Голова -->
      <circle cx="0" cy="-15" r="22" fill="${palette.skin[0]}"/>
      <!-- Волосы -->
      <path d="M-20 -20 Q-10 -50 0 -45 Q10 -50 20 -20 Q12 -35 0 -32 Q-12 -35 -20 -20" fill="${palette.hair[0]}"/>
      <!-- Глаза -->
      <ellipse cx="-7" cy="-18" rx="6" ry="9" fill="white"/>
      <ellipse cx="7" cy="-18" rx="6" ry="9" fill="white"/>
      <circle cx="-5" cy="-16" r="4" fill="${palette.hair[0]}"/>
      <circle cx="9" cy="-16" r="4" fill="${palette.hair[0]}"/>
      <circle cx="-4" cy="-19" r="2" fill="white"/>
      <circle cx="10" cy="-19" r="2" fill="white"/>
      <!-- Румянец -->
      <ellipse cx="-12" cy="-8" rx="5" ry="3" fill="${palette.accent[0]}" opacity="0.35"/>
      <ellipse cx="12" cy="-8" rx="5" ry="3" fill="${palette.accent[0]}" opacity="0.35"/>
      <!-- Рот -->
      <path d="M-4 -2 Q0 2 4 -2" fill="none" stroke="#C08080" stroke-width="2"/>
      <!-- Волшебная палочка -->
      <line x1="35" y1="25" x2="55" y2="10" stroke="#FFD700" stroke-width="3"/>
      <circle cx="57" cy="8" r="6" fill="${palette.accent[0]}" filter="url(#fGlow)"/>
      <!-- Искры -->
      ${Array.from({length: 10}, () => {
        const sx = rand() * 80 - 40;
        const sy = rand() * 100 - 50;
        const sr = rand() * 3 + 1;
        return `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="${palette.accent[1]}" filter="url(#fGlow)" opacity="${rand()*0.5+0.3}"/>`;
      }).join('')}
    </g>`,

    // Рыцарь
    knight: () => `
    <!-- Рыцарь -->
    <g transform="translate(${w*0.45}, ${h*0.50})" filter="url(#fCharShadow)">
      <ellipse cx="0" cy="105" rx="50" ry="15" fill="rgba(0,0,0,0.2)"/>
      <!-- Ноги в броне -->
      <rect x="-25" y="60" width="22" height="45" rx="5" fill="#6A6A6A"/>
      <rect x="3" y="60" width="22" height="45" rx="5" fill="#6A6A6A"/>
      <rect x="-23" y="55" width="18" height="15" rx="3" fill="#7A7A7A"/>
      <rect x="5" y="55" width="18" height="15" rx="3" fill="#7A7A7A"/>
      <!-- Тело (броня) -->
      <path d="M-35 10 Q-45 35 -40 60 Q-25 75 0 80 Q25 75 40 60 Q45 35 35 10 Q20 -5 0 0 Q-20 -5 -35 10" fill="#7A7A7A"/>
      <path d="M-30 20 Q0 35 30 20" fill="none" stroke="#5A5A5A" stroke-width="2"/>
      <path d="M-25 35 Q0 50 25 35" fill="none" stroke="#5A5A5A" stroke-width="2"/>
      <!-- Герб -->
      <circle cx="0" cy="25" r="12" fill="#C41E3A"/>
      <path d="M0 15 L3 22 L10 22 L5 27 L7 35 L0 30 L-7 35 L-5 27 L-10 22 L-3 22 Z" fill="#FFD700"/>
      <!-- Плечи -->
      <ellipse cx="-40" cy="5" rx="18" ry="12" fill="#6A6A6A"/>
      <ellipse cx="40" cy="5" rx="18" ry="12" fill="#6A6A6A"/>
      <!-- Руки -->
      <rect x="-55" y="5" width="15" height="50" rx="5" fill="#6A6A6A"/>
      <rect x="40" y="5" width="15" height="50" rx="5" fill="#6A6A6A"/>
      <!-- Шлем -->
      <path d="M-25 -25 Q-30 -50 -20 -65 Q-10 -80 0 -82 Q10 -80 20 -65 Q30 -50 25 -25 Q15 -15 0 -12 Q-15 -15 -25 -25" fill="#6A6A6A"/>
      <rect x="-28" y="-30" width="56" height="15" rx="3" fill="#5A5A5A"/>
      <!-- Забрало -->
      <rect x="-20" y="-25" width="40" height="20" rx="2" fill="#4A4A4A"/>
      <line x1="-18" y1="-20" x2="18" y2="-20" stroke="#3A3A3A" stroke-width="1"/>
      <line x1="-18" y1="-15" x2="18" y2="-15" stroke="#3A3A3A" stroke-width="1"/>
      <line x1="-18" y1="-10" x2="18" y2="-10" stroke="#3A3A3A" stroke-width="1"/>
      <!-- Глаза через забрало -->
      <ellipse cx="-8" cy="-18" rx="4" ry="3" fill="#222"/>
      <ellipse cx="8" cy="-18" rx="4" ry="3" fill="#222"/>
      <!-- Меч -->
      <rect x="60" y="-20" width="6" height="70" fill="#C0C0C0"/>
      <rect x="58" y="-25" width="10" height="8" fill="#8B4513"/>
      <rect x="50" y="-28" width="26" height="5" rx="2" fill="#FFD700"/>
      <!-- Щит -->
      <path d="M-70 -10 L-70 40 Q-70 60 -55 70 Q-45 75 -45 75 Q-45 75 -35 70 Q-20 60 -20 40 L-20 -10 Q-45 0 -70 -10" fill="#4A4A4A" stroke="#C41E3A" stroke-width="3"/>
      <circle cx="-45" cy="25" r="15" fill="#C41E3A"/>
    </g>`,

    // Робот
    robot: () => `
    <!-- Робот -->
    <g transform="translate(${w*0.45}, ${h*0.52})" filter="url(#fCharShadow)">
      <ellipse cx="0" cy="100" rx="50" ry="15" fill="rgba(0,0,0,0.2)"/>
      <!-- Ноги -->
      <rect x="-30" y="55" width="25" height="45" rx="5" fill="#5A5A6A"/>
      <rect x="5" y="55" width="25" height="45" rx="5" fill="#5A5A6A"/>
      <rect x="-28" y="90" width="21" height="15" rx="3" fill="#4A4A5A"/>
      <rect x="7" y="90" width="21" height="15" rx="3" fill="#4A4A5A"/>
      <!-- Тело -->
      <rect x="-35" y="-10" width="70" height="70" rx="10" fill="#6A6A7A"/>
      <rect x="-30" y="-5" width="60" height="60" rx="8" fill="#5A5A6A"/>
      <!-- Грудь - дисплей/свет -->
      <rect x="-20" y="5" width="40" height="30" rx="5" fill="#2A2A3A"/>
      <circle cx="-8" cy="15" r="5" fill="#00FF00" opacity="0.8"/>
      <circle cx="8" cy="15" r="5" fill="#00FF00" opacity="0.8"/>
      <rect x="-12" y="25" width="24" height="4" fill="#00FF00" opacity="0.5"/>
      <!-- Руки -->
      <rect x="-60" y="-5" width="22" height="55" rx="5" fill="#5A5A6A"/>
      <rect x="38" y="-5" width="22" height="55" rx="5" fill="#5A5A6A"/>
      <!-- Клешни -->
      <path d="M-58 50 L-70 65 L-55 60 L-58 50" fill="#4A4A5A"/>
      <path d="M-50 50 L-38 65 L-53 60 L-50 50" fill="#4A4A5A"/>
      <path d="M58 50 L70 65 L55 60 L58 50" fill="#4A4A5A"/>
      <path d="M50 50 L38 65 L53 60 L50 50" fill="#4A4A5A"/>
      <!-- Шея -->
      <rect x="-10" y="-25" width="20" height="18" fill="#4A4A5A"/>
      <!-- Голова -->
      <rect x="-30" y="-70" width="60" height="50" rx="10" fill="#6A6A7A"/>
      <rect x="-25" y="-65" width="50" height="40" rx="8" fill="#5A5A6A"/>
      <!-- Глаза-экраны -->
      <rect x="-20" y="-58" width="15" height="20" rx="3" fill="#00FFFF"/>
      <rect x="5" y="-58" width="15" height="20" rx="3" fill="#00FFFF"/>
      <!-- Антенны -->
      <line x1="-15" y1="-70" x2="-20" y2="-90" stroke="#4A4A5A" stroke-width="3"/>
      <circle cx="-20" cy="-93" r="5" fill="#FF0000"/>
      <line x1="15" y1="-70" x2="20" y2="-85" stroke="#4A4A5A" stroke-width="3"/>
      <circle cx="20" cy="-88" r="4" fill="#00FF00"/>
      <!-- Уши-динамики -->
      <rect x="-38" y="-60" width="8" height="25" rx="2" fill="#4A4A5A"/>
      <rect x="30" y="-60" width="8" height="25" rx="2" fill="#4A4A5A"/>
    </g>`
  };

  // Возвращаем персонажа по типу, или кота-детектива по умолчанию
  return characters[type]?.() || characters.cat_detective();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scene = {},
      style = 'ghibli',
      dimensions = { width: 1024, height: 576 },
      taskDescription = '',
      taskType = 'scene',
      customText = {}
    } = body;
    
    console.log('[SVG-Coordinator v6.7.0] Task:', taskType, 'Style:', style, 'TZ:', taskDescription?.substring(0, 50));
    const startTime = Date.now();
    
    // AI-анализ ТЗ - понимает ЛЮБОЕ описание
    const tzAnalysis = await analyzeTZWithAI(taskDescription);
    console.log('[SVG-Coordinator] AI Analysis result:', tzAnalysis);
    const aiAnalysisTime = Date.now() - startTime;
    
    const settings = {
      width: dimensions.width,
      height: dimensions.height,
      location: tzAnalysis.location || scene.location || 'волшебный лес',
      timeOfDay: tzAnalysis.timeOfDay || scene.timeOfDay || 'день',
      mood: tzAnalysis.mood || scene.mood || 'сказочный',
      style,
      taskDescription,
      taskType,
      customText,
      palette: STYLE_PALETTES[style] || STYLE_PALETTES.ghibli,
      // Результаты AI-анализа
      tzAnalysis
    };
    
    // Генерация агентов
    const results: any = {};
    for (const agent of SVG_AGENTS) {
      const agentStart = Date.now();
      try {
        results[agent.id] = {
          success: true,
          svg: generateAgentSVG(agent.id, settings),
          executionTime: Date.now() - agentStart
        };
      } catch (e: any) {
        results[agent.id] = { success: false, error: e.message, executionTime: Date.now() - agentStart };
      }
    }
    
    const agentsTime = Date.now() - startTime;
    
    // Композитор - передаём результаты AI-анализа
    const composerStart = Date.now();
    const finalScene = composeFinalScene({ settings, dimensions, taskType, customText, taskDescription, tzAnalysis });
    const composerTime = Date.now() - composerStart;
    
    const storyboard = {
      frames: SVG_AGENTS.map((a, i) => ({
        id: i + 1,
        agentId: a.id,
        agentName: a.name,
        agentIcon: a.icon,
        svg: results[a.id]?.svg || '',
        success: results[a.id]?.success || false,
        executionTime: results[a.id]?.executionTime || 0
      }))
    };
    
    return NextResponse.json({
      success: true,
      version: '6.7.0',
      taskType,
      taskDescription: taskDescription || null,
      tzAnalysis: {
        characterType: tzAnalysis.characterType,
        characterName: tzAnalysis.characterName,
        mood: tzAnalysis.mood,
        location: tzAnalysis.location,
        timeOfDay: tzAnalysis.timeOfDay,
        customElements: tzAnalysis.customElements
      },
      executionTime: agentsTime,
      composerTime,
      aiAnalysisTime,
      totalTime: Date.now() - startTime,
      agents: results,
      storyboard,
      finalScene: { svg: finalScene, success: true },
      message: `Создано ${storyboard.frames.length} кадров + финальная сцена за ${Date.now() - startTime}мс (AI-анализ: ${aiAnalysisTime}мс)`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function generateAgentSVG(id: string, s: any): string {
  const { width: w, height: h, style, mood, timeOfDay, location, taskType, customText, palette } = s;
  const rand = seededRandom(42);
  
  const generators: Record<string, () => string> = {
    palette: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1a1a2e"/><stop offset="50%" stop-color="#16213e"/><stop offset="100%" stop-color="#0f0f1a"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)"/>
      <text x="${w/2}" y="40" text-anchor="middle" font-size="28" font-weight="bold" fill="white" filter="url(#glow)">🎨 Цветовая палитра</text>
      <text x="${w/2}" y="65" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.5)">Style: ${style.toUpperCase()} • v6.1</text>
      
      <g transform="translate(40, 95)">
        <text y="0" font-size="14" fill="rgba(255,255,255,0.7)" font-weight="600">НЕБО</text>
        ${palette.sky.map((c: string, i: number) => `<rect x="${i*70}" y="15" width="60" height="60" rx="8" fill="${c}" filter="url(#glow)"/>`).join('')}
      </g>
      <g transform="translate(40, 185)">
        <text y="0" font-size="14" fill="rgba(255,255,255,0.7)" font-weight="600">ЗЕМЛЯ</text>
        ${palette.ground.map((c: string, i: number) => `<rect x="${i*70}" y="15" width="60" height="60" rx="8" fill="${c}" filter="url(#glow)"/>`).join('')}
      </g>
      <g transform="translate(40, 275)">
        <text y="0" font-size="14" fill="rgba(255,255,255,0.7)" font-weight="600">ЛИСТВА</text>
        ${palette.leaves.map((c: string, i: number) => `<rect x="${i*70}" y="15" width="60" height="60" rx="8" fill="${c}" filter="url(#glow)"/>`).join('')}
      </g>
      <g transform="translate(40, 365)">
        <text y="0" font-size="14" fill="rgba(255,255,255,0.7)" font-weight="600">СТВОЛЫ</text>
        ${palette.trunk.map((c: string, i: number) => `<rect x="${i*70}" y="15" width="60" height="60" rx="8" fill="${c}" filter="url(#glow)"/>`).join('')}
      </g>
      <g transform="translate(400, 95)">
        <text y="0" font-size="14" fill="rgba(255,255,255,0.7)" font-weight="600">АКЦЕНТЫ</text>
        ${palette.accent.map((c: string, i: number) => `<rect x="${i*55}" y="15" width="48" height="48" rx="6" fill="${c}"/>`).join('')}
      </g>
      <g transform="translate(400, 175)">
        <text y="0" font-size="14" fill="rgba(255,255,255,0.7)" font-weight="600">ДОПОЛНИТЕЛЬНО</text>
        <rect y="15" width="35" height="35" rx="5" fill="${palette.skin[0]}"/>
        <rect x="42" y="15" width="35" height="35" rx="5" fill="${palette.hair[0]}"/>
        <rect x="84" y="15" width="35" height="35" rx="5" fill="${palette.water[0]}"/>
        <rect x="126" y="15" width="35" height="35" rx="5" fill="${palette.fog}"/>
      </g>
      <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.15)">ФОРТОРИУМ v6.7</text>
    </svg>`,
    
    background: () => {
      const timeColors: Record<string, {sky: string[], sun: string, sunY: number}> = {
        'день': { sky: palette.sky, sun: '#FFD700', sunY: 0.12 },
        'ночь': { sky: ['#0D1B2A', '#1B263B', '#2D3E50', '#415A77', '#5A7090'], sun: '#F5F5DC', sunY: 0.15 },
        'вечер': { sky: ['#FF6B35', '#F7931E', '#FFB347', '#FFD700', '#FFE4B5'], sun: '#FF4500', sunY: 0.35 },
        'рассвет': { sky: ['#FFB6C1', '#FFC0CB', '#FFDAB9', '#FFE4E1', '#FFF0F5'], sun: '#FFA500', sunY: 0.45 }
      };
      const tc = timeColors[timeOfDay] || timeColors['день'];
      
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            ${tc.sky.map((c: string, i: number) => `<stop offset="${i*25}%" stop-color="${c}"/>`).join('')}
          </linearGradient>
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            ${palette.ground.map((c: string, i: number) => `<stop offset="${i*25}%" stop-color="${c}"/>`).join('')}
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${tc.sun}"/><stop offset="60%" stop-color="${tc.sun}" stop-opacity="0.2"/><stop offset="100%" stop-color="${tc.sun}" stop-opacity="0"/>
          </radialGradient>
          <filter id="sunBlur"><feGaussianBlur stdDeviation="8"/></filter>
        </defs>
        <rect width="100%" height="${h*0.65}" fill="url(#skyGrad)"/>
        ${timeOfDay === 'ночь' ? `
          ${Array.from({length: 50}, () => `<circle cx="${rand()*w}" cy="${rand()*h*0.45}" r="${rand()*2+0.5}" fill="white" opacity="${rand()*0.5+0.3}"/>`).join('')}
          <circle cx="${w*0.8}" cy="${h*0.12}" r="35" fill="#F5F5DC"/>
        ` : `
          <circle cx="${w*0.82}" cy="${h*tc.sunY}" r="80" fill="${tc.sun}" opacity="0.15" filter="url(#sunBlur)"/>
          <circle cx="${w*0.82}" cy="${h*tc.sunY}" r="30" fill="${tc.sun}"/>
          <circle cx="${w*0.82}" cy="${h*tc.sunY}" r="20" fill="#FFFACD"/>
        `}
        <path d="M0 ${h*0.6} C${w*0.1} ${h*0.45} ${w*0.2} ${h*0.35} ${w*0.35} ${h*0.32} C${w*0.5} ${h*0.3} ${w*0.65} ${h*0.35} ${w*0.8} ${h*0.28} C${w*0.92} ${h*0.35} ${w} ${h*0.4} ${w} ${h*0.5} L${w} ${h*0.65} L0 ${h*0.65} Z" fill="${palette.sky[4]}" opacity="0.4"/>
        <rect y="${h*0.62}" width="100%" height="${h*0.38}" fill="url(#groundGrad)"/>
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">🌄 Фон</text>
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`;
    },
    
    landscape: () => {
      const landRand = seededRandom(777);
      const treeTypes = ['oak', 'pine', 'birch', 'willow', 'autumn'];
      
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="landBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#87CEEB"/><stop offset="100%" stop-color="${palette.ground[2]}"/>
          </linearGradient>
          <linearGradient id="landGround" x1="0%" y1="0%" x2="0%" y2="100%">
            ${palette.ground.map((c: string, i: number) => `<stop offset="${i*25}%" stop-color="${c}"/>`).join('')}
          </linearGradient>
          <filter id="treeShadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="rgba(0,0,0,0.3)"/></filter>
          <filter id="bushBlur"><feGaussianBlur stdDeviation="0.5"/></filter>
        </defs>
        
        <!-- Небо -->
        <rect width="100%" height="${h*0.55}" fill="#87CEEB"/>
        
        <!-- Дistant холмы -->
        ${generateHill(0, h*0.55, w*0.4, h*0.15, palette)}
        ${generateHill(w*0.35, h*0.55, w*0.35, h*0.12, palette)}
        ${generateHill(w*0.65, h*0.55, w*0.35, h*0.18, palette)}
        
        <!-- Ближние холмы -->
        <path d="M0 ${h*0.6} Q${w*0.15} ${h*0.48} ${w*0.3} ${h*0.55} Q${w*0.45} ${h*0.5} ${w*0.6} ${h*0.52} Q${w*0.8} ${h*0.48} ${w} ${h*0.55} L${w} ${h*0.65} L0 ${h*0.65} Z" fill="${palette.ground[3]}" opacity="0.7"/>
        
        <!-- Основная земля -->
        <rect y="${h*0.55}" width="100%" height="${h*0.45}" fill="url(#landGround)"/>
        
        <!-- Трава -->
        ${Array.from({length: 150}, () => {
          const x = landRand() * w;
          const y = h*0.58 + landRand() * h*0.4;
          const h_ = landRand() * 18 + 5;
          const curve = landRand() * 12 - 6;
          const color = palette.ground[Math.floor(landRand() * 3)];
          return `<path d="M${x} ${y} Q${x+curve} ${y-h_/2} ${x+curve*0.7} ${y-h_}" stroke="${color}" stroke-width="${landRand()*1.5+0.3}" fill="none" opacity="${landRand()*0.4+0.25}"/>`;
        }).join('')}
        
        <!-- Дальний ряд деревьев (мелкие, бледные) -->
        ${Array.from({length: 8}, (_, i) => {
          const x = w * 0.05 + i * w * 0.12 + landRand() * 30;
          const y = h * 0.52;
          const scale = 0.4 + landRand() * 0.15;
          const type = treeTypes[Math.floor(landRand() * treeTypes.length)];
          return `<g opacity="0.5" transform="translate(0, -${h*0.05})">${generateDetailedTree(x, y, scale, palette, landRand, type)}</g>`;
        }).join('')}
        
        <!-- Средний ряд деревьев -->
        ${Array.from({length: 6}, (_, i) => {
          const x = w * 0.08 + i * w * 0.16 + landRand() * 40;
          const y = h * 0.62;
          const scale = 0.6 + landRand() * 0.2;
          const type = treeTypes[Math.floor(landRand() * treeTypes.length)];
          return `<g filter="url(#treeShadow)">${generateDetailedTree(x, y, scale, palette, landRand, type)}</g>`;
        }).join('')}
        
        <!-- Кустарники -->
        ${Array.from({length: 12}, () => {
          const x = landRand() * w;
          const y = h * 0.72 + landRand() * h * 0.18;
          const scale = 0.6 + landRand() * 0.5;
          return generateBush(x, y, scale, palette, landRand);
        }).join('')}
        
        <!-- Ближний ряд деревьев (крупные) -->
        ${Array.from({length: 3}, (_, i) => {
          const positions = [0.12, 0.5, 0.88];
          const x = w * positions[i] + landRand() * 30 - 15;
          const y = h * 0.78;
          const scale = 0.9 + landRand() * 0.3;
          const type = treeTypes[Math.floor(landRand() * 3)];
          return `<g filter="url(#treeShadow)">${generateDetailedTree(x, y, scale, palette, landRand, type)}</g>`;
        }).join('')}
        
        <!-- Цветы -->
        ${Array.from({length: 15}, () => {
          const x = landRand() * w;
          const y = h * 0.8 + landRand() * h * 0.15;
          const r = landRand() * 5 + 3;
          const color = palette.accent[Math.floor(landRand() * palette.accent.length)];
          return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${landRand()*0.4+0.4}"/>
                  <circle cx="${x}" cy="${y}" r="${r*0.4}" fill="#FFD700" opacity="0.8"/>`;
        }).join('')}
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">🌳 Ландшафт</text>
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`;
    },
    
    perspective: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <defs>
        <linearGradient id="perspBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#0f0f1a"/>
        </linearGradient>
        <radialGradient id="vp" cx="50%" cy="30%" r="15%">
          <stop offset="0%" stop-color="#FF6B6B"/><stop offset="100%" stop-color="transparent"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#perspBg)"/>
      <g opacity="0.5">${Array.from({length: 20}, (_, i) => `<line x1="${w/2}" y1="${h*0.3}" x2="${w/2 + Math.tan((i-10)*8*Math.PI/180)*h}" y2="${h}" stroke="rgba(100,150,255,0.12)"/>`).join('')}</g>
      <line x1="0" y1="${h*0.3}" x2="${w}" y2="${h*0.3}" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="10,5"/>
      <circle cx="${w/2}" cy="${h*0.3}" r="35" fill="url(#vp)"/><circle cx="${w/2}" cy="${h*0.3}" r="10" fill="#FF6B6B"/>
      <text x="${w/2}" y="${h*0.3-50}" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.7)">Точка схода</text>
      <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
      <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">📐 Перспектива</text>
      <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
    </svg>`,
    
    composition: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="compBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#0f0f1a"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#compBg)"/>
      <g stroke="rgba(255,255,255,0.2)" stroke-width="1">
        <line x1="${w/3}" y1="55" x2="${w/3}" y2="${h-20}"/><line x1="${w*2/3}" y1="55" x2="${w*2/3}" y2="${h-20}"/>
        <line x1="20" y1="${h/3}" x2="${w-20}" y2="${h/3}"/><line x1="20" y1="${h*2/3}" x2="${w-20}" y2="${h*2/3}"/>
      </g>
      ${[{x:w/3,y:h/3},{x:w*2/3,y:h/3},{x:w/3,y:h*2/3},{x:w*2/3,y:h*2/3}].map((p,i) => `<circle cx="${p.x}" cy="${p.y}" r="25" fill="rgba(255,107,107,0.25)" stroke="${palette.accent[0]}" stroke-width="2"/><text x="${p.x}" y="${p.y+6}" text-anchor="middle" font-size="16" font-weight="bold" fill="white">${i+1}</text>`).join('')}
      <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
      <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">📊 Композиция</text>
      <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
    </svg>`,
    
    lighting: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <defs>
        <linearGradient id="lightBg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#0d0d1a"/></linearGradient>
        <radialGradient id="lightSource" cx="75%" cy="12%" r="45%"><stop offset="0%" stop-color="#FFD700"/><stop offset="100%" stop-color="transparent"/></radialGradient>
        <filter id="softGlow"><feGaussianBlur stdDeviation="10"/></filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#lightBg)"/>
      <circle cx="${w*0.75}" cy="${h*0.12}" r="80" fill="url(#lightSource)" filter="url(#softGlow)"/>
      <circle cx="${w*0.75}" cy="${h*0.12}" r="25" fill="#FFD700"/>
      <g transform="translate(${w*0.35}, ${h*0.5})">
        <ellipse cx="40" cy="80" rx="60" ry="15" fill="rgba(0,0,0,0.35)"/>
        <rect x="0" y="0" width="80" height="80" rx="10" fill="${palette.accent[0]}"/>
        <rect x="10" y="10" width="30" height="30" rx="5" fill="rgba(255,255,255,0.3)"/>
        <rect x="50" y="0" width="30" height="80" fill="rgba(0,0,0,0.2)"/>
      </g>
      <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
      <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">💡 Освещение</text>
      <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
    </svg>`,
    
    details: () => {
      const detRand = seededRandom(123);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs><linearGradient id="detBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a3a2e"/><stop offset="100%" stop-color="#0d1f17"/></linearGradient></defs>
        <rect width="100%" height="100%" fill="url(#detBg)"/>
        ${Array.from({length: 100}, () => `<path d="M${detRand()*w} ${h*0.45+detRand()*h*0.5} Q${detRand()*w} ${h*0.3} ${detRand()*w} ${h*0.2}" stroke="${palette.ground[Math.floor(detRand()*3)]}" stroke-width="${detRand()*2+0.5}" fill="none" opacity="${detRand()*0.4+0.3}"/>`).join('')}
        ${Array.from({length: 20}, () => `<circle cx="${detRand()*w}" cy="${detRand()*h}" r="${detRand()*3+1}" fill="white" opacity="${detRand()*0.4+0.2}"/>`).join('')}
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">✨ Детали</text>
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`;
    },
    
    objects: () => {
      const objRand = seededRandom(456);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs><linearGradient id="objBg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1e2d2d"/><stop offset="100%" stop-color="#152222"/></linearGradient></defs>
        <rect width="100%" height="100%" fill="url(#objBg)"/>
        <rect y="${h*0.78}" width="100%" height="${h*0.22}" fill="rgba(0,0,0,0.2)"/>
        ${generateDetailedTree(150, h*0.75, 0.8, palette, objRand, 'oak')}
        ${generateDetailedTree(w-150, h*0.78, 0.7, palette, objRand, 'pine')}
        ${generateBush(w*0.5, h*0.85, 0.8, palette, objRand)}
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">🪑 Предметы</text>
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`;
    },
    
    characters: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="charBg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#0d0d1a"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#charBg)"/>
      <ellipse cx="${w/2}" cy="${h*0.85}" rx="${w*0.4}" ry="25" fill="rgba(0,0,0,0.25)"/>
      <g transform="translate(${w*0.35}, ${h*0.5})">
        <path d="M-35 35 Q-40 70 -30 100 Q0 115 30 100 Q40 70 35 35 Q25 15 0 20 Q-25 15 -35 35" fill="#6B4E9E"/>
        <circle cx="0" cy="-20" r="25" fill="${palette.skin[0]}"/>
        <path d="M-30 -25 Q0 -70 30 -25 Q15 -45 0 -40 Q-15 -45 -30 -25" fill="#4A3A6B"/>
        <circle cx="-8" cy="-22" r="3" fill="#333"/><circle cx="8" cy="-22" r="3" fill="#333"/>
        <path d="M-5 -8 Q0 -3 5 -8" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="0" x2="40" y2="70" stroke="#8B4513" stroke-width="5"/>
        <circle cx="35" cy="-5" r="8" fill="${palette.accent[0]}"/>
      </g>
      <g transform="translate(${w*0.65}, ${h*0.55})">
        <ellipse cx="-20" cy="-10" rx="15" ry="30" fill="${palette.accent[0]}" opacity="0.3"/>
        <ellipse cx="20" cy="-10" rx="15" ry="30" fill="${palette.accent[0]}" opacity="0.3"/>
        <path d="M-15 20 Q-18 0 -12 -18 Q0 -28 12 -18 Q18 0 15 20" fill="#4ECDC4"/>
        <circle cx="0" cy="-25" r="18" fill="${palette.skin[0]}"/>
        <path d="M-18 -30 Q-8 -50 0 -45 Q8 -50 18 -30" fill="${palette.hair[0]}"/>
        <circle cx="-6" cy="-28" r="2.5" fill="#333"/><circle cx="6" cy="-28" r="2.5" fill="#333"/>
      </g>
      <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
      <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">👤 Персонажи</text>
      <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
    </svg>`,
    
    layout: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="layBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#0f0f1a"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#layBg)"/>
      <rect x="${w*0.05}" y="${h*0.12}" width="${w*0.28}" height="${h*0.32}" rx="12" fill="rgba(100,200,100,0.1)" stroke="rgba(100,200,100,0.4)"/>
      <text x="${w*0.19}" y="${h*0.30}" text-anchor="middle" font-size="14" fill="rgba(100,200,100,0.8)">ФОН</text>
      <rect x="${w*0.36}" y="${h*0.22}" width="${w*0.28}" height="${h*0.38}" rx="12" fill="rgba(200,200,100,0.1)" stroke="rgba(200,200,100,0.4)"/>
      <text x="${w*0.5}" y="${h*0.43}" text-anchor="middle" font-size="14" fill="rgba(200,200,100,0.8)">СРЕДНИЙ</text>
      <rect x="${w*0.67}" y="${h*0.32}" width="${w*0.28}" height="${h*0.42}" rx="12" fill="rgba(200,100,100,0.1)" stroke="rgba(200,100,100,0.4)"/>
      <text x="${w*0.81}" y="${h*0.55}" text-anchor="middle" font-size="14" fill="rgba(200,100,100,0.8)">ПЕРЕДНИЙ</text>
      <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
      <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">📍 Расстановка</text>
      <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
    </svg>`,
    
    animation: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="animBg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#0f0f1a"/></linearGradient></defs>
      <style>.float{animation:float 2s ease-in-out infinite}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}.pulse{animation:pulse 1.5s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}</style>
      <rect width="100%" height="100%" fill="url(#animBg)"/>
      <circle cx="${w*0.3}" cy="${h*0.45}" r="50" fill="${palette.sky[0]}" class="float" opacity="0.8"/>
      <circle cx="${w*0.5}" cy="${h*0.5}" r="60" fill="${palette.ground[1]}" class="float" style="animation-delay:0.5s" opacity="0.7"/>
      <circle cx="${w*0.7}" cy="${h*0.42}" r="40" fill="${palette.accent[0]}" class="float" style="animation-delay:1s" opacity="0.8"/>
      <g transform="translate(50, ${h*0.85})">
        <rect width="${w-100}" height="8" rx="4" fill="rgba(255,255,255,0.1)"/>
        <rect width="${(w-100)*0.6}" height="8" rx="4" fill="${palette.accent[0]}" class="pulse"/>
      </g>
      <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
      <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">🎬 Анимация</text>
      <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
    </svg>`,
    
    typography: () => {
      const title = customText?.title || 'ЗАГОЛОВОК';
      const subtitle = customText?.subtitle || 'Подзаголовок проекта';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs><linearGradient id="typoBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#0d0d1a"/></linearGradient></defs>
        <rect width="100%" height="100%" fill="url(#typoBg)"/>
        <text x="${w/2}" y="${h*0.3}" text-anchor="middle" font-size="48" font-weight="bold" fill="white">${title}</text>
        <text x="${w/2}" y="${h*0.4}" text-anchor="middle" font-size="20" fill="rgba(255,255,255,0.7)">${subtitle}</text>
        <rect x="${w/2-90}" y="${h*0.55}" width="180" height="45" rx="22" fill="${palette.accent[0]}"/>
        <text x="${w/2}" y="${h*0.55+30}" text-anchor="middle" font-size="16" font-weight="bold" fill="white">Подробнее</text>
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.35)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">🔤 Типографика</text>
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • ${style.toUpperCase()}</text>
      </svg>`;
    }
  };
  
  return generators[id]?.() || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="${w/2}" y="${h/2}" text-anchor="middle" font-size="24" fill="white">${id}</text></svg>`;
}

function composeFinalScene(config: any): string {
  const { settings, dimensions, taskType, customText, taskDescription, tzAnalysis } = config;
  const { width: w, height: h } = dimensions;
  const { timeOfDay, style, palette } = settings;

  const sceneRand = seededRandom(999);
  const treeTypes = ['oak', 'pine', 'birch', 'willow', 'autumn'];

  // Используем результаты AI-анализа ТЗ (переданные из POST handler)
  const characterType = tzAnalysis?.characterType || 'cat_detective';
  const characterName = tzAnalysis?.characterName || 'Кот-детектив';
  const detectedMood = tzAnalysis?.mood || 'сказочный';
  const customElements = tzAnalysis?.customElements || [];
  
  console.log(`[composeFinalScene] Использую AI-анализ: персонаж=${characterType} (${characterName}), настроение=${detectedMood}, элементы=${customElements.join(', ')}`);
  
  const title = customText?.title || '';
  const subtitle = customText?.subtitle || '';
  const cta = customText?.cta || 'Подробнее';
  
  const timeColors: Record<string, {sky: string[], sun: string, sunY: number, moon: boolean}> = {
    'день': { sky: palette.sky, sun: '#FFD700', sunY: 0.08, moon: false },
    'ночь': { sky: ['#0D1B2A', '#1B263B', '#2D3E50', '#415A77', '#5A7090'], sun: '#F5F5DC', sunY: 0.1, moon: true },
    'вечер': { sky: ['#FF6B35', '#F7931E', '#FFB347', '#FFD700', '#FFE4B5'], sun: '#FF4500', sunY: 0.28, moon: false },
    'рассвет': { sky: ['#FFB6C1', '#FFC0CB', '#FFDAB9', '#FFE4E1', '#FFF0F5'], sun: '#FFA500', sunY: 0.38, moon: false }
  };
  const tc = timeColors[timeOfDay] || timeColors['день'];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="fSky" x1="0%" y1="0%" x2="0%" y2="100%">${tc.sky.map((c: string, i: number) => `<stop offset="${i*25}%" stop-color="${c}"/>`).join('')}</linearGradient>
      <linearGradient id="fGround" x1="0%" y1="0%" x2="0%" y2="100%">${palette.ground.map((c: string, i: number) => `<stop offset="${i*25}%" stop-color="${c}"/>`).join('')}</linearGradient>
      <radialGradient id="fSunGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${tc.sun}"/><stop offset="60%" stop-color="${tc.sun}" stop-opacity="0.1"/><stop offset="100%" stop-color="${tc.sun}" stop-opacity="0"/></radialGradient>
      <radialGradient id="fVignette" cx="50%" cy="45%" r="65%"><stop offset="55%" stop-color="transparent"/><stop offset="100%" stop-color="rgba(0,0,0,0.4)"/></radialGradient>
      <!-- Дымка на горизонте -->
      <linearGradient id="fHorizonHaze" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${palette.fog}" stop-opacity="0"/>
        <stop offset="40%" stop-color="${palette.fog}" stop-opacity="0.3"/>
        <stop offset="70%" stop-color="${palette.fog}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${palette.fog}" stop-opacity="0.2"/>
      </linearGradient>
      <!-- Атмосферная перспектива -->
      <filter id="fGlow"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="fHazeBlur"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="fDistanceBlur"><feGaussianBlur stdDeviation="2"/></filter>
      <filter id="fTreeShadow"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/></filter>
      <filter id="fCharShadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/></filter>
    </defs>
    
    <!-- Sky -->
    <rect width="100%" height="${h*0.65}" fill="url(#fSky)"/>
    
    <!-- Sun/Moon -->
    ${tc.moon ? `
      ${Array.from({length: 50}, () => `<circle cx="${sceneRand()*w}" cy="${sceneRand()*h*0.4}" r="${sceneRand()*1.5+0.5}" fill="white" opacity="${sceneRand()*0.5+0.2}"/>`).join('')}
      <circle cx="${w*0.85}" cy="${h*0.1}" r="35" fill="#F5F5DC" filter="url(#fGlow)"/>
      <circle cx="${w*0.87}" cy="${h*0.08}" r="28" fill="${tc.sky[0]}"/>
    ` : `
      <circle cx="${w*0.85}" cy="${h*tc.sunY}" r="90" fill="${tc.sun}" opacity="0.1"/>
      <circle cx="${w*0.85}" cy="${h*tc.sunY}" r="30" fill="${tc.sun}"/>
      <circle cx="${w*0.85}" cy="${h*tc.sunY}" r="20" fill="#FFFACD"/>
    `}
    
    <!-- ===== МНОГОСЛОЙНЫЙ ИЗВИЛИСТЫЙ ГОРИЗОНТ ===== -->
    
    <!-- Самые дальние горы (едва видны сквозь дымку) -->
    <path d="M0 ${h*0.45} 
      Q${w*0.05} ${h*0.38} ${w*0.1} ${h*0.42}
      Q${w*0.15} ${h*0.35} ${w*0.22} ${h*0.38}
      Q${w*0.28} ${h*0.30} ${w*0.35} ${h*0.36}
      Q${w*0.42} ${h*0.28} ${w*0.5} ${h*0.34}
      Q${w*0.58} ${h*0.26} ${w*0.65} ${h*0.32}
      Q${w*0.72} ${h*0.28} ${w*0.78} ${h*0.35}
      Q${w*0.85} ${h*0.30} ${w*0.92} ${h*0.38}
      Q${w*0.96} ${h*0.35} ${w} ${h*0.42}
      L${w} ${h} L0 ${h} Z" 
      fill="${tc.sky[3]}" opacity="0.25" filter="url(#fHazeBlur)"/>
    
    <!-- Дальние горы с деревьями на вершинах -->
    <path d="M0 ${h*0.48}
      Q${w*0.03} ${h*0.42} ${w*0.08} ${h*0.45}
      Q${w*0.12} ${h*0.38} ${w*0.18} ${h*0.43}
      Q${w*0.25} ${h*0.34} ${w*0.32} ${h*0.40}
      Q${w*0.38} ${h*0.36} ${w*0.45} ${h*0.42}
      Q${w*0.52} ${h*0.32} ${w*0.58} ${h*0.38}
      Q${w*0.65} ${h*0.35} ${w*0.72} ${h*0.40}
      Q${w*0.78} ${h*0.33} ${w*0.85} ${h*0.42}
      Q${w*0.92} ${h*0.36} ${w} ${h*0.45}
      L${w} ${h} L0 ${h} Z"
      fill="${palette.ground[4]}" opacity="0.35" filter="url(#fDistanceBlur)"/>
    
    <!-- Силуэты деревьев на дальних горах -->
    ${Array.from({length: 12}, () => {
      const tx = sceneRand() * w;
      const ty = h*0.38 + sceneRand() * h*0.08;
      const th = 15 + sceneRand() * 25;
      const tw = th * 0.3;
      return `<path d="M${tx-tw} ${ty} L${tx} ${ty-th} L${tx+tw} ${ty}" fill="${palette.leaves[1]}" opacity="0.2" filter="url(#fDistanceBlur)"/>`;
    }).join('')}
    
    <!-- Средние холмы (извилистые) -->
    <path d="M0 ${h*0.52}
      Q${w*0.04} ${h*0.48} ${w*0.1} ${h*0.50}
      Q${w*0.15} ${h*0.44} ${w*0.22} ${h*0.48}
      Q${w*0.28} ${h*0.42} ${w*0.35} ${h*0.46}
      Q${w*0.42} ${h*0.40} ${w*0.5} ${h*0.45}
      Q${w*0.57} ${h*0.38} ${w*0.64} ${h*0.44}
      Q${w*0.72} ${h*0.40} ${w*0.8} ${h*0.46}
      Q${w*0.88} ${h*0.42} ${w*0.95} ${h*0.48}
      Q${w*0.98} ${h*0.46} ${w} ${h*0.50}
      L${w} ${h} L0 ${h} Z"
      fill="${palette.ground[3]}" opacity="0.5"/>
    
    <!-- Дымка над средними холмами -->
    <path d="M0 ${h*0.48}
      Q${w*0.04} ${h*0.48} ${w*0.1} ${h*0.50}
      Q${w*0.15} ${h*0.44} ${w*0.22} ${h*0.48}
      Q${w*0.28} ${h*0.42} ${w*0.35} ${h*0.46}
      Q${w*0.42} ${h*0.40} ${w*0.5} ${h*0.45}
      Q${w*0.57} ${h*0.38} ${w*0.64} ${h*0.44}
      Q${w*0.72} ${h*0.40} ${w*0.8} ${h*0.46}
      Q${w*0.88} ${h*0.42} ${w*0.95} ${h*0.48}
      Q${w*0.98} ${h*0.46} ${w} ${h*0.50}
      L${w} ${h*0.55} L0 ${h*0.55} Z"
      fill="url(#fHorizonHaze)" opacity="0.7"/>
    
    <!-- Ближние холмы (ещё более извилистые) -->
    <path d="M0 ${h*0.58}
      Q${w*0.06} ${h*0.52} ${w*0.12} ${h*0.56}
      Q${w*0.18} ${h*0.48} ${w*0.26} ${h*0.54}
      Q${w*0.34} ${h*0.50} ${w*0.42} ${h*0.55}
      Q${w*0.5} ${h*0.48} ${w*0.55} ${h*0.52}
      Q${w*0.62} ${h*0.46} ${w*0.7} ${h*0.53}
      Q${w*0.78} ${h*0.50} ${w*0.86} ${h*0.55}
      Q${w*0.94} ${h*0.52} ${w} ${h*0.56}
      L${w} ${h} L0 ${h} Z"
      fill="${palette.ground[2]}" opacity="0.7"/>
    
    <!-- Основная земля с извилистым краем -->
    <path d="M0 ${h*0.62}
      Q${w*0.05} ${h*0.58} ${w*0.1} ${h*0.60}
      Q${w*0.15} ${h*0.55} ${w*0.2} ${h*0.58}
      Q${w*0.28} ${h*0.54} ${w*0.35} ${h*0.57}
      Q${w*0.42} ${h*0.52} ${w*0.48} ${h*0.55}
      Q${w*0.55} ${h*0.50} ${w*0.62} ${h*0.54}
      Q${w*0.7} ${h*0.51} ${w*0.78} ${h*0.56}
      Q${w*0.85} ${h*0.53} ${w*0.92} ${h*0.58}
      Q${w*0.97} ${h*0.55} ${w} ${h*0.58}
      L${w} ${h} L0 ${h} Z"
      fill="url(#fGround)"/>
    
    <!-- Лёгкая дымка у самой земли -->
    <rect y="${h*0.55}" width="100%" height="${h*0.15}" fill="url(#fHorizonHaze)" opacity="0.3"/>
    
    <!-- ===== РАСТИТЕЛЬНОСТЬ ===== -->
    
    <!-- Трава - очень много, разной высоты -->
    ${Array.from({length: 600}, () => {
      const x = sceneRand() * w;
      const y = h*0.55 + sceneRand() * h*0.42;
      const h_ = sceneRand() * 35 + 10;
      const curve = sceneRand() * 18 - 9;
      const color = palette.ground[Math.floor(sceneRand() * 3)];
      const width = sceneRand() * 2.5 + 0.5;
      return `<path d="M${x} ${y} Q${x+curve} ${y-h_/2} ${x+curve*0.7} ${y-h_}" stroke="${color}" stroke-width="${width}" fill="none" opacity="${sceneRand()*0.5+0.3}"/>`;
    }).join('')}
    
    <!-- Цветы - много, разные размеры и цвета -->
    ${Array.from({length: 80}, () => {
      const x = sceneRand() * w;
      const y = h*0.70 + sceneRand() * h*0.28;
      const r = sceneRand() * 6 + 2;
      const color = palette.accent[Math.floor(sceneRand() * palette.accent.length)];
      const petals = Math.floor(sceneRand() * 3) + 5;
      let flower = `<circle cx="${x}" cy="${y}" r="${r*0.4}" fill="#FFD700"/>`;
      for (let p = 0; p < petals; p++) {
        const angle = (p / petals) * Math.PI * 2;
        const px = x + Math.cos(angle) * r * 0.7;
        const py = y + Math.sin(angle) * r * 0.7;
        flower += `<ellipse cx="${px}" cy="${py}" rx="${r*0.5}" ry="${r*0.35}" fill="${color}" opacity="${sceneRand()*0.3+0.6}" transform="rotate(${angle*180/Math.PI} ${px} ${py})"/>`;
      }
      return flower;
    }).join('')}
    
    <!-- Грибы - разные размеры -->
    ${Array.from({length: 25}, () => {
      const x = sceneRand() * w;
      const y = h*0.78 + sceneRand() * h*0.18;
      const scale = sceneRand() * 0.8 + 0.4;
      const stemH = 12 * scale;
      const capR = 10 * scale;
      const capColor = sceneRand() > 0.5 ? '#D35400' : '#E74C3C';
      const hasSpots = sceneRand() > 0.3;
      return `
        <ellipse cx="${x}" cy="${y}" rx="${capR*0.8}" ry="${capR*0.25}" fill="rgba(0,0,0,0.1)"/>
        <rect x="${x-capR*0.25}" y="${y-stemH}" width="${capR*0.5}" height="${stemH}" fill="#F5DEB3" rx="2"/>
        <ellipse cx="${x}" cy="${y-stemH}" rx="${capR}" ry="${capR*0.5}" fill="${capColor}"/>
        ${hasSpots ? Array.from({length: 4}, () => {
          const sx = x + (sceneRand() - 0.5) * capR * 1.2;
          const sy = y - stemH - sceneRand() * capR * 0.3;
          return `<circle cx="${sx}" cy="${sy}" r="${sceneRand()*2+1}" fill="white" opacity="0.8"/>`;
        }).join('') : ''}
      `;
    }).join('')}
    
    <!-- Кусты -->
    ${Array.from({length: 20}, () => {
      const x = sceneRand() * w;
      const y = h * 0.85 + sceneRand() * h * 0.12;
      return generateBush(x, y, 0.6 + sceneRand() * 0.5, palette, sceneRand);
    }).join('')}
    
    <!-- ===== ДОПОЛНИТЕЛЬНЫЕ ЭЛЕМЕНТЫ ИЗ ТЗ (AI-анализ) ===== -->
    ${customElements.includes('река') || customElements.includes('ручей') ? `
    <!-- Река/ручей -->
    <path d="M${-20} ${h*0.75} Q${w*0.15} ${h*0.72} ${w*0.3} ${h*0.78} Q${w*0.5} ${h*0.85} ${w*0.7} ${h*0.82} Q${w*0.85} ${h*0.78} ${w+20} ${h*0.85}" 
      stroke="${palette.water[0]}" stroke-width="25" fill="none" opacity="0.8" stroke-linecap="round"/>
    <path d="M${-20} ${h*0.75} Q${w*0.15} ${h*0.72} ${w*0.3} ${h*0.78} Q${w*0.5} ${h*0.85} ${w*0.7} ${h*0.82} Q${w*0.85} ${h*0.78} ${w+20} ${h*0.85}" 
      stroke="${palette.water[2]}" stroke-width="15" fill="none" opacity="0.5" stroke-linecap="round"/>
    <path d="M${-15} ${h*0.76} Q${w*0.2} ${h*0.74} ${w*0.35} ${h*0.79}" stroke="white" stroke-width="3" fill="none" opacity="0.3"/>
    ` : ''}
    
    ${customElements.includes('замок') || customElements.includes('башня') ? `
    <!-- Замок/башня на горизонте -->
    <g transform="translate(${w*0.75}, ${h*0.48})">
      <rect x="-25" y="-80" width="50" height="80" fill="#8B7355" opacity="0.6"/>
      <polygon points="-30,-80 0,-110 30,-80" fill="#6B5344" opacity="0.6"/>
      <rect x="-35" y="-60" width="10" height="60" fill="#7B6355" opacity="0.5"/>
      <rect x="25" y="-60" width="10" height="60" fill="#7B6355" opacity="0.5"/>
      <polygon points="-38,-60 -30,-80 -22,-60" fill="#5B4334" opacity="0.5"/>
      <polygon points="22,-60 30,-80 38,-60" fill="#5B4334" opacity="0.5"/>
      <rect x="-5" y="-45" width="10" height="25" fill="#4A3828" opacity="0.7"/>
    </g>
    ` : ''}
    
    ${customElements.includes('мост') ? `
    <!-- Мост -->
    <g transform="translate(${w*0.4}, ${h*0.78})">
      <path d="M-60,0 Q-30,-25 0,-20 Q30,-25 60,0" stroke="#8B4513" stroke-width="8" fill="none"/>
      <line x1="-50" y1="0" x2="-50" y2="15" stroke="#6B3513" stroke-width="4"/>
      <line x1="50" y1="0" x2="50" y2="15" stroke="#6B3513" stroke-width="4"/>
      <path d="M-60,0 Q0,-30 60,0" fill="rgba(139,69,19,0.3)"/>
    </g>
    ` : ''}
    
    ${customElements.includes('озеро') || customElements.includes('пруд') ? `
    <!-- Озеро/пруд -->
    <ellipse cx="${w*0.65}" cy="${h*0.82}" rx="80" ry="35" fill="${palette.water[1]}" opacity="0.7"/>
    <ellipse cx="${w*0.65}" cy="${h*0.82}" rx="60" ry="25" fill="${palette.water[2]}" opacity="0.5"/>
    <ellipse cx="${w*0.6}" cy="${h*0.80}" rx="25" ry="10" fill="white" opacity="0.2"/>
    ` : ''}
    
    ${customElements.includes('камни') || customElements.includes('скалы') ? `
    <!-- Камни -->
    ${Array.from({length: 8}, () => {
      const x = sceneRand() * w;
      const y = h * 0.75 + sceneRand() * h * 0.2;
      const size = sceneRand() * 15 + 8;
      const shade = Math.floor(sceneRand() * 40) + 60;
      return `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size*0.6}" fill="rgb(${shade},${shade},${shade})" opacity="0.7"/>`;
    }).join('')}
    ` : ''}
    
    ${customElements.includes('дом') || customElements.includes('изба') || customElements.includes('домик') ? `
    <!-- Домик -->
    <g transform="translate(${w*0.2}, ${h*0.72})">
      <rect x="-30" y="-40" width="60" height="40" fill="#8B4513" opacity="0.7"/>
      <polygon points="-35,-40 0,-65 35,-40" fill="#A0522D" opacity="0.7"/>
      <rect x="-8" y="-25" width="16" height="25" fill="#4A2810"/>
      <rect x="-25" y="-32" width="12" height="10" fill="#87CEEB" opacity="0.5"/>
      <rect x="13" y="-32" width="12" height="10" fill="#87CEEB" opacity="0.5"/>
      <rect x="35" y="-55" width="8" height="20" fill="#6B3513" opacity="0.6"/>
      <ellipse cx="39" cy="-60" rx="5" ry="8" fill="#888" opacity="0.5"/>
    </g>
    ` : ''}
    
    ${customElements.includes('солнце') || customElements.includes('жаркое') ? `
    <!-- Дополнительное солнце -->
    <circle cx="${w*0.15}" cy="${h*0.12}" r="50" fill="#FFD700" opacity="0.3" filter="url(#fGlow)"/>
    ` : ''}
    
    ${customElements.includes('туман') || customElements.includes('пасмурно') ? `
    <!-- Туман -->
    <rect y="${h*0.4}" width="100%" height="${h*0.3}" fill="url(#fHorizonHaze)" opacity="0.6"/>
    ` : ''}
    
    <!-- Background trees - ДАЛЬНИЕ (на холмах) -->
    ${Array.from({length: 5}, (_, i) => {
      const x = w * 0.08 + i * w * 0.2;
      const y = h * 0.62; // Основание на линии холмов
      const scale = 0.7 + sceneRand() * 0.2; // Увеличенный масштаб
      const type = treeTypes[Math.floor(sceneRand() * treeTypes.length)];
      return `<g opacity="0.5">${generateDetailedTree(x, y, scale, palette, sceneRand, type)}</g>`;
    }).join('')}
    
    <!-- Mid trees - СРЕДНИЕ (на средней части земли) -->
    ${Array.from({length: 4}, (_, i) => {
      const x = w * 0.12 + i * w * 0.22;
      const y = h * 0.75; // Основание на земле
      const scale = 1.0 + sceneRand() * 0.25; // Ещё больше
      const type = treeTypes[Math.floor(sceneRand() * treeTypes.length)];
      return `<g filter="url(#fTreeShadow)">${generateDetailedTree(x, y, scale, palette, sceneRand, type)}</g>`;
    }).join('')}
    
    <!-- Foreground trees - ПЕРЕДНИЕ (по краям, самые крупные) -->
    <g filter="url(#fTreeShadow)" opacity="0.95">${generateDetailedTree(w * 0.06, h * 0.92, 1.4, palette, sceneRand, 'oak')}</g>
    <g filter="url(#fTreeShadow)" opacity="0.95">${generateDetailedTree(w * 0.94, h * 0.88, 1.5, palette, sceneRand, 'pine')}</g>
    
    <!-- ===== ПЕРСОНАЖИ ===== -->
    ${generateCharacter(characterType, w, h, palette, sceneRand)}
    
    <!-- Particles -->
    ${Array.from({length: 30}, () => `<circle cx="${sceneRand()*w}" cy="${sceneRand()*h}" r="${sceneRand()*2+0.5}" fill="white" opacity="${sceneRand()*0.2+0.05}"/>`).join('')}
    
    <!-- Vignette -->
    <rect width="100%" height="100%" fill="url(#fVignette)"/>
    
    <!-- Информация о персонаже (из ТЗ) -->
    <g transform="translate(12, ${h-32})">
      <rect x="-5" y="-18" width="200" height="28" rx="4" fill="rgba(0,0,0,0.5)"/>
      <text font-size="11" fill="white" font-weight="bold">👤 ${characterName}</text>
      <text x="85" font-size="9" fill="rgba(255,255,255,0.7)">| ТЗ: ${taskDescription ? (taskDescription.length > 25 ? taskDescription.substring(0,25) + '...' : taskDescription) : 'не указано'}</text>
    </g>
    
    <!-- Text overlay -->
    ${title ? `<text x="${w/2}" y="${h*0.1}" text-anchor="middle" font-size="40" font-weight="bold" fill="white" filter="url(#fGlow)">${title}</text>` : ''}
    ${subtitle ? `<text x="${w/2}" y="${h*0.16}" text-anchor="middle" font-size="16" fill="rgba(255,255,255,0.8)">${subtitle}</text>` : ''}
    ${taskType !== 'scene' ? `<rect x="${w/2-80}" y="${h*0.88}" width="160" height="40" rx="20" fill="${palette.accent[0]}"/><text x="${w/2}" y="${h*0.88+26}" text-anchor="middle" font-size="15" font-weight="bold" fill="white">${cta}</text>` : ''}
    
    <text x="${w-12}" y="${h-8}" text-anchor="end" font-size="9" fill="rgba(255,255,255,0.15)">ФОРТОРИУМ v6.7.0</text>
  </svg>`;
}
