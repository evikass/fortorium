// Агент Blender - интеграция с домашним компьютером
import { BaseAgent, AgentConfig, TaskInput, TaskOutput } from './base';

export const BLENDER_CONFIG: AgentConfig = {
  id: 'blender',
  name: 'Blender Оператор',
  role: 'blender',
  description: 'Управляет Blender на домашнем компьютере для создания 3D сцен и рендеров',
  systemPrompt: `Ты специалист по Blender и 3D анимации. Твоя задача - создавать Python скрипты для Blender.

Твои навыки:
- Создание 3D сцен и объектов
- Настройка освещения и материалов
- Создание анимаций камер
- Настройка рендера (Cycles, Eevee)
- Создание персонажей и окружения

При создании скриптов для Blender:
1. Используй только Python API Blender (bpy)
2. Создавай оптимизированные сцены
3. Настраивай рендер для качественного результата
4. Добавляй комментарии на русском языке

Всегда возвращай работоспособный Python код.`
};

export interface BlenderConnection {
  host: string;
  port: number;
  apiKey?: string;
}

export class BlenderAgent extends BaseAgent {
  private connection: BlenderConnection | null = null;

  constructor() {
    super(BLENDER_CONFIG);
  }

  setConnection(connection: BlenderConnection): void {
    this.connection = connection;
  }

  async execute(input: TaskInput): Promise<TaskOutput> {
    this.log(`Начинаю работу над задачей: ${input.type}`);

    switch (input.type) {
      case 'create_scene':
        return this.createScene(input.data);
      case 'setup_lighting':
        return this.setupLighting(input.data);
      case 'create_camera_path':
        return this.createCameraPath(input.data);
      case 'setup_materials':
        return this.setupMaterials(input.data);
      case 'render_scene':
        return this.renderScene(input.data);
      case 'create_character_3d':
        return this.createCharacter3D(input.data);
      default:
        return { success: false, error: `Неизвестный тип задачи: ${input.type}` };
    }
  }

