import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

// GET /api/work - получить статус работы
export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'ready',
    message: 'Система работы агентов готова'
  });
}

// POST /api/work - выполнить работу агента
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, agentRole, taskType, input, projectContext } = body;

    console.log(`[Work] Agent ${agentId} (${agentRole}) starting task: ${taskType}`);

    let result: any = {
      agentId,
      agentRole,
      taskType,
      status: 'completed',
      completedAt: new Date().toISOString()
    };

    switch (taskType) {
      case 'generate_script':
        result.output = {
          script: await generateScript(input, projectContext),
          wordCount: Math.floor(Math.random() * 500) + 200
        };
        break;

      case 'generate_character':
        result.output = {
          character: await generateCharacter(input, projectContext),
          description: 'Персонаж создан'
        };
        break;

      case 'generate_scene':
        result.output = {
          scene: await generateScene(input, projectContext),
          description: 'Сцена создана'
        };
        break;

      case 'generate_storyboard':
        result.output = {
          storyboard: await generateStoryboard(input, projectContext),
          frames: Math.floor(Math.random() * 8) + 4
        };
        break;

      case 'expand_scene':
        result.output = {
          expandedScene: await expandScene(input, projectContext),
          description: 'Сцена расширена'
        };
        break;

      case 'generate_dialogue':
        result.output = {
          dialogue: await generateDialogue(input, context),
          description: 'Диалоги созданы'
        };
        break;

      default:
        result.output = {
          message: 'Задача выполнена',
          details: input
        };
    }

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[Work] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

// Расширенные описания стилей
const STYLE_GUIDES: Record<string, {
  description: string;
  visualStyle: string;
  themes: string[];
  pacing: string;
  colorPalette: string[];
}> = {
  ghibli: {
    description: 'Студия Ghibli (Хаяо Миядзаки) — мягкие акварельные тона, волшебная атмосфера, внимание к деталям природы',
    visualStyle: 'Мягкие градиенты, пастельные цвета, детализированные фоны, плавная анимация',
    themes: ['природа vs технологии', 'взросление', 'магия в обыденном', 'сильные женские персонажи'],
    pacing: 'Размеренный с моментами напряжения',
    colorPalette: ['мятный', 'небесно-голубой', 'пшеничный', 'изумрудный']
  },
  disney: {
    description: 'Классическая Disney 2D анимация — яркие цвета, выразительные персонажи, мюзикл-формат',
    visualStyle: 'Чёткие линии, насыщенные цвета, выразительная мимика, театральные позы',
    themes: ['добро vs зло', 'любовь', 'семья', 'самопожертвование', 'мечты'],
    pacing: 'Динамичный с музыкальными номерами',
    colorPalette: ['королевский синий', 'золотой', 'пурпурный', 'ярко-красный']
  },
  pixar: {
    description: 'Pixar 3D анимация — современная компьютерная графика, эмоциональная глубина, семейные темы',
    visualStyle: 'Фотореалистичные текстуры, сложное освещение, объёмные персонажи',
    themes: ['семья', 'дружба', 'принятие себя', 'взросление', 'смешные и грустные моменты'],
    pacing: 'Сбалансированный с эмоциональными пиками',
    colorPalette: ['тёплые оранжевые', 'глубокие синие', 'яркие акценты']
  },
  anime: {
    description: 'Японское аниме — динамичные сцены, стилизованные персонажи, эмоциональная глубина',
    visualStyle: 'Контрастные линии, яркие цвета, стилизованные пропорции, динамичные ракурсы',
    themes: ['дружба', 'преодоление', 'честь', 'судьба', 'сверхспособности'],
    pacing: 'Быстрый с моментами рефлексии',
    colorPalette: ['розовый', 'электрик-блю', 'чёрный', 'серебряный']
  }
};

