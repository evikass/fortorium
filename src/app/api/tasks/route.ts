import { NextRequest, NextResponse } from 'next/server';

// In-memory хранилище задач
declare global {
  var fortoriumTasks: Map<string, any>;
}

if (!globalThis.fortoriumTasks) {
  globalThis.fortoriumTasks = new Map();
}

const tasksStorage = globalThis.fortoriumTasks;

// GET /api/tasks - получить задачи
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    let tasks = Array.from(tasksStorage.values());
    
    if (projectId) {
      tasks = tasks.filter(t => t.projectId === projectId);
    }
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }

    return NextResponse.json({ 
      success: true, 
      tasks: tasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при получении задач' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - создать и выполнить задачу
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, agentRole, type, input, autoExecute = true } = body;

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task = {
      id: taskId,
      projectId,
      agentId: agentRole,
      agentRole,
      type,
      title: getTaskTitle(type),
      input,
      status: autoExecute ? 'in_progress' : 'pending',
      createdAt: new Date().toISOString()
    };

    tasksStorage.set(taskId, task);

    // Если нужно выполнить сразу
    if (autoExecute) {
      const result = await executeAgentTask(agentRole, type, input);
      
      const updatedTask = {
        ...task,
        status: result.success ? 'completed' : 'error',
        output: result.data,
        error: result.error,
        completedAt: new Date().toISOString()
      };
      
      tasksStorage.set(taskId, updatedTask);

      return NextResponse.json({
        success: result.success,
        task: updatedTask,
        artifacts: result.artifacts
      });
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при создании задачи' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks - выполнить отложенную задачу
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId } = body;

    const task = tasksStorage.get(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Задача не найдена' },
        { status: 404 }
      );
    }

    if (task.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Задача уже ${task.status}` },
        { status: 400 }
      );
    }

    // Обновляем статус
    task.status = 'in_progress';
    task.startedAt = new Date().toISOString();
    tasksStorage.set(taskId, task);

    // Выполняем
    const result = await executeAgentTask(task.agentRole, task.type, task.input || {});

    // Обновляем результат
    const updatedTask = {
      ...task,
      status: result.success ? 'completed' : 'error',
      output: result.data,
      error: result.error,
      completedAt: new Date().toISOString()
    };
    tasksStorage.set(taskId, updatedTask);

    return NextResponse.json({
      success: result.success,
      task: updatedTask
    });
  } catch (error) {
    console.error('Error executing task:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при выполнении задачи' },
      { status: 500 }
    );
  }
}

async function executeAgentTask(
  agentRole: string, 
  type: string, 
  input: Record<string, unknown>
) {
  try {
    // Симуляция работы агента
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const result: any = {
      success: true,
      data: {},
      artifacts: []
    };

    switch (type) {
      case 'plan_project':
        result.data = {
          plan: 'План проекта создан',
          phases: ['Сценарий', 'Раскадровка', 'Анимация', 'Монтаж'],
          estimatedDuration: '2-4 недели'
        };
        break;

      case 'write_scenario':
        result.data = {
          scenario: `Сценарий "${input.title || 'Новый проект'}"`,
          scenes: [
            { number: 1, title: 'Введение', duration: 10 },
            { number: 2, title: 'Развитие', duration: 15 },
            { number: 3, title: 'Кульминация', duration: 10 },
            { number: 4, title: 'Финал', duration: 5 }
          ]
        };
        break;

      case 'create_storyboard':
        result.data = {
          frames: 12,
          totalDuration: 40,
          description: 'Раскадровка создана'
        };
        break;

      case 'generate_character':
        result.data = {
          name: input.name || 'Персонаж',
          description: 'Персонаж создан',
          style: input.style || 'ghibli'
        };
        break;

      case 'generate_scene':
        result.data = {
          scene: input.description || 'Сцена',
          duration: 5
        };
        break;

      default:
        result.data = { message: 'Задача выполнена', type };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: String(error),
      data: null,
      artifacts: []
    };
  }
}

function getTaskTitle(type: string): string {
  const titles: Record<string, string> = {
    plan_project: 'Планирование проекта',
    create_tasks: 'Создание задач',
    write_scenario: 'Написание сценария',
    write_dialogue: 'Написание диалогов',
    generate_character: 'Генерация персонажа',
    generate_scene: 'Генерация сцены',
    create_storyboard: 'Создание раскадровки',
    generate_background: 'Генерация фона',
    generate_voice: 'Генерация голоса',
    create_edit_plan: 'План монтажа',
    generate_ffmpeg: 'Генерация FFmpeg команды',
    create_scene: 'Создание 3D сцены',
    render_scene: 'Рендер сцены'
  };
  return titles[type] || type;
}