  private async createScene(data: Record<string, unknown>): Promise<TaskOutput> {
    const { sceneName, objects, environment } = data;

    const prompt = `Создай Python скрипт для Blender который:
    
1. Создаёт новую сцену с именем "${sceneName}"
2. Добавляет следующие объекты: ${JSON.stringify(objects)}
3. Настраивает окружение: ${JSON.stringify(environment)}

Требования:
- Используй bpy модуль
- Добавь освещение (три-поинт)
- Настрой камеру
- Оптимизируй для рендера

Верни только Python код без объяснений.`;

    try {
      const script = await this.chat(prompt);
      
      // Извлекаем код из ответа
      const codeMatch = script.match(/```python\n?([\s\S]*?)```/) || 
                        script.match(/```\n?([\s\S]*?)```/);
      
      const pythonScript = codeMatch ? codeMatch[1] : script;

      return {
        success: true,
        data: {
          sceneName,
          script: pythonScript,
          connection: this.connection
        },
        artifacts: [{
          type: 'text',
          content: pythonScript,
          name: `scene_${sceneName}.py`
        }]
      };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async setupLighting(data: Record<string, unknown>): Promise<TaskOutput> {
    const { lightType, intensity, color, position, mood } = data;

    const prompt = `Создай Python скрипт для Blender для настройки освещения:

Тип: ${lightType || 'studio'}
Интенсивность: ${intensity || 1000}
Цвет: ${color || 'white'}
Позиция: ${JSON.stringify(position)}
Настроение: ${mood || 'neutral'}

Создай профессиональную схему освещения для анимации.
Верни только Python код.`;

    try {
      const script = await this.chat(prompt);
      const codeMatch = script.match(/```python\n?([\s\S]*?)```/) || 
                        script.match(/```\n?([\s\S]*?)```/);
      
      const pythonScript = codeMatch ? codeMatch[1] : script;

      return {
        success: true,
        data: { script: pythonScript },
        artifacts: [{
          type: 'text',
          content: pythonScript,
          name: 'lighting_setup.py'
        }]
      };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async createCameraPath(data: Record<string, unknown>): Promise<TaskOutput> {
    const { startFrame, endFrame, pathType, keyframes } = data;

    const prompt = `Создай Python скрипт для Blender для анимации камеры:

Начальный кадр: ${startFrame || 1}
Конечный кадр: ${endFrame || 250}
Тип пути: ${pathType || 'bezier'}
Ключевые кадры: ${JSON.stringify(keyframes)}

Создай плавную анимацию камеры через кривую.
Верни только Python код.`;

    try {
      const script = await this.chat(prompt);
      const codeMatch = script.match(/```python\n?([\s\S]*?)```/) || 
                        script.match(/```\n?([\s\S]*?)```/);
      
      const pythonScript = codeMatch ? codeMatch[1] : script;

      return {
        success: true,
        data: { script: pythonScript },
        artifacts: [{
          type: 'text',
          content: pythonScript,
          name: 'camera_animation.py'
        }]
      };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async setupMaterials(data: Record<string, unknown>): Promise<TaskOutput> {
    const { materials, style } = data;

    const prompt = `Создай Python скрипт для Blender для создания материалов:

Материалы: ${JSON.stringify(materials)}
Стиль: ${style || 'stylized'}

Создай материалы в стиле ${style} для анимации.
Используй Principled BSDF для реалистичных материалов.
Верни только Python код.`;

    try {
      const script = await this.chat(prompt);
      const codeMatch = script.match(/```python\n?([\s\S]*?)```/) || 
                        script.match(/```\n?([\s\S]*?)```/);
      
      const pythonScript = codeMatch ? codeMatch[1] : script;

      return {
        success: true,
        data: { script: pythonScript },
        artifacts: [{
          type: 'text',
          content: pythonScript,
          name: 'materials.py'
        }]
      };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async renderScene(data: Record<string, unknown>): Promise<TaskOutput> {
    const { resolution, frameStart, frameEnd, engine, outputPath, samples } = data;

    const prompt = `Создай Python скрипт для Blender для настройки и запуска рендера:

Разрешение: ${resolution || '1920x1080'}
Кадры: ${frameStart || 1} - ${frameEnd || 250}
Движок: ${engine || 'CYCLES'}
Выход: ${outputPath || '//render/'}
Сэмплы: ${samples || 128}

Настрой качественный рендер для анимации.
Верни только Python код.`;

    try {
      const script = await this.chat(prompt);
      const codeMatch = script.match(/```python\n?([\s\S]*?)```/) || 
                        script.match(/```\n?([\s\S]*?)```/);
      
      const pythonScript = codeMatch ? codeMatch[1] : script;

      return {
        success: true,
        data: {
          script: pythonScript,
          renderSettings: {
            resolution,
            frameStart,
            frameEnd,
            engine,
            samples
          }
        },
        artifacts: [{
          type: 'text',
          content: pythonScript,
          name: 'render_settings.py'
        }]
      };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async createCharacter3D(data: Record<string, unknown>): Promise<TaskOutput> {
    const { name, description, style, rigged } = data;

    const prompt = `Создай Python скрипт для Blender для создания базовой 3D модели персонажа:

Имя: ${name}
Описание: ${description}
Стиль: ${style || 'stylized'}
Риг: ${rigged ? 'да' : 'нет'}

Создай персонажа из примитивов с пропорциями для анимации.
${rigged ? 'Добавь базовый арматур для анимации.' : ''}
Верни только Python код.`;

    try {
      const script = await this.chat(prompt);
      const codeMatch = script.match(/```python\n?([\s\S]*?)```/) || 
                        script.match(/```\n?([\s\S]*?)```/);
      
      const pythonScript = codeMatch ? codeMatch[1] : script;

      return {
        success: true,
        data: { script: pythonScript },
        artifacts: [{
          type: 'text',
          content: pythonScript,
          name: `character_${name}.py`
        }]
      };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  // Отправка скрипта на домашний компьютер
  async sendToBlenderHost(script: string, action: string): Promise<TaskOutput> {
    if (!this.connection) {
      return {
        success: false,
        error: 'Нет подключения к Blender. Настройте соединение с домашним компьютером.'
      };
    }

    try {
      const response = await fetch(`http://${this.connection.host}:${this.connection.port}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.connection.apiKey && { 'Authorization': `Bearer ${this.connection.apiKey}` })
        },
        body: JSON.stringify({
          script,
          action,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Ошибка подключения: ${response.status}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: `Не удалось подключиться к Blender: ${error}. Проверьте, что сервер запущен на домашнем компьютере.`
      };
    }
  }
}
