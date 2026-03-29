// Агент-продюсер - координатор всех задач
import { BaseAgent, AgentConfig, TaskInput, TaskOutput } from './base';

export const PRODUCER_CONFIG: AgentConfig = {
  id: 'producer',
  name: 'Продюсер',
  role: 'producer',
  description: 'Координирует весь процесс создания мультфильма, распределяет задачи между агентами',
  systemPrompt: `Ты опытный продюсер анимационной студии. Твоя задача - координировать создание мультфильмов.

Ты работаешь с командой агентов:
- Сценарист: пишет сценарий и диалоги
- Художник: создаёт раскадровку и концепт-арты
- Аниматор: оживляет статичные кадры
- Озвучка: генерирует голоса и музыку
- Монтажёр: собирает финальный ролик
- Blender: создаёт 3D сцены и рендеры

При получении идеи проекта:
1. Разбей проект на конкретные сцены
2. Определи задачи для каждого агента
3. Установи приоритеты и зависимости между задачами
4. Следи за качеством результатов

Отвечай в структурированном формате JSON.`
};

export class ProducerAgent extends BaseAgent {
  constructor() {
    super(PRODUCER_CONFIG);
  }

  async execute(input: TaskInput): Promise<TaskOutput> {
    this.log(`Начинаю работу над задачей: ${input.type}`);

    switch (input.type) {
      case 'plan_project':
        return this.planProject(input.data);
      case 'create_tasks':
        return this.createTasks(input.data);
      case 'review_result':
        return this.reviewResult(input.data);
      case 'coordinate_pipeline':
        return this.coordinatePipeline(input.data);
      default:
        return { success: false, error: `Неизвестный тип задачи: ${input.type}` };
    }
  }

  private async planProject(data: Record<string, unknown>): Promise<TaskOutput> {
    const { title, description, style, duration } = data;

    const prompt = `Создай детальный план анимационного проекта:
    
Название: ${title}
Описание: ${description}
Стиль: ${style || 'Произвольный'}
Длительность: ${duration || 30} секунд

Создай JSON план в формате:
{
  "scenes": [
    {
      "order": 1,
      "title": "Название сцены",
      "description": "Описание действия",
      "duration": 5,
      "characters": ["персонажи в сцене"],
      "location": "локация",
      "dialogue": [
        {"character": "Имя", "line": "Реплика"}
      ],
      "visual_style": "описание визуального стиля",
      "camera_movement": "движение камеры"
    }
  ],
  "visual_style": {
    "color_palette": ["цвета"],
    "lighting": "тип освещения",
    "art_style": "художественный стиль"
  },
  "audio": {
    "background_music": "описание музыки",
    "sound_effects": ["звуковые эффекты"]
  }
}`;

    try {
      const response = await this.chat(prompt);
      
      // Пытаемся извлечь JSON из ответа
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: { plan }
        };
      }

      return {
        success: false,
        error: 'Не удалось распарсить план проекта'
      };
    } catch (error) {
      return {
        success: false,
        error: `Ошибка при планировании: ${error}`
      };
    }
  }

  private async createTasks(data: Record<string, unknown>): Promise<TaskOutput> {
    const { plan, projectId } = data;

    const prompt = `На основе плана проекта создай список задач для каждого агента:

План проекта:
${JSON.stringify(plan, null, 2)}

Создай JSON массив задач в формате:
[
  {
    "agent": "writer|artist|animator|voice|editor|blender",
    "type": "тип задачи",
    "title": "Название задачи",
    "description": "Детальное описание",
    "input": { входные данные },
    "priority": 1-10,
    "dependencies": ["id зависимых задач"]
  }
]`;

    try {
      const response = await this.chat(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: { tasks, projectId }
        };
      }

      return {
        success: false,
        error: 'Не удалось распарсить задачи'
      };
    } catch (error) {
      return {
        success: false,
        error: `Ошибка при создании задач: ${error}`
      };
    }
  }

  private async reviewResult(data: Record<string, unknown>): Promise<TaskOutput> {
    const { task, result, expectations } = data;

    const prompt = `Оцени результат выполнения задачи:

Задача: ${JSON.stringify(task)}
Результат: ${JSON.stringify(result)}
Ожидания: ${expectations}

Оцени качество от 1 до 10 и дай рекомендации.
Ответ в формате JSON:
{
  "score": 7,
  "approved": true/false,
  "feedback": "Обратная связь",
  "improvements": ["рекомендации по улучшению"]
}`;

    try {
      const response = await this.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const review = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: { review }
        };
      }

      return {
        success: false,
        error: 'Не удалось распарсить оценку'
      };
    } catch (error) {
      return {
        success: false,
        error: `Ошибка при оценке: ${error}`
      };
    }
  }

  private async coordinatePipeline(data: Record<string, unknown>): Promise<TaskOutput> {
    const { projectStatus, completedTasks, pendingTasks } = data;

    const prompt = `Координируй пайплайн проекта:

Статус проекта: ${JSON.stringify(projectStatus)}
Выполненные задачи: ${JSON.stringify(completedTasks)}
Ожидающие задачи: ${JSON.stringify(pendingTasks)}

Определи следующие шаги и их порядок.
Ответ в формате JSON:
{
  "next_steps": [
    {
      "task_id": "id",
      "can_start": true/false,
      "reason": "причина"
    }
  ],
  "blockers": ["проблемы"],
  "recommendations": ["рекомендации"]
}`;

    try {
      const response = await this.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const coordination = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: { coordination }
        };
      }

      return {
        success: false,
        error: 'Не удалось распарсить координацию'
      };
    } catch (error) {
      return {
        success: false,
        error: `Ошибка при координации: ${error}`
      };
    }
  }
}
