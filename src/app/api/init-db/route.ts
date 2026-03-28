import { NextRequest, NextResponse } from 'next/server';

// API для проверки статуса и синхронизации
declare global {
  var fortoriumInitialized: boolean;
}

// GET /api/init-db - проверить инициализацию
export async function GET() {
  try {
    // Инициализируем глобальное хранилище
    if (!globalThis.fortoriumInitialized) {
      globalThis.fortoriumInitialized = true;
    }
    
    return NextResponse.json({
      success: true,
      status: 'ready',
      message: 'Система готова к работе',
      version: '3.3.0'
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

// POST /api/init-db - сброс/очистка данных
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'reset') {
      // Очищаем все хранилища
      if (globalThis.fortoriumStorage) {
        globalThis.fortoriumStorage.hiredAgents.clear();
        globalThis.fortoriumStorage.candidates.clear();
        globalThis.fortoriumStorage.projects.clear();
      }
      if (globalThis.fortoriumProjects) {
        globalThis.fortoriumProjects.clear();
      }
      if (globalThis.fortoriumTasks) {
        globalThis.fortoriumTasks.clear();
      }
      
      return NextResponse.json({
        success: true,
        message: 'Все данные очищены'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Действие выполнено'
    });
  } catch (error) {
    console.error('Init POST error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
