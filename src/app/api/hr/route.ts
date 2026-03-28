import { NextRequest, NextResponse } from 'next/server';

// HR API - управление HR отделом

export async function GET() {
  return NextResponse.json({
    success: true,
    hr: {
      name: 'HR Менеджер',
      status: 'searching',
      specialization: 'Все отделы',
      activeVacancies: 6,
      candidatesInProgress: 3
    },
    vacancies: [
      { role: 'writer', title: 'Сценарист', status: 'open', priority: 1 },
      { role: 'artist', title: 'Художник', status: 'open', priority: 2 },
      { role: 'animator', title: 'Аниматор', status: 'open', priority: 3 },
      { role: 'voice', title: 'Озвучка', status: 'open', priority: 4 },
      { role: 'editor', title: 'Монтажёр', status: 'open', priority: 5 },
      { role: 'blender', title: 'Blender 3D', status: 'open', priority: 6 }
    ]
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, role, requirements } = body;

    switch (action) {
      case 'create_vacancy':
        return NextResponse.json({
          success: true,
          vacancy: {
            id: `vacancy_${Date.now()}`,
            role,
            requirements,
            status: 'open',
            createdAt: new Date().toISOString()
          },
          message: `Вакансия "${role}" создана`
        });

      case 'search_candidates':
        // Возвращает кандидатов через /api/candidates
        return NextResponse.json({
          success: true,
          message: 'Поиск кандидатов запущен',
          redirect: '/api/candidates'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Неизвестное действие'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('HR API error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