// Генератор сценария
async function generateScript(input: any, context: any) {
  const { title, idea, style, duration, genre, targetAudience } = input;
  
  const styleGuide = STYLE_GUIDES[style] || STYLE_GUIDES.ghibli;
  
  console.log('[generateScript] Input title:', title);
  console.log('[generateScript] Input idea:', idea?.substring(0, 100) + '...');
  
  // Приоритет API: 1. Grok (xAI), 2. Zukijourney
  const grokUrl = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
  const grokKey = process.env.GROK_API_KEY;
  const zukiUrl = process.env.Z_AI_BASE_URL;
  const zukiKey = process.env.Z_AI_API_KEY;
  
  const prompt = `Ты — профессиональный сценарист анимационных фильмов с опытом работы в ${styleGuide.description}.

╔══════════════════════════════════════════════════════════════════════════════╗
║  ГЛАВНОЕ ПРАВИЛО: ВСЁ СОДЕРЖИМОЕ ДОЛЖНО БЫТЬ СВЯЗАНО С ИДЕЕЙ ПОЛЬЗОВАТЕЛЯ  ║
╚══════════════════════════════════════════════════════════════════════════════╝

🎬 НАЗВАНИЕ: "${title || 'Новый мультфильм'}"

💡 ИДЕЯ/СЮЖЕТ (ЭТО ОСНОВА ВСЕГО):
${idea || 'История о приключениях'}

═══════════════════════════════════════════════════════════════════════════════
ПЕРСОНАЖИ — ДОЛЖНЫ БЫТЬ СОЗДАНЫ НА ОСНОВЕ ИДЕИ ВЫШЕ:

❌ НЕЛЬЗЯ: Создавать стандартных персонажей "Алиса", "Оливер", "Тень"
❌ НЕЛЬЗЯ: Игнорировать содержание идеи
❌ НЕЛЬЗЯ: Использовать шаблонных героев

✅ НУЖНО:
   - Если идея про кота-астронавта → главный герой КОТ-АСТРОНАВТ
   - Если идея про принцессу → героиня ПРИНЦЕССА
   - Если идея про роботов → персонажи РОБОТЫ
   - Имена персонажей должны отражать их суть
   - Мотивации должны быть связаны с сюжетом идеи

═══════════════════════════════════════════════════════════════════════════════

🎨 СТИЛЬ: ${styleGuide.description}
📚 ЖАНР: ${genre || 'приключения'}
⏱️ ДЛИТЕЛЬНОСТЬ: ${duration || 90} секунд

ВЕРНИ JSON (БЕЗ MARKDOWN):
{
  "title": "${title || 'Название'}",
  "logline": "одна строка сюжета из идеи",
  "synopsis": "сюжет на основе идеи",
  "style": "${style}",
  "genre": "${genre || 'приключения'}",
  "totalDuration": ${duration || 90},
  "themes": ["темы из идеи"],
  "mood": "настроение",
  "visualStyle": {
    "colorPalette": ["цвета"],
    "lighting": "освещение",
    "atmosphere": "атмосфера"
  },
  "characters": [
    {
      "name": "ИМЯ СВЯЗАННОЕ С ИДЕЕЙ",
      "role": "protagonist",
      "description": "описание связанное с идеей",
      "appearance": "внешность подходит к идее",
      "personality": ["черты"],
      "motivation": "мотивация из идеи",
      "arc": "развитие",
      "emoji": "подходящий эмодзи"
    }
  ],
  "acts": [{"act": 1, "name": "Завязка", "description": "...", "duration": 20}],
  "scenes": [
    {
      "number": 1,
      "act": 1,
      "title": "название сцены",
      "location": "локация из идеи",
      "timeOfDay": "время",
      "description": "описание связанное с идеей",
      "action": "действие",
      "mood": "настроение",
      "cameraWork": "камера",
      "lighting": "освещение",
      "music": "музыка",
      "soundEffects": ["звуки"],
      "duration": 15,
      "visualEffects": "эффекты",
      "emotionalBeat": "эмоция",
      "characters": ["персонажи из ideas"],
      "dialogue": [{"character": "имя", "line": "реплика", "emotion": "эмоция", "action": "действие"}]
    }
  ],
  "conflicts": {"main": "конфликт из идеи", "internal": "...", "external": "..."},
  "resolution": "развязка из идеи",
  "moral": "мораль"
}`;

  const systemPrompt = `Ты — профессиональный сценарист анимации в стиле ${styleGuide.description}.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. ПЕРСОНАЖИ ДОЛЖНЫ БЫТЬ СОЗДАНЫ НА ОСНОВЕ ИДЕИ ПОЛЬЗОВАТЕЛЯ
2. Если идея про кота → главный герой КОТ (не человек!)
3. Если идея про робота → главный герой РОБОТ
4. Если идея про принцессу → героиня ПРИНЦЕССА
5. Никогда не используй стандартных персонажей "Алиса", "Оливер", "Тень"
6. Имена персонажей должны отражать суть идеи
7. Все сцены и диалоги должны быть связаны с идеей

Отвечай ТОЛЬКО валидным JSON без markdown.`;

  // 1. Попробуем Grok API (xAI)
  if (grokKey) {
    try {
      console.log('[generateScript] Trying Grok API (xAI)...');
      
      const response = await fetch(grokUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokKey}`
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          stream: false
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const script = JSON.parse(jsonMatch[0]);
          console.log('[generateScript] ✅ Grok API success! Scenes:', script.scenes?.length);
          return script;
        }
      } else {
        console.log('[generateScript] Grok API error:', response.status);
      }
    } catch (error) {
      console.error('[generateScript] Grok API error:', error);
    }
  }
  
  // 2. Попробуем Zukijourney API
  if (zukiUrl && zukiKey) {
    try {
      console.log('[generateScript] Trying Zukijourney API...');
      
      const response = await fetch(`${zukiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${zukiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const script = JSON.parse(jsonMatch[0]);
          console.log('[generateScript] ✅ Zukijourney API success! Scenes:', script.scenes?.length);
          return script;
        }
      } else {
        console.log('[generateScript] Zukijourney API error:', response.status);
      }
    } catch (error) {
      console.error('[generateScript] Zukijourney API error:', error);
    }
  }
  
  console.log('[generateScript] No API available, using smart template');
  
  // Fallback - умный шаблон
  return generateSmartTemplate(title, idea, style, duration, genre, styleGuide);
}

