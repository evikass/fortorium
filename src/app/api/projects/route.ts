import { NextRequest, NextResponse } from 'next/server';

// In-memory хранилище проектов
declare global {
  var fortoriumProjects: Map<string, any>;
}

if (!globalThis.fortoriumProjects) {
  globalThis.fortoriumProjects = new Map();
}

const projectsStorage = globalThis.fortoriumProjects;

// GET /api/projects - получить все проекты
export async function GET() {
  try {
    const projects = Array.from(projectsStorage.values());
    
    return NextResponse.json({ 
      success: true, 
      projects: projects.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при получении проектов' },
      { status: 500 }
    );
  }
}

// POST /api/projects - создать новый проект
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, style, duration, useBlender } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Укажите название и описание' },
        { status: 400 }
      );
    }

    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const project = {
      id: projectId,
      title,
      description,
      style: style || 'disney',
      duration: duration || 30,
      useBlender: useBlender || false,
      status: 'draft',
      scenes: [],
      assets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projectsStorage.set(projectId, project);

    return NextResponse.json({ 
      success: true, 
      project,
      message: `Проект "${title}" создан`
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при создании проекта: ' + (error instanceof Error ? error.message : 'неизвестная ошибка') },
      { status: 500 }
    );
  }
}

// PUT /api/projects - обновить проект
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, ...updates } = body;

    const existing = projectsStorage.get(projectId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Проект не найден' },
        { status: 404 }
      );
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    projectsStorage.set(projectId, updated);

    return NextResponse.json({ 
      success: true, 
      project: updated 
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при обновлении проекта' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects - удалить проект
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Требуется projectId' },
        { status: 400 }
      );
    }

    const existing = projectsStorage.get(projectId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Проект не найден' },
        { status: 404 }
      );
    }

    projectsStorage.delete(projectId);

    return NextResponse.json({ 
      success: true, 
      message: `Проект "${existing.title}" удалён` 
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при удалении проекта' },
      { status: 500 }
    );
  }
}
