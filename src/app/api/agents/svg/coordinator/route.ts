import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 120;

/**
 * SVG-координатор v9.3.0
 * AI-анализ ТЗ через z-ai-web-dev-sdk
 */

async function analyzeTZWithAI(tz: string): Promise<{
  characterType: string;
  characterName: string;
  mood: string;
  location: string;
  timeOfDay: string;
  customElements: string[];
  aiUsed: boolean;
}> {
  console.log('[AI-TZ v9.3] Starting for:', tz?.substring(0, 80));

  if (!tz || tz.trim().length < 3) {
    return { characterType: 'hero', characterName: 'Герой', mood: 'сказочный', location: 'волшебный лес', timeOfDay: 'день', customElements: [], aiUsed: false };
  }

  try {
    console.log('[AI-TZ] Initializing ZAI SDK...');
    const zai = await ZAI.create();

    console.log('[AI-TZ] Calling chat completions...');

    const systemPrompt = `Ты анализатор описаний для генерации SVG-сцен. Твоя задача - извлечь из описания:
1. Тип персонажа (один из): cat_detective, wizard, fairy, knight, princess, robot, astronaut, pirate, animal, hero, child
2. Имя персонажа (придумай подходящее на основе описания)
3. Настроение сцены: сказочный, мрачный, весёлый, таинственный, приключенческий
4. Локацию: волшебный лес, город, море, горы, космос, замок, пещера, пустыня
5. Время суток: день, ночь, вечер, рассвет
6. Дополнительные элементы: массив строк (река, озеро, мост, дом, замок, камни, скалы, туман, радуга, водопад)

ВАЖНО: Анализируй смысл описания, а не только ключевые слова!

Ответ ТОЛЬКО в формате JSON без markdown:
{"characterType":"тип","characterName":"Имя","mood":"настроение","location":"локация","timeOfDay":"время","customElements":["элемент1"]}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Проанализируй это описание и создай подходящую сцену: "${tz}"` }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = completion.choices?.[0]?.message?.content || '';
    console.log('[AI-TZ] AI Response:', content.substring(0, 200));

    // Извлекаем JSON из ответа
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[AI-TZ] ✅ SUCCESS - AI analyzed:', parsed);
      return {
        characterType: parsed.characterType || 'hero',
        characterName: parsed.characterName || 'Персонаж',
        mood: parsed.mood || 'сказочный',
        location: parsed.location || 'волшебный лес',
        timeOfDay: parsed.timeOfDay || 'день',
        customElements: parsed.customElements || [],
        aiUsed: true
      };
    }
  } catch (error: any) {
    console.error('[AI-TZ] ❌ SDK Error:', error.message);
    console.error('[AI-TZ] Error stack:', error.stack);
  }

  console.log('[AI-TZ] Using keyword fallback');
  const fallback = analyzeTZFallback(tz);
  return { ...fallback, aiUsed: false };
}