// Умный шаблон сценария, адаптирующийся под идею пользователя
function generateSmartTemplate(
  title: string, 
  idea: string, 
  style: string, 
  duration: number,
  genre: string,
  styleGuide: typeof STYLE_GUIDES.ghibli
) {
  const baseDuration = duration || 90;
  const projectTitle = title || 'Волшебное путешествие';
  const projectIdea = idea || 'История о приключениях';
  
  // Анализируем идею для создания персонажей
  const analyzedData = analyzeIdea(projectIdea, projectTitle, genre);
  
  return {
    title: projectTitle,
    logline: analyzedData.logline,
    synopsis: analyzedData.synopsis,
    style: style,
    genre: genre || 'приключения',
    targetAudience: 'семейный просмотр',
    totalDuration: baseDuration,
    themes: analyzedData.themes,
    mood: analyzedData.mood,
    visualStyle: {
      colorPalette: styleGuide.colorPalette,
      lighting: analyzedData.lighting,
      atmosphere: styleGuide.description
    },
    characters: analyzedData.characters,
    acts: analyzedData.acts.map((act: any, i: number) => ({
      ...act,
      duration: Math.floor(baseDuration * [0.2, 0.35, 0.3, 0.15][i])
    })),
    scenes: analyzedData.scenes.map((scene: any, i: number) => ({
      ...scene,
      duration: Math.floor(baseDuration / analyzedData.scenes.length * (0.8 + Math.random() * 0.4))
    })),
    conflicts: analyzedData.conflicts,
    resolution: analyzedData.resolution,
    moral: analyzedData.moral
  };
}

