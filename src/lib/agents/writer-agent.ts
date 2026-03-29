// Агент-сценарист
import { BaseAgent, AgentConfig, TaskInput, TaskOutput } from './base';

export const WRITER_CONFIG: AgentConfig = {
  id: 'writer',
  name: 'Сценарист',
  role: 'writer',
  description: 'Пишет сценарии, диалоги и описания сцен для мультфильмов',
  systemPrompt: `Ты талантливый сценарист анимационных фильмов. Твоя задача - создавать увлекательные истории для мультфильмов.

Твои навыки:
- Создание оригинальных сюжетов
- Написание диалогов с характерами персонажей
- Описание сцен и действий
- Работа с различными жанрами (комедия, приключения, фэнтези)
- Адаптация историй под указанную длительность

При создании сценария:
1. Определи основную идею и эмоциональный посыл
2. Создай структуру истории (завязка, развитие, кульминация, развязка)
3. Пропиши диалоги с учётом характера персонажей
4. Добавь визуальные описания для художников

Отвечай в структурированном формате JSON.`
};

export class WriterAgent extends BaseAgent {
  constructor() {
    super(WRITER_CONFIG);
  }

  async execute(input: TaskInput): Promise<TaskOutput> {
    this.log(`Начинаю работу над задачей: ${input.type}`);

    switch (input.type) {
      case 'write_scenario':
        return this.writeScenario(input.data);
      case 'write_dialogue':
        return this.writeDialogue(input.data);
      case 'expand_scene':
        return this.expandScene(input.data);
      case 'adapt_style':
        return this.adaptStyle(input.data);
      default:
        return { success: false, error: `Неизвестный тип задачи: ${input.type}` };
    }
  }

  private async writeScenario(data: Record<string, unknown>): Promise<TaskOutput> {
    const { title, description, style, duration, characters } = data;

    const prompt = `Создай полный сценарий для анимационного ролика:

Название: ${title}
Идея: ${description}
Стиль: ${style || 'Произвольный'}
Длительность: ${duration || 30} секунд
Персонажи: ${JSON.stringify(characters || [])}

Создай детальный сценарий в формате JSON:
{
  "title": "Название",
  "logline": "Краткое описание в одном предложении",
  "theme": "Основная тема",
  "characters": [
    {
      "name": "Имя",
      "description": "Описание персонажа",
      "personality": "Характер",
      "appearance": "Внешность"
    }
  ],
  "scenes": [
    {
      "scene_number": 1,
      "title": "Название сцены",
      "location": "Локация",
      "time_of_day": "Время суток",
      "description": "Описание действия",
      "duration": 5,
      "dialogue": [
        {
          "character": "Имя персонажа",
          "emotion": "эмоция",
          "line": "Реплика"
        }
      ],
      "action": "Описание действий персонажей",
      "visual_notes": "Заметки для художника",
      "sound_notes": "Заметки для звука"
    }
  ],
  "visual_style_guide": {
    "color_mood": "Настроение цветов",
    "lighting": "Освещение",
    "camera_style": "Стиль съёмки"
  }
}`;

    try {
      const response = await this.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const scenario = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: { scenario },
          artifacts: [{
            type: 'text',
            content: JSON.stringify(scenario, null, 2),
            name: 'scenario.json'
          }]
        };
      }

      return {
        success: false,
        error: 'Не удалось создать сценарий'
      };
    } catch (error) {
      return {
        success: false,
        error: `Ошибка при написании сценария: ${error}`
      };
    }
  }

  private async writeDialogue(data: Record<string, unknown>): Promise<TaskOutput> {
    const { scene, characters, context } = data;

    const prompt = `Напиши диалог для сцены:

Сцена: ${JSON.stringify(scene)}
Персонажи: ${JSON.stringify(characters)}
Контекст: ${context}

Создай диалог в формате JSON:
{
  "dialogue": [
    {
      "character": "Имя",
      "emotion": "радость/грусть/удивление/злость",
      "line": "Реплика",
      "action": "Действие во время реплики",
      "duration_estimate": 2
    }
  ],
  "total_duration": 10,
  "emotional_arc": "Эмоциональное развитие сцены"
}`;

    try {
      const response = await this.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const dialogue = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: { dialogue }
        };
      }

      return { success: false, error: 'Не удалось создать диалог' };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async expandScene(data: Record<string, unknown>): Promise<TaskOutput> {
    const { scene, expandType } = data;

    const prompt = `Расширь описание сцены:

Исходная сцена: ${JSON.stringify(scene)}
Тип расширения: ${expandType || 'full'}

Добавь больше деталей о:
- Движениях персонажей
- Фоновых элементах
- Переходах между кадрами
- Звуковом оформлении

Формат ответа: JSON с расширенным описанием сцены`;

    try {
      const response = await this.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const expandedScene = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: { expandedScene }
        };
      }

      return { success: false, error: 'Не удалось расширить сцену' };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async adaptStyle(data: Record<string, unknown>): Promise<TaskOutput> {
    const { scenario, targetStyle } = data;

    const prompt = `Адаптируй сценарий под стиль ${targetStyle}:

Исходный сценарий: ${JSON.stringify(scenario)}

Адаптируй:
- Тон повествования
- Сложность диалогов
- Визуальные описания
- Темп развития сюжета

Формат ответа: JSON с адаптированным сценарием`;

    try {
      const response = await this.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const adaptedScenario = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: { adaptedScenario }
        };
      }

      return { success: false, error: 'Не удалось адаптировать стиль' };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }
}