function analyzeTZFallback(tz: string): {
  characterType: string;
  characterName: string;
  mood: string;
  location: string;
  timeOfDay: string;
  customElements: string[];
} {
  const lowerTz = (tz || '').toLowerCase();
  
  const characterPatterns: Record<string, {name: string, patterns: string[]}> = {
    'cat_detective': { name: 'Кот-детектив', patterns: ['кот', 'кошк', 'детектив', 'сыщик'] },
    'wizard': { name: 'Волшебник', patterns: ['волшебник', 'маг', 'чародей', 'колдун'] },
    'fairy': { name: 'Фея', patterns: ['фея', 'эльф', 'волшебн'] },
    'knight': { name: 'Рыцарь', patterns: ['рыцарь', 'воин', 'богатыр', 'меч', 'дракон'] },
    'princess': { name: 'Принцесса', patterns: ['принцесс', 'королев', 'царевн'] },
    'robot': { name: 'Робот', patterns: ['робот', 'android', 'киборг'] },
    'astronaut': { name: 'Астронавт', patterns: ['астронавт', 'космонавт', 'космос', 'планет'] },
    'pirate': { name: 'Пират', patterns: ['пират', 'море', 'корабль', 'клад'] },
    'animal': { name: 'Лесной житель', patterns: ['медвед', 'лис', 'волк', 'заяц', 'зверь'] },
    'hero': { name: 'Герой', patterns: ['герой', 'путешеств', 'исследов', 'приключен', 'отважн', 'смел', 'путник'] },
    'child': { name: 'Ребёнок', patterns: ['ребёнок', 'ребенок', 'малыш', 'дети', 'мальчик', 'девочка'] }
  };

  let characterType = 'hero';
  let characterName = 'Герой';

  for (const [type, data] of Object.entries(characterPatterns)) {
    if (data.patterns.some(p => lowerTz.includes(p))) {
      characterType = type;
      characterName = data.name;
      break;
    }
  }

  let location = 'волшебный лес';
  if (['гор', 'скал', 'вершин'].some(p => lowerTz.includes(p))) location = 'горы';
  else if (['мор', 'пляж', 'океан', 'берег'].some(p => lowerTz.includes(p))) location = 'море';
  else if (['город', 'town', 'city'].some(p => lowerTz.includes(p))) location = 'город';
  else if (['космос', 'space', 'планет', 'звезд'].some(p => lowerTz.includes(p))) location = 'космос';
  else if (['замок', 'castle', 'дворец'].some(p => lowerTz.includes(p))) location = 'замок';

  let mood = 'сказочный';
  if (['мрачн', 'темн', 'ужас'].some(p => lowerTz.includes(p))) mood = 'мрачный';
  else if (['весёл', 'смешн', 'радост'].some(p => lowerTz.includes(p))) mood = 'весёлый';
  else if (['тайн', 'загадк'].some(p => lowerTz.includes(p))) mood = 'таинственный';
  else if (['приключен', 'путешеств'].some(p => lowerTz.includes(p))) mood = 'приключенческий';

  let timeOfDay = 'день';
  if (['ноч', 'night', 'лун'].some(p => lowerTz.includes(p))) timeOfDay = 'ночь';
  else if (['вечер', 'закат', 'sunset'].some(p => lowerTz.includes(p))) timeOfDay = 'вечер';
  else if (['рассвет', 'утр', 'morning'].some(p => lowerTz.includes(p))) timeOfDay = 'рассвет';

  const customElements: string[] = [];
  ['река', 'ручей', 'озеро', 'мост', 'замок', 'дом', 'камни', 'скалы', 'туман'].forEach(el => {
    if (lowerTz.includes(el)) customElements.push(el);
  });

  console.log('[Fallback] Result:', { characterType, characterName, location, mood, customElements });
  return { characterType, characterName, mood, location, timeOfDay, customElements };
}

const STYLE_PALETTES: Record<string, any> = {
  ghibli: {
    sky: ['#87CEEB', '#B0E0E6', '#E0F7FA', '#F0FFF0', '#FFF8E7'],
    ground: ['#4CAF50', '#6BB86B', '#8BC34A', '#A5D66A', '#C5E1A5'],
    accent: ['#FF7043', '#FF8A65', '#FFAB91', '#FFCCBC'],
    skin: ['#FFCCBC', '#FFAB91', '#FF8A65'],
    hair: ['#5D4037', '#7D5A47', '#8D6E63'],
    water: ['#4DD0E1', '#80DEEA', '#B2EBF2'],
    trunk: ['#5D4037', '#6D4C41', '#795548'],
    leaves: ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A']
  }
};

function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function generateTree(x: number, y: number, scale: number, palette: any, rand: () => number): string {
  const h = (rand() * 60 + 80) * scale;
  const w = (rand() * 10 + 12) * scale;
  const r = (rand() * 35 + 40) * scale;
  
  return `
    <path d="M${x-w/2} ${y} Q${x-w/3} ${y-h*0.6} ${x} ${y-h} Q${x+w/3} ${y-h*0.6} ${x+w/2} ${y}" fill="${palette.trunk?.[0] || '#5D4037'}"/>
    <ellipse cx="${x}" cy="${y-h-r*0.7}" rx="${r}" ry="${r*0.8}" fill="${palette.leaves[1]}"/>
    <ellipse cx="${x-r*0.4}" cy="${y-h-r*0.5}" rx="${r*0.7}" ry="${r*0.6}" fill="${palette.leaves[0]}"/>
    <ellipse cx="${x+r*0.35}" cy="${y-h-r*0.55}" rx="${r*0.6}" ry="${r*0.5}" fill="${palette.leaves[2]}"/>
  `;
}