// Анализ идеи и генерация контента на её основе
function analyzeIdea(idea: string, title: string, genre: string) {
  const ideaLower = idea.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Определяем тип персонажей на основе идеи
  const characterKeywords: Record<string, { characters: any[], locations: string[], mood: string }> = {
    // Космос
    'косм': {
      characters: [
        { name: 'Космо', role: 'protagonist', emoji: '🚀', baseDesc: 'отважный путешественник' },
        { name: 'Звёздочка', role: 'supporting', emoji: '⭐', baseDesc: 'верный спутник' },
        { name: 'Чёрная Дыра', role: 'antagonist', emoji: '🕳️', baseDesc: 'загадочная угроза' }
      ],
      locations: ['Космическая станция', 'Неизвестная планета', 'Туманность', 'Домашняя галактика'],
      mood: 'таинственный и величественный'
    },
    // Животные
    'кот': {
      characters: [
        { name: 'Пушок', role: 'protagonist', emoji: '🐱', baseDesc: 'пушистый герой' },
        { name: 'Мурка', role: 'supporting', emoji: '😺', baseDesc: 'мудрая советчица' },
        { name: 'Шершень', role: 'antagonist', emoji: '😠', baseDesc: 'злой соседский пёс' }
      ],
      locations: ['Уютный дом', 'Соседский сад', 'Большой парк', 'Домой'],
      mood: 'уютный и тёплый'
    },
    'соба': {
      characters: [
        { name: 'Шарик', role: 'protagonist', emoji: '🐕', baseDesc: 'верный пёс' },
        { name: 'Бим', role: 'supporting', emoji: '🐶', baseDesc: 'лучший друг' },
        { name: 'Волк', role: 'antagonist', emoji: '🐺', baseDesc: 'дикий соперник' }
      ],
      locations: ['Двор', 'Лес', 'Город', 'Дом'],
      mood: 'верный и преданный'
    },
    // Природа/лес
    'лес': {
      characters: [
        { name: 'Листик', role: 'protagonist', emoji: '🍃', baseDesc: 'молодой дух леса' },
        { name: 'Дуб', role: 'supporting', emoji: '🌳', baseDesc: 'мудрый старец' },
        { name: 'Огонь', role: 'antagonist', emoji: '🔥', baseDesc: 'разрушительная сила' }
      ],
      locations: ['Опушка леса', 'Глубокая чаща', 'Священная поляна', 'Возрождённый лес'],
      mood: 'природный и волшебный'
    },
    // Море
    'мор': {
      characters: [
        { name: 'Волна', role: 'protagonist', emoji: '🌊', baseDesc: 'молодая русалка' },
        { name: 'Краб', role: 'supporting', emoji: '🦀', baseDesc: 'мудрый отшельник' },
        { name: 'Шторм', role: 'antagonist', emoji: '⛈️', baseDesc: 'разрушительная стихия' }
      ],
      locations: ['Подводный город', 'Коралловый риф', 'Глубины', 'Поверхность'],
      mood: 'глубокий и таинственный'
    },
    // Роботы
    'робот': {
      characters: [
        { name: 'Гиго', role: 'protagonist', emoji: '🤖', baseDesc: 'робот с душой' },
        { name: 'Бип', role: 'supporting', emoji: '💡', baseDesc: 'маленький помощник' },
        { name: 'Вирус', role: 'antagonist', emoji: '👾', baseDesc: 'злая программа' }
      ],
      locations: ['Лаборатория', 'Цифровой мир', 'Серверная', 'Реальный мир'],
      mood: 'футуристичный и технологичный'
    },
    // Драконы
    'дракон': {
      characters: [
        { name: 'Огнехвост', role: 'protagonist', emoji: '🐉', baseDesc: 'молодой дракончик' },
        { name: 'Мудрец', role: 'supporting', emoji: '🧙', baseDesc: 'старый волшебник' },
        { name: 'Ледяной', role: 'antagonist', emoji: '❄️', baseDesc: 'холодный захватчик' }
      ],
      locations: ['Горное гнездо', 'Древние руины', 'Ледяная крепость', 'Небесный замок'],
      mood: 'эпичный и волшебный'
    },
    // Принцессы
    'принц': {
      characters: [
        { name: 'Аврора', role: 'protagonist', emoji: '👸', baseDesc: 'смелая принцесса' },
        { name: 'Фея', role: 'supporting', emoji: '🧚', baseDesc: 'волшебная наставница' },
        { name: 'Моргана', role: 'antagonist', emoji: '🧙‍♀️', baseDesc: 'тёмная колдунья' }
      ],
      locations: ['Королевский замок', 'Заколдованный лес', 'Тёмная башня', 'Тронный зал'],
      mood: 'сказочный и романтичный'
    },
    // Пираты
    'пират': {
      characters: [
        { name: 'Капитан Джек', role: 'protagonist', emoji: '🏴‍☠️', baseDesc: 'отважный капитан' },
        { name: 'Попугай', role: 'supporting', emoji: '🦜', baseDesc: 'болтливый помощник' },
        { name: 'Крюк', role: 'antagonist', emoji: '🪝', baseDesc: 'коварный соперник' }
      ],
      locations: ['Пиратский корабль', 'Остров сокровищ', 'Штормовое море', 'Порт'],
      mood: 'приключенческий и весёлый'
    },
    // Дружба
    'друж': {
      characters: [
        { name: 'Мила', role: 'protagonist', emoji: '👧', baseDesc: 'добрая девочка' },
        { name: 'Тимофей', role: 'supporting', emoji: '🧸', baseDesc: 'верный друг' },
        { name: 'Одиночество', role: 'antagonist', emoji: '👻', baseDesc: 'тень разлуки' }
      ],
      locations: ['Школа', 'Парк', 'Дом друзей', 'Вместе'],
      mood: 'тёплый и душевный'
    },
    // По умолчанию
    default: {
      characters: [
        { name: 'Герой', role: 'protagonist', emoji: '🌟', baseDesc: 'смелый искатель приключений' },
        { name: 'Помощник', role: 'supporting', emoji: '✨', baseDesc: 'верный спутник' },
        { name: 'Противник', role: 'antagonist', emoji: ' shadow', baseDesc: 'сложный соперник' }
      ],
      locations: ['Начало пути', 'Место испытаний', 'Кульминация', 'Финал'],
      mood: 'вдохновляющий'
    }
  };
  
  // Ищем ключевые слова в идее
  let matchedData = characterKeywords.default;
  for (const [keyword, data] of Object.entries(characterKeywords)) {
    if (ideaLower.includes(keyword) || titleLower.includes(keyword)) {
      matchedData = data;
      break;
    }
  }
  
  // Создаём персонажей с привязкой к идее
  const characters = matchedData.characters.map(char => {
    const isProtagonist = char.role === 'protagonist';
    const isAntagonist = char.role === 'antagonist';
    
    return {
      name: char.name,
      role: char.role,
      description: `${char.baseDesc}, ${isProtagonist ? 'связанный с ' + idea.substring(0, 50) : isAntagonist ? 'препятствующий герою в ' + idea.substring(0, 30) : 'помогающий герою'}`,
      appearance: generateAppearance(char.name, char.emoji),
      personality: generatePersonality(char.role),
      motivation: isProtagonist ? idea.substring(0, 80) : isAntagonist ? `Мешать: ${idea.substring(0, 40)}` : `Помочь герою в: ${idea.substring(0, 40)}`,
      arc: generateArc(char.role, idea),
      emoji: char.emoji
    };
  });
  
  // Создаём сцены на основе идеи
  const scenes = generateScenesFromIdea(idea, title, matchedData.locations, characters, matchedData.mood);
  
  // Генерируем остальные элементы
  return {
    logline: `${title} — ${idea.substring(0, 100)}${idea.length > 100 ? '...' : ''}`,
    synopsis: `${title}. ${idea} Это история о смелости, дружбе и вере в себя.`,
    themes: extractThemes(idea, genre),
    mood: matchedData.mood,
    lighting: 'мягкое естественное освещение с магическими акцентами',
    characters,
    acts: [
      { act: 1, name: 'Завязка', description: `Начало истории: ${idea.substring(0, 50)}...` },
      { act: 2, name: 'Развитие', description: 'Герой сталкивается с испытаниями' },
      { act: 3, name: 'Кульминация', description: 'Решающее противостояние' },
      { act: 4, name: 'Развязка', description: 'Победа и новое начало' }
    ],
    scenes,
    conflicts: {
      main: `Главный конфликт: реализация идеи "${idea.substring(0, 50)}..."`,
      internal: 'Преодоление собственных страхов и сомнений',
      external: 'Препятствия на пути к цели'
    },
    resolution: `Герой добивается цели: ${idea.substring(0, 60)}...`,
    moral: 'Настоящая сила — в вере в себя и поддержке друзей'
  };
}

