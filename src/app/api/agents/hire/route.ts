import { NextRequest, NextResponse } from 'next/server';

// GET /api/agents/hire - получить информацию о типах агентов
export async function GET() {
  try {
    const agentTypes = [
      {
        id: 'writer',
        name: 'Сценарист',
        icon: '📝',
        description: 'Создаёт сюжеты, диалоги и сценарии',
        skills: ['сюжет', 'диалоги', 'персонажи', 'драматургия'],
        baseCost: 10
      },
      {
        id: 'artist',
        name: 'Художник',
        icon: '🎨',
        description: 'Создаёт визуальный стиль, персонажей и фоны',
        skills: ['рисование', 'композиция', 'цвет', 'стилизация'],
        baseCost: 15
      },
      {
        id: 'animator',
        name: 'Аниматор',
        icon: '🎬',
        description: 'Оживляет персонажей и сцены',
        skills: ['движение', 'тайминг', 'эффекты', 'сцены'],
        baseCost: 20
      },
      {
        id: 'voice',
        name: 'Озвучка',
        icon: '🎤',
        description: 'Озвучивает персонажей и закадровый текст',
        skills: ['голос', 'эмоции', 'персонажи', 'интонация'],
        baseCost: 12
      },
      {
        id: 'editor',
        name: 'Монтажёр',
        icon: '✂️',
        description: 'Собирает финальный ролик, работает со звуком',
        skills: ['монтаж', 'звук', 'эффекты', 'сборка'],
        baseCost: 15
      },
      {
        id: 'blender',
        name: 'Blender 3D',
        icon: '🧊',
        description: 'Создаёт 3D модели, сцены и рендеры',
        skills: ['моделирование', 'текстуры', 'освещение', 'рендер'],
        baseCost: 25
      }
    ];

    return NextResponse.json({
      success: true,
      agentTypes
    });
  } catch (error) {
    console.error('Error fetching agent types:', error);
    return NextResponse.json({
      success: false,
      error: 'Ошибка при получении типов агентов'
    }, { status: 500 });
  }
}

// POST /api/agents/hire - нанять нового агента
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      role,
      description,
      skills,
      specializations,
      salary,
      avatarEmoji
    } = body;

    // Создаём нанятого агента
    const agent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      role,
      description: description || `Специалист по ${role}`,
      avatarEmoji: avatarEmoji || getAvatarForRole(role),
      skills: skills || [],
      specializations: specializations || [],
      salary: salary || 15,
      status: 'idle',
      mood: 80 + Math.floor(Math.random() * 20),
      energy: 90 + Math.floor(Math.random() * 10),
      level: 1,
      quality: 50 + Math.floor(Math.random() * 30),
      speed: 50 + Math.floor(Math.random() * 30),
      hiredAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: `✅ ${name} нанят в команду!`,
      agent
    });
  } catch (error) {
    console.error('Error hiring agent:', error);
    return NextResponse.json({
      success: false,
      error: 'Ошибка при найме агента'
    }, { status: 500 });
  }
}

function getAvatarForRole(role: string): string {
  const avatars: Record<string, string> = {
    writer: '📝',
    artist: '🎨',
    animator: '🎬',
    voice: '🎤',
    editor: '✂️',
    blender: '🧊'
  };
  return avatars[role] || '🤖';
}
