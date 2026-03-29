import { NextRequest, NextResponse } from 'next/server';

// Blender API - управление 3D сценами

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'ready',
    message: 'Blender API готов к работе',
    features: ['create_scene', 'render', 'animate']
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sceneData } = body;

    switch (action) {
      case 'create_scene':
        return NextResponse.json({
          success: true,
          scene: {
            id: `scene_${Date.now()}`,
            ...sceneData,
            status: 'created',
            createdAt: new Date().toISOString()
          },
          message: '3D сцена создана'
        });

      case 'render':
        return NextResponse.json({
          success: true,
          renderId: `render_${Date.now()}`,
          status: 'queued',
          estimatedTime: '30-60 секунд',
          message: 'Рендер добавлен в очередь'
        });

      case 'animate':
        return NextResponse.json({
          success: true,
          animationId: `anim_${Date.now()}`,
          duration: sceneData?.duration || 5,
          fps: 24,
          message: 'Анимация настроена'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Неизвестное действие'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Blender API error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