function generateAppearance(name: string, emoji: string): string {
  const appearances: Record<string, string> = {
    '🚀': 'Серебристый скафандр, яркие глаза, решительный взгляд',
    '⭐': 'Светящееся тело, тёплая аура, добрая улыбка',
    '🕳️': 'Тёмная полупрозрачная фигура, загадочные очертания',
    '🐱': 'Рыжая шерсть, зелёные глаза, пушистый хвост',
    '😺': 'Серая шёрстка, мудрые глаза, мягкие лапки',
    '😠': 'Огромные зубы, грозный вид, мощные лапы',
    '🐕': 'Золотистая шерсть, карие глаза, виляющий хвост',
    '🐶': 'Маленький, коричневый, большие уши',
    '🐺': 'Серая шерсть, жёлтые глаза, острые клыки',
    '🍃': 'Изумрудное свечение, форма листа, нежный ореол',
    '🌳': 'Мощный ствол, густая крона, мудрый взгляд',
    '🔥': 'Огненные языки, горячее дыхание, пугающий вид',
    '🌊': 'Синие волосы, хвост русалки, жемчужные глаза',
    '🦀': 'Красный панцирь, большие клешни, добрые глаза',
    '⛈️': 'Тёмные тучи, молнии, грозный рёв',
    '🤖': 'Металлическое тело, светящиеся глаза, антенны',
    '💡': 'Маленький, светящийся, округлая форма',
    '👾': 'Глитчерные контуры, красные глаза, цифровой шум',
    '🐉': 'Зелёная чешуя, большие крылья, добрые глаза',
    '🧙': 'Длинная борода, посох, звёздная мантия',
    '❄️': 'Ледяная чешуя, холодное дыхание, синие глаза',
    '👸': 'Золотые волосы, королевское платье, добрые глаза',
    '🧚': 'Крылья бабочки, сияние, изящная фигура',
    '🧙‍♀️': 'Тёмная мантия, фиолетовые глаза, зловещая улыбка',
    '🏴‍☠️': 'Треуголка, борода, кожаный жилет',
    '🦜': 'Яркие перья, говорящий клюв, умные глаза',
    '🪝': 'Крюк вместо руки, чёрная одежда, хитрый взгляд',
    '👧': 'Каштановые волосы, зелёные глаза, яркое платье',
    '🧸': 'Мягкая шерсть, пуговичные глаза, улыбка',
    '👻': 'Полупрозрачный, грустные глаза, тихий шёпот',
    '🌟': 'Светящееся тело, добрая улыбка, яркие глаза',
    '✨': 'Маленькое тело, яркое свечение, весёлый вид'
  };
  return appearances[emoji] || 'Уникальная внешность, запоминающийся образ';
}

