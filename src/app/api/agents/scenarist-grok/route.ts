import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

export const maxDuration = 90; // даём больше времени на хороший сценарий

// Выбираем модель — рекомендую для сценариста
const model = xai('grok-4-1-fast');
// Альтернативы:
// xai('grok-4-1-fast-reasoning')   ← если хочешь чуть лучше качество
// xai('grok-4.20-0309-reasoning')  ← самая новая и мощная (дороже)

export async function POST(req: NextRequest) {
  try {
    const { idea, genre, style, duration, title } = await req.json();

    if (!idea) {
      return new Response(JSON.stringify({ error: 'Missing idea parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `Ты — главный сценарист анимационной студии Fortorium. 
Твоя специализация — писать качественные, эмоциональные и кинематографичные сценарии для коротких анимационных роликов.

╔══════════════════════════════════════════════════════════════════════════════╗
║  ГЛАВНОЕ ПРАВИЛО: ВСЁ СОДЕРЖИМОЕ ДОЛЖНО БЫТЬ СВЯЗАНО С ИДЕЕЙ ПОЛЬЗОВАТЕЛЯ  ║
╚══════════════════════════════════════════════════════════════════════════════╝

Ты всегда выдаёшь сценарий строго в JSON формате:

{
  "title": "Название из идеи",
  "logline": "1-2 предложения — яркая суть истории",
  "synopsis": "Краткое описание сюжета в 2-3 предложениях",
  "style": "выбранный стиль",
  "genre": "выбранный жанр",
  "totalDuration": длительность,
  "themes": ["тема1", "тема2"],
  "mood": "общее настроение",
  "visualStyle": {
    "colorPalette": ["цвет1", "цвет2"],
    "lighting": "описание освещения",
    "atmosphere": "атмосфера"
  },
  "characters": [
    {
      "name": "ИМЯ СВЯЗАННОЕ С ИДЕЕЙ",
      "role": "protagonist/antagonist/supporting",
      "description": "описание личности связанное с идеей",
      "appearance": "внешность подходит к идее",
      "personality": ["черта1", "черта2"],
      "motivation": "мотивация из идеи",
      "arc": "как персонаж развивается",
      "emoji": "подходящий эмодзи"
    }
  ],
  "acts": [
    {"act": 1, "name": "Завязка", "description": "...", "duration": 20}
  ],
  "scenes": [
    {
      "number": 1,
      "act": 1,
      "title": "название сцены",
      "location": "локация из идеи",
      "timeOfDay": "утро/день/вечер/ночь",
      "description": "подробное описание",
      "action": "что происходит",
      "mood": "настроение сцены",
      "cameraWork": "описание работы камеры",
      "lighting": "освещение",
      "music": "музыкальное сопровождение",
      "soundEffects": ["звук1", "звук2"],
      "duration": 15,
      "visualEffects": "визуальные эффекты",
      "emotionalBeat": "эмоциональный момент",
      "characters": ["персонаж1"],
      "dialogue": [
        {"character": "имя", "line": "реплика", "emotion": "эмоция", "action": "действие"}
      ]
    }
  ],
  "conflicts": {
    "main": "главный конфликт из идеи",
    "internal": "внутренний конфликт",
    "external": "внешний конфликт"
  },
  "resolution": "как разрешается конфликт",
  "moral": "мораль истории"
}

═══════════════════════════════════════════════════════════════════════════════
ПЕРСОНАЖИ — ДОЛЖНЫ БЫТЬ СОЗДАНЫ НА ОСНОВЕ ИДЕИ:

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
ПРАВИЛА ДЛЯ СЦЕН:
- Учитывай выбранный стиль анимации (Ghibli — поэзия и атмосфера, Pixar — характер и юмор, Anime — динамика и эмоции)
- История должна иметь чёткую арку даже при короткой длительности
- Диалоги должны звучать естественно, в характере персонажей
- Добавляй полезные подсказки для художника и аниматора
- Сумма длительности сцен должна примерно равняться выбранной длительности
- Каждая сцена должна продвигать историю вперёд

Отвечай ТОЛЬКО валидным JSON без markdown-форматирования.`;

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Создай сценарий анимации по следующим параметрам:

🎬 Название: ${title || 'Без названия'}
💡 Идея: ${idea}
📚 Жанр: ${genre || 'приключения'}
🎨 Стиль анимации: ${style || 'ghibli'}
⏱️ Длительность: ${duration || 90} секунд`
        }
      ],
      temperature: 0.78,
      maxTokens: 4000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[Grok Scenarist] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET для проверки статуса
export async function GET() {
  return new Response(JSON.stringify({
    status: 'ready',
    agent: 'scenarist-grok',
    model: 'grok-4-1-fast',
    description: 'AI-сценарист на базе Grok (xAI) для генерации сценариев анимации'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
