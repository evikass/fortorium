import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * Продюсер - координирует весь процесс создания мультфильма
 * Анализирует идею, создаёт план, распределяет задачи
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, idea, style, genre, duration } = body;

    const baseUrl = process.env.Z_AI_BASE_URL;
    const apiKey = process.env.Z_AI_API_KEY;

    const producerPrompt = `Ты — опытный продюсер анимационной студии ФОРТОРИУМ.
Твоя задача: проанализировать идею мультфильма и создать детальный план производства.

НАЗВАНИЕ: "${title}"
ИДЕЯ: "${idea}"
СТИЛЬ: ${style}
ЖАНР: ${genre}
ДЛИТЕЛЬНОСТЬ: ${duration} секунд

Создай план производства в формате JSON:
{
  "analysis": {
    "targetAudience": "целевая аудитория",
    "keyThemes": ["тема1", "тема2"],
    "tone": "тональность",
    "complexity": "простая/средняя/сложная"
  },
  "productionPlan": {
    "phases": [
      {
        "name": "Разработка сценария",
        "agent": "writer",
        "estimatedTime": "5 минут",
        "tasks": ["создать персонажей", "написать диалоги", "разработать сцены"]
      },
      {
        "name": "Раскадровка",
        "agent": "artist", 
        "estimatedTime": "10 минут",
        "tasks": ["концепт-арты", "иллюстрации сцен"]
      },
      {
        "name": "Анимация",
        "agent": "animator",
        "estimatedTime": "15 минут", 
        "tasks": ["оживление персонажей", "движение камеры"]
      },
      {
        "name": "Озвучка",
        "agent": "voice",
        "estimatedTime": "5 минут",
        "tasks": ["голоса персонажей", "музыка", "звуковые эффекты"]
      },
      {
        "name": "Монтаж",
        "agent": "editor",
        "estimatedTime": "5 минут",
        "tasks": ["сборка", "субтитры", "экспорт"]
      }
    ],
    "totalEstimatedTime": "40 минут"
  },
  "recommendations": [
    "рекомендация 1 для улучшения",
    "рекомендация 2"
  ],
  "sceneBreakdown": [
    {"scene": 1, "duration": 15, "description": "сцена 1"},
    {"scene": 2, "duration": 20, "description": "сцена 2"}
  ]
}`;

    // Если есть API - используем AI
    if (baseUrl && apiKey) {
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Ты профессиональный продюсер анимационной студии. Отвечай только валидным JSON.' },
              { role: 'user', content: producerPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const plan = JSON.parse(jsonMatch[0]);
            return NextResponse.json({
              success: true,
              agent: 'producer',
              action: 'create_plan',
              plan,
              message: 'План производства создан'
            });
          }
        }
      } catch (error) {
        console.error('[Producer] API error:', error);
      }
    }

    // Fallback - умный план на основе анализа
    const sceneCount = Math.max(3, Math.floor((duration || 90) / 20));
    const scenes = [];
    const sceneDuration = Math.floor((duration || 90) / sceneCount);

    const locations = ['Начало пути', 'Место встречи', 'Испытание', 'Кульминация', 'Финал'];
    for (let i = 0; i < sceneCount; i++) {
      scenes.push({
        scene: i + 1,
        duration: sceneDuration,
        description: `Сцена ${i + 1}: ${locations[i % locations.length]}`,
        keyAction: idea.substring(0, 50)
      });
    }

    return NextResponse.json({
      success: true,
      agent: 'producer',
      action: 'create_plan',
      plan: {
        analysis: {
          targetAudience: 'семейный просмотр',
          keyThemes: genre === 'приключения' ? ['дружба', 'смелость'] : ['любовь', 'семья'],
          tone: style === 'ghibli' ? 'сказочный' : 'динамичный',
          complexity: duration > 120 ? 'средняя' : 'простая'
        },
        productionPlan: {
          phases: [
            { name: 'Разработка сценария', agent: 'writer', estimatedTime: '5 мин', tasks: ['создать персонажей', 'написать диалоги'] },
            { name: 'Раскадровка', agent: 'artist', estimatedTime: '10 мин', tasks: ['иллюстрации сцен'] },
            { name: 'Анимация', agent: 'animator', estimatedTime: '15 мин', tasks: ['оживление персонажей'] },
            { name: 'Озвучка', agent: 'voice', estimatedTime: '5 мин', tasks: ['голоса', 'музыка'] },
            { name: 'Монтаж', agent: 'editor', estimatedTime: '5 мин', tasks: ['сборка', 'экспорт'] }
          ],
          totalEstimatedTime: '40 мин'
        },
        recommendations: [
          `Добавить больше деталей в "${title}"`,
          'Усилить эмоциональные моменты'
        ],
        sceneBreakdown: scenes
      },
      message: 'План производства создан (fallback)'
    });

  } catch (error) {
    console.error('[Producer] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'producer',
    name: 'Продюсер',
    capabilities: [
      'Анализ идеи проекта',
      'Создание плана производства',
      'Распределение задач между агентами',
      'Оценка времени и ресурсов'
    ],
    status: 'ready'
  });
}