function generatePersonality(role: string): string[] {
  if (role === 'protagonist') {
    return ['смелый', 'добрый', 'решительный', 'любопытный'];
  } else if (role === 'antagonist') {
    return ['хитрый', 'манипулятивный', 'одинокий', 'сложный'];
  } else {
    return ['мудрый', 'заботливый', 'верный', 'остроумный'];
  }
}

function generateArc(role: string, idea: string): string {
  if (role === 'protagonist') {
    return `От неуверенности к принятию своей силы в "${idea.substring(0, 30)}..."`;
  } else if (role === 'antagonist') {
    return 'Понимает ошибочность своих действий';
  } else {
    return 'Учит быть наставником и другом';
  }
}

function extractThemes(idea: string, genre: string): string[] {
  const themes: string[] = [];
  const ideaLower = idea.toLowerCase();
  
  if (ideaLower.includes('друж')) themes.push('дружба');
  if (ideaLower.includes('любов')) themes.push('любовь');
  if (ideaLower.includes('семь')) themes.push('семья');
  if (ideaLower.includes('приключ')) themes.push('приключения');
  if (ideaLower.includes('маг') || ideaLower.includes('волшеб')) themes.push('магия');
  if (ideaLower.includes('косм')) themes.push('исследование');
  if (ideaLower.includes('море')) themes.push('море');
  
  if (themes.length === 0) {
    themes.push('самопознание', 'смелость');
  }
  
  return themes.slice(0, 3);
}

function generateScenesFromIdea(
  idea: string, 
  title: string, 
  locations: string[], 
  characters: any[],
  mood: string
): any[] {
  const protagonist = characters.find(c => c.role === 'protagonist')?.name || 'Герой';
  const supporting = characters.find(c => c.role === 'supporting')?.name || 'Помощник';
  const antagonist = characters.find(c => c.role === 'antagonist')?.name || 'Противник';
  
  return [
    {
      number: 1,
      act: 1,
      title: 'Начало',
      location: locations[0] || 'Начало пути',
      timeOfDay: 'утро',
      description: `${protagonist} начинает историю: ${idea.substring(0, 60)}...`,
      action: `${protagonist} отправляется в путь, полный надежд`,
      mood: mood,
      cameraWork: 'Широкий план, плавное приближение к герою',
      lighting: 'Мягкий утренний свет',
      music: 'Вдохновляющая тема начала',
      soundEffects: ['звуки природы', 'лёгкий ветер'],
      visualEffects: 'Мягкое свечение вокруг героя',
      emotionalBeat: 'Надежда и предвкушение',
      characters: [protagonist],
      dialogue: [
        { character: protagonist, line: `Начинается моё приключение: ${idea.substring(0, 40)}...`, emotion: 'решимость', action: 'делает первый шаг' }
      ]
    },
    {
      number: 2,
      act: 2,
      title: 'Встреча',
      location: locations[1] || 'Место встречи',
      timeOfDay: 'день',
      description: `${protagonist} встречает ${supporting}, который станет верным спутником`,
      action: `${protagonist} и ${supporting} объединяются ради общей цели`,
      mood: 'дружелюбный',
      cameraWork: 'Средний план двух персонажей',
      lighting: 'Яркое дневное освещение',
      music: 'Тема дружбы',
      soundEffects: ['смех', 'разговор'],
      visualEffects: 'Тёплое свечение при встрече',
      emotionalBeat: 'Радость знакомства',
      characters: [protagonist, supporting],
      dialogue: [
        { character: supporting, line: `Привет! Я тоже хочу помочь с ${idea.substring(0, 30)}...`, emotion: 'радость', action: 'протягивает руку' },
        { character: protagonist, line: 'Вместе мы справимся!', emotion: 'надежда', action: 'жмёт руку' }
      ]
    },
    {
      number: 3,
      act: 2,
      title: 'Испытание',
      location: locations[2] || 'Место испытания',
      timeOfDay: 'вечер',
      description: `${antagonist} появляется и создаёт препятствие на пути героев`,
      action: `Герои сталкиваются с ${antagonist} и должны преодолеть его`,
      mood: 'напряжённый',
      cameraWork: 'Контрастные кадры, динамичная смена',
      lighting: 'Драматичное освещение',
      music: 'Напряжённая тема',
      soundEffects: ['гром', 'эхо'],
      visualEffects: 'Молнии, тени',
      emotionalBeat: 'Напряжение и страх',
      characters: [protagonist, supporting, antagonist],
      dialogue: [
        { character: antagonist, line: `Вы не пройдёте! ${idea.substring(0, 20)}... невозможно!`, emotion: 'угроза', action: 'блокирует путь' },
        { character: protagonist, line: 'Мы не сдадимся!', emotion: 'решимость', action: 'готовится к бою' }
      ]
    },
    {
      number: 4,
      act: 3,
      title: 'Кульминация',
      location: locations[3] || 'Место битвы',
      timeOfDay: 'ночь',
      description: `Финальное противостояние: ${idea.substring(0, 50)}...`,
      action: `${protagonist} находит способ преодолеть ${antagonist}`,
      mood: 'эпичный',
      cameraWork: 'Динамичные кадры, широкий угол',
      lighting: 'Контраст света и тьмы',
      music: 'Эпичная оркестровая тема',
      soundEffects: ['взрывы', 'крики', 'победа'],
      visualEffects: 'Вспышки света, магия',
      emotionalBeat: 'Триумф',
      characters: [protagonist, supporting, antagonist],
      dialogue: [
        { character: protagonist, line: `Я сделал это! ${idea.substring(0, 40)}!`, emotion: 'победа', action: 'поднимает руки' },
        { character: supporting, line: 'Ты справился!', emotion: 'радость', action: 'обнимает героя' }
      ]
    },
    {
      number: 5,
      act: 4,
      title: 'Финал',
      location: 'Дома',
      timeOfDay: 'рассвет',
      description: `${title} — история завершена, герои возвращаются победителями`,
      action: 'Мир изменился к лучшему, герои празднуют победу',
      mood: 'радостный',
      cameraWork: 'Панорама, плавное отдаление',
      lighting: 'Золотой рассвет',
      music: 'Финальная тема надежды',
      soundEffects: ['пение птиц', 'смех'],
      visualEffects: 'Тёплое свечение, радуга',
      emotionalBeat: 'Завершение и новая глава',
      characters: characters.map(c => c.name),
      dialogue: [
        { character: protagonist, line: 'Это было незабываемое приключение!', emotion: 'счастье', action: 'смотрит на горизонт' },
        { character: supporting, line: 'И это только начало!', emotion: 'радость', action: 'смеётся' }
      ]
    }
  ];
}