function generateCharacter(type: string, w: number, h: number, palette: any, rand: () => number): string {
  const px = w * 0.45;
  const py = h * 0.52;

  const characters: Record<string, string> = {
    cat_detective: `
      <g transform="translate(${px}, ${py})">
        <ellipse cx="0" cy="100" rx="55" ry="15" fill="rgba(0,0,0,0.2)"/>
        <ellipse cx="0" cy="-25" rx="38" ry="35" fill="#8B7355"/>
        <path d="M-28 -52 L-20 -75 L-8 -50 Z" fill="#8B7355"/>
        <path d="M28 -52 L20 -75 L8 -50 Z" fill="#8B7355"/>
        <ellipse cx="0" cy="-15" rx="22" ry="18" fill="#C4A882"/>
        <ellipse cx="-12" cy="-30" rx="10" ry="12" fill="white"/>
        <ellipse cx="12" cy="-30" rx="10" ry="12" fill="white"/>
        <ellipse cx="-10" cy="-28" rx="5" ry="8" fill="#4A8B4A"/>
        <ellipse cx="10" cy="-28" rx="5" ry="8" fill="#4A8B4A"/>
        <path d="M0 -15 L-4 -8 L4 -8 Z" fill="#E8A0A0"/>
        <ellipse cx="0" cy="-55" rx="42" ry="8" fill="#3A3A3A"/>
        <path d="M-32 -55 Q-35 -70 -25 -78 Q-10 -85 0 -85 Q10 -85 25 -78 Q35 -70 32 -55" fill="#4A4A4A"/>
      </g>`,
    
    wizard: `
      <g transform="translate(${w*0.45}, ${h*0.52})">
        <ellipse cx="0" cy="100" rx="45" ry="14" fill="rgba(0,0,0,0.2)"/>
        <path d="M-40 30 Q-50 60 -40 95 Q0 115 40 95 Q50 60 40 30 Q20 10 0 15 Q-20 10 -40 30" fill="#5A3A8A"/>
        <circle cx="0" cy="-10" r="30" fill="${palette.skin[0]}"/>
        <path d="M-18 10 Q-25 45 -10 65 Q0 75 10 65 Q25 45 18 10" fill="#E0E0E0"/>
        <path d="M-35 -20 Q-40 -50 -25 -80 Q-10 -110 0 -120 Q10 -110 25 -80 Q40 -50 35 -20" fill="#4A3A7A"/>
      </g>`,
    
    fairy: `
      <g transform="translate(${w*0.45}, ${h*0.55})">
        <ellipse cx="-25" cy="-5" rx="25" ry="40" fill="${palette.accent[0]}" opacity="0.35"/>
        <ellipse cx="25" cy="-5" rx="25" ry="40" fill="${palette.accent[0]}" opacity="0.35"/>
        <path d="M-20 25 Q-25 55 -18 75 Q0 85 18 75 Q25 55 20 25 Q12 10 0 15 Q-12 10 -20 25" fill="#5DDDCD"/>
        <circle cx="0" cy="-15" r="22" fill="${palette.skin[0]}"/>
        <ellipse cx="-7" cy="-18" rx="6" ry="9" fill="white"/>
        <ellipse cx="7" cy="-18" rx="6" ry="9" fill="white"/>
      </g>`,
    
    knight: `
      <g transform="translate(${w*0.45}, ${h*0.50})">
        <ellipse cx="0" cy="105" rx="50" ry="15" fill="rgba(0,0,0,0.2)"/>
        <path d="M-35 10 Q-45 35 -40 60 Q-25 75 0 80 Q25 75 40 60 Q45 35 35 10 Q20 -5 0 0 Q-20 -5 -35 10" fill="#7A7A7A"/>
        <path d="M-25 -25 Q-30 -50 -20 -65 Q-10 -80 0 -82 Q10 -80 20 -65 Q30 -50 25 -25" fill="#6A6A6A"/>
        <rect x="60" y="-20" width="6" height="70" fill="#C0C0C0"/>
      </g>`,
    
    robot: `
      <g transform="translate(${w*0.45}, ${h*0.52})">
        <ellipse cx="0" cy="100" rx="50" ry="15" fill="rgba(0,0,0,0.2)"/>
        <rect x="-35" y="-10" width="70" height="70" rx="10" fill="#6A6A7A"/>
        <rect x="-30" y="-70" width="60" height="50" rx="10" fill="#6A6A7A"/>
        <rect x="-20" y="-58" width="15" height="20" rx="3" fill="#00FFFF"/>
        <rect x="5" y="-58" width="15" height="20" rx="3" fill="#00FFFF"/>
      </g>`,
    
    princess: `
      <g transform="translate(${w*0.45}, ${h*0.52})">
        <ellipse cx="0" cy="95" rx="40" ry="12" fill="rgba(0,0,0,0.2)"/>
        <path d="M-35 20 Q-45 50 -40 90 Q-20 100 0 105 Q20 100 40 90 Q45 50 35 20 Q20 5 0 10 Q-20 5 -35 20" fill="#FF69B4"/>
        <circle cx="0" cy="-15" r="28" fill="${palette.skin[0]}"/>
        <path d="M-18 -45 L-15 -55 L-8 -48 L0 -60 L8 -48 L15 -55 L18 -45 Z" fill="#FFD700"/>
      </g>`,
    
    astronaut: `
      <g transform="translate(${w*0.45}, ${h*0.50})">
        <ellipse cx="0" cy="100" rx="45" ry="15" fill="rgba(0,0,0,0.2)"/>
        <rect x="-38" y="-5" width="76" height="65" rx="15" fill="#F0F0F0"/>
        <circle cx="0" cy="-40" r="35" fill="#F5F5F5"/>
        <circle cx="0" cy="-40" r="25" fill="#87CEEB" opacity="0.4"/>
      </g>`,
    
    pirate: `
      <g transform="translate(${w*0.45}, ${h*0.52})">
        <ellipse cx="0" cy="100" rx="45" ry="15" fill="rgba(0,0,0,0.2)"/>
        <path d="M-35 10 Q-40 40 -35 60 Q-20 70 0 72 Q20 70 35 60 Q40 40 35 10 Q20 0 0 5 Q-20 0 -35 10" fill="#8B0000"/>
        <circle cx="0" cy="-15" r="30" fill="${palette.skin[0]}"/>
        <path d="M-28 -25 Q-20 -50 0 -48 Q20 -50 28 -25" fill="#FF0000"/>
        <ellipse cx="12" cy="-20" rx="8" ry="6" fill="#333"/>
      </g>`,
    
    hero: `
      <g transform="translate(${w*0.45}, ${h*0.52})">
        <ellipse cx="0" cy="100" rx="45" ry="15" fill="rgba(0,0,0,0.2)"/>
        <path d="M-40 10 Q-50 50 -35 100 L-35 105 Q0 95 35 105 L35 100 Q50 50 40 10 Q20 5 0 8 Q-20 5 -40 10" fill="#2F4F4F"/>
        <path d="M-30 5 Q-35 35 -30 60 Q-15 70 0 72 Q15 70 30 60 Q35 35 30 5 Q15 -5 0 0 Q-15 -5 -30 5" fill="#5D4E37"/>
        <circle cx="0" cy="-20" r="28" fill="${palette.skin[0]}"/>
        <ellipse cx="0" cy="-48" rx="35" ry="7" fill="#4A3A2A"/>
        <path d="M-25 -48 Q-30 -65 -20 -75 Q-5 -85 0 -85 Q5 -85 20 -75 Q30 -65 25 -48" fill="#5D4E37"/>
      </g>`,
    
    child: `
      <g transform="translate(${w*0.45}, ${h*0.55})">
        <ellipse cx="0" cy="70" rx="30" ry="10" fill="rgba(0,0,0,0.2)"/>
        <rect x="-18" y="45" width="14" height="28" rx="5" fill="#4A90A4"/>
        <rect x="4" y="45" width="14" height="28" rx="5" fill="#4A90A4"/>
        <path d="M-22 5 Q-28 25 -25 45 Q-10 55 0 55 Q10 55 25 45 Q28 25 22 5 Q12 -5 0 0 Q-12 -5 -22 5" fill="#FFB347"/>
        <circle cx="0" cy="-20" r="25" fill="${palette.skin[0]}"/>
        <ellipse cx="-9" cy="-22" rx="7" ry="9" fill="white"/>
        <ellipse cx="9" cy="-22" rx="7" ry="9" fill="white"/>
        <circle cx="-7" cy="-20" r="5" fill="#4A8B4A"/>
        <circle cx="11" cy="-20" r="5" fill="#4A8B4A"/>
      </g>`,
    
    animal: `
      <g transform="translate(${w*0.45}, ${h*0.55})">
        <ellipse cx="0" cy="80" rx="40" ry="12" fill="rgba(0,0,0,0.2)"/>
        <ellipse cx="0" cy="40" rx="35" ry="40" fill="#A0782C"/>
        <ellipse cx="0" cy="45" rx="22" ry="25" fill="#D4A85A"/>
        <circle cx="0" cy="-20" r="32" fill="#A0782C"/>
        <circle cx="-25" cy="-45" r="12" fill="#A0782C"/>
        <circle cx="25" cy="-45" r="12" fill="#A0782C"/>
        <ellipse cx="0" cy="-8" rx="18" ry="14" fill="#D4A85A"/>
        <ellipse cx="0" cy="-12" rx="8" ry="6" fill="#333"/>
        <ellipse cx="-12" cy="-28" rx="8" ry="10" fill="white"/>
        <ellipse cx="12" cy="-28" rx="8" ry="10" fill="white"/>
        <circle cx="-10" cy="-26" r="5" fill="#333"/>
        <circle cx="14" cy="-26" r="5" fill="#333"/>
      </g>`
  };

  return characters[type] || characters.hero;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskDescription = '', dimensions = { width: 1024, height: 576 }, customText = {} } = body;
    
    console.log('[SVG v9.3.0] TZ:', taskDescription?.substring(0, 50));
    const startTime = Date.now();

    const tzAnalysis = await analyzeTZWithAI(taskDescription);
    console.log('[SVG] Analysis:', tzAnalysis);
    console.log('[SVG] AI was used:', tzAnalysis.aiUsed);
    
    const palette = STYLE_PALETTES.ghibli;
    const sceneRand = seededRandom(999);
    
    const characterType = tzAnalysis.characterType || 'hero';
    const characterName = tzAnalysis.characterName || 'Герой';
    const detectedLocation = tzAnalysis.location || 'волшебный лес';
    const customElements = tzAnalysis.customElements || [];
    const timeOfDay = tzAnalysis.timeOfDay || 'день';
    
    const allElements = [...customElements];
    if (detectedLocation.includes('гор')) allElements.push('горы');
    if (detectedLocation.includes('мор')) allElements.push('море');
    if (detectedLocation.includes('космос')) allElements.push('звёзды');
    
    const w = dimensions.width;
    const h = dimensions.height;
    
    const timeColors: Record<string, {sky: string[], sun: string, sunY: number, moon: boolean}> = {
      'день': { sky: palette.sky, sun: '#FFD700', sunY: 0.08, moon: false },
      'ночь': { sky: ['#0D1B2A', '#1B263B', '#2D3E50', '#415A77', '#5A7090'], sun: '#F5F5DC', sunY: 0.1, moon: true },
      'вечер': { sky: ['#FF6B35', '#F7931E', '#FFB347', '#FFD700', '#FFE4B5'], sun: '#FF4500', sunY: 0.28, moon: false },
      'рассвет': { sky: ['#FFB6C1', '#FFC0CB', '#FFDAB9', '#FFE4E1', '#FFF0F5'], sun: '#FFA500', sunY: 0.38, moon: false }
    };
    const tc = timeColors[timeOfDay] || timeColors['день'];
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <defs>
        <linearGradient id="fSky" x1="0%" y1="0%" x2="0%" y2="100%">${tc.sky.map((c, i) => `<stop offset="${i*25}%" stop-color="${c}"/>`).join('')}</linearGradient>
        <linearGradient id="fGround" x1="0%" y1="0%" x2="0%" y2="100%">${palette.ground.map((c, i) => `<stop offset="${i*25}%" stop-color="${c}"/>`).join('')}</linearGradient>
        <filter id="fGlow"><feGaussianBlur stdDeviation="3"/></filter>
        <filter id="fTreeShadow"><feDropShadow dx="2" dy="3" stdDeviation="3"/></filter>
      </defs>
      
      <rect width="100%" height="${h*0.65}" fill="url(#fSky)"/>
      ${tc.moon ? `<circle cx="${w*0.8}" cy="${h*0.12}" r="35" fill="#F5F5DC"/>` : `<circle cx="${w*0.82}" cy="${h*tc.sunY}" r="80" fill="${tc.sun}" opacity="0.15" filter="url(#fGlow)"/><circle cx="${w*0.82}" cy="${h*tc.sunY}" r="30" fill="${tc.sun}"/>`}
      
      ${allElements.includes('горы') ? `<path d="M0 ${h*0.5} L${w*0.15} ${h*0.25} L${w*0.3} ${h*0.45} L${w*0.4} ${h*0.2} L${w*0.55} ${h*0.42} L${w*0.65} ${h*0.18} L${w*0.8} ${h*0.38} L${w*0.95} ${h*0.22} L${w} ${h*0.45} L${w} ${h*0.5} Z" fill="#8BA5B5" opacity="0.6"/>` : ''}
      
      ${allElements.includes('море') ? `<rect y="${h*0.6}" width="100%" height="${h*0.4}" fill="#1E90FF" opacity="0.6"/>` : ''}
      
      ${allElements.includes('звёзды') ? `<g>${Array.from({length: 80}, () => `<circle cx="${sceneRand()*w}" cy="${sceneRand()*h*0.6}" r="${sceneRand()*2+0.5}" fill="white" opacity="${sceneRand()*0.7+0.3}"/>`).join('')}</g>` : ''}
      
      <rect y="${h*0.62}" width="100%" height="${h*0.38}" fill="url(#fGround)"/>
      
      ${Array.from({length: 250}, () => {
        const x = sceneRand() * w;
        const y = h*0.65 + sceneRand() * h*0.32;
        const gh = sceneRand() * 20 + 6;
        return `<path d="M${x} ${y} Q${x+(sceneRand()*12-6)} ${y-gh/2} ${x+(sceneRand()*8-4)} ${y-gh}" stroke="${palette.ground[Math.floor(sceneRand()*3)]}" stroke-width="${sceneRand()*2+0.5}" fill="none" opacity="${sceneRand()*0.4+0.3}"/>`;
      }).join('')}
      
      ${Array.from({length: 35}, () => {
        const x = sceneRand() * w;
        const y = h*0.75 + sceneRand() * h*0.2;
        const r = sceneRand() * 4 + 2;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="${palette.accent[Math.floor(sceneRand()*palette.accent.length)]}" opacity="0.7"/>`;
      }).join('')}
      
      ${Array.from({length: 12}, () => {
        const x = sceneRand() * w;
        const y = h*0.82 + sceneRand() * h*0.12;
        const scale = sceneRand() * 0.5 + 0.3;
        return `<rect x="${x-3*scale}" y="${y-10*scale}" width="${6*scale}" height="${10*scale}" fill="#F5DEB3"/><ellipse cx="${x}" cy="${y-10*scale}" rx="${7*scale}" ry="${4*scale}" fill="${sceneRand()>0.5 ? '#D35400' : '#E74C3C'}"/>`;
      }).join('')}
      
      ${Array.from({length: 3}, (_, i) => {
        const x = w * 0.2 + i * w * 0.3;
        const y = h * 0.75;
        return `<g filter="url(#fTreeShadow)">${generateTree(x, y, 0.8 + sceneRand() * 0.3, palette, sceneRand)}</g>`;
      }).join('')}
      
      ${generateCharacter(characterType, w, h, palette, sceneRand)}
      
      ${Array.from({length: 15}, () => `<circle cx="${sceneRand()*w}" cy="${sceneRand()*h}" r="${sceneRand()*1.5+0.3}" fill="white" opacity="${sceneRand()*0.15+0.05}"/>`).join('')}
      
      <g transform="translate(12, ${h-28})">
        <rect x="-4" y="-14" width="160" height="22" rx="3" fill="rgba(0,0,0,0.5)"/>
        <text font-size="10" fill="white" font-weight="bold">👤 ${characterName}</text>
        <text x="75" font-size="8" fill="rgba(255,255,255,0.6)">| ${taskDescription?.substring(0,18) || 'ТЗ'}...</text>
      </g>
      
      <text x="${w-12}" y="${h-6}" text-anchor="end" font-size="8" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ v9.3.0 ${tzAnalysis.aiUsed ? '🤖AI' : '📝'}</text>
    </svg>`;

    return NextResponse.json({
      success: true,
      version: '9.3.0',
      aiUsed: tzAnalysis.aiUsed,
      tzAnalysis: { characterType, characterName, location: detectedLocation, customElements, mood: tzAnalysis.mood, timeOfDay },
      totalTime: Date.now() - startTime,
      finalScene: { svg, success: true }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