// Расширенная генерация персонажа
async function generateCharacter(input: any, context: any) {
  const { name, role, style, age, personality } = input;
  const baseUrl = process.env.Z_AI_BASE_URL;
  const apiKey = process.env.Z_AI_API_KEY;
  
  if (baseUrl && apiKey) {
    try {
      const styleGuide = STYLE_GUIDES[style] || STYLE_GUIDES.ghibli;
      
      const prompt = `Создай детального персонажа для анимационного фильма в стиле ${styleGuide.description}.

Имя: ${name || 'Новый персонаж'}
Роль: ${role || 'protagonist'} (protagonist/antagonist/supporting)
Возраст: ${age || 'не указан'}
Желаемые черты: ${personality || 'не указаны'}

Верни JSON:
{
  "name": "имя",
  "role": "роль",
  "age": "возраст",
  "description": "описание личности",
  "appearance": {
    "bodyType": "тип телосложения",
    "hairColor": "цвет волос",
    "eyeColor": "цвет глаз",
    "distinctiveFeatures": ["особенность1", "особенность2"],
    "clothing": "описание одежды"
  },
  "personality": ["черта1", "черта2", "черта3"],
  "strengths": ["сила1", "сила2"],
  "weaknesses": ["слабость1", "слабость2"],
  "motivation": "мотивация",
  "fears": ["страх1", "страх2"],
  "backstory": "предыстория персонажа",
  "relationships": [{"character": "имя", "relation": "тип отношения"}],
  "arc": "как персонаж развивается",
  "voiceType": "тип голоса",
  "catchphrase": "фирменная фраза",
  "emoji": "😀"
}`;

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Ты профессиональный создатель персонажей для анимации. Отвечай только JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.9,
          max_tokens: 1500
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error('[generateCharacter] AI error:', error);
    }
  }
  
  // Fallback
  return {
    name: name || 'Новый персонаж',
    role: role || 'protagonist',
    age: age || 'неизвестно',
    description: 'Уникальный персонаж с богатым внутренним миром',
    appearance: {
      bodyType: 'средний',
      hairColor: 'каштановые',
      eyeColor: 'карие',
      distinctiveFeatures: ['добрая улыбка'],
      clothing: 'простая, но стильная одежда'
    },
    personality: personality?.split(',').map((p: string) => p.trim()) || ['добрый', 'смелый', 'любопытный'],
    strengths: ['сила духа', 'доброта'],
    weaknesses: ['слишком доверчив'],
    motivation: 'Хочет изменить мир к лучшему',
    fears: ['потерять близких'],
    backstory: `${name} вырос в маленькой деревне и всегда мечтал о приключениях.`,
    relationships: [],
    arc: 'От неуверенности к признанию своей силы',
    voiceType: 'мягкий, тёплый',
    catchphrase: 'Всё возможно, если верить!',
    emoji: '😊'
  };
}

// Расширение сцены
async function expandScene(input: any, context: any) {
  const { scene, style, characters } = input;
  const baseUrl = process.env.Z_AI_BASE_URL;
  const apiKey = process.env.Z_AI_API_KEY;
  
  if (baseUrl && apiKey) {
    try {
      const styleGuide = STYLE_GUIDES[style] || STYLE_GUIDES.ghibli;
      
      const prompt = `Расширь сцену для анимационного фильма в стиле ${styleGuide.description}.

Исходная сцена:
${JSON.stringify(scene, null, 2)}

Персонажи: ${JSON.stringify(characters, null, 2)}

Добавь:
1. Детальное описание визуальных эффектов
2. Расширенные диалоги с эмоциями и действиями
3. Описание работы камеры
4. Музыкальное сопровождение
5. Звуковые эффекты
6. Эмоциональные биты

Верни JSON той же структуры с расширенным содержимым.`;

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Ты профессиональный режиссёр анимации. Отвечай только JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 2000
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error('[expandScene] AI error:', error);
    }
  }
  
  return scene;
}

// Генерация диалогов
async function generateDialogue(input: any, context: any) {
  const { characters, scene, mood, style } = input;
  const baseUrl = process.env.Z_AI_BASE_URL;
  const apiKey = process.env.Z_AI_API_KEY;
  
  if (baseUrl && apiKey) {
    try {
      const prompt = `Создай диалог для сцены анимационного фильма.

Персонажи: ${JSON.stringify(characters, null, 2)}
Сцена: ${JSON.stringify(scene, null, 2)}
Настроение: ${mood}
Стиль: ${style}

Верни JSON:
{
  "dialogue": [
    {
      "character": "имя",
      "line": "реплика",
      "emotion": "эмоция",
      "action": "действие при говорении",
      "volume": "тихо/нормально/громко",
      "pace": "медленно/нормально/быстро"
    }
  ]
}`;

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Ты профессиональный диалогист. Отвечай только JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.9,
          max_tokens: 1500
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error('[generateDialogue] AI error:', error);
    }
  }
  
  return { dialogue: [] };
}

// Генератор сцены
async function generateScene(input: any, context: any) {
  const { location, action, mood, style } = input;
  
  return {
    location: location || 'Волшебный лес',
    description: `Сцена в ${location}`,
    mood: mood || 'приключенческий',
    cameraAngle: 'средний план',
    lighting: 'мягкий свет',
    duration: 15,
    visualEffects: 'лёгкие магические частицы',
    soundEffects: ['звуки природы'],
    music: 'лёгкая фоновая музыка'
  };
}

// Генератор сториборда
async function generateStoryboard(input: any, context: any) {
  const { scenes, style } = input;
  
  const numFrames = (scenes?.length || 3) * 3;
  const frames = [];
  
  for (let i = 0; i < numFrames; i++) {
    const sceneIndex = Math.floor(i / 3);
    const frameInScene = i % 3;
    const cameraAngles = ['общий план', 'средний план', 'крупный план'];
    const shotTypes = ['установочный кадр', 'действие', 'реакция'];
    
    frames.push({
      id: i + 1,
      sceneNumber: sceneIndex + 1,
      frameNumber: frameInScene + 1,
      description: scenes?.[sceneIndex]?.description || `Кадр ${i + 1}`,
      cameraAngle: cameraAngles[frameInScene],
      shotType: shotTypes[frameInScene],
      duration: 3 + Math.floor(Math.random() * 4),
      action: scenes?.[sceneIndex]?.action || 'Действие персонажа',
      dialogue: scenes?.[sceneIndex]?.dialogue?.[frameInScene] || null,
      notes: 'Примечания для аниматора'
    });
  }
  
  return {
    style: style || 'ghibli',
    totalFrames: numFrames,
    estimatedDuration: frames.reduce((sum, f) => sum + f.duration, 0),
    frames
  };
}
