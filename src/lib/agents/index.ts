// Экспорт всех агентов
export { BaseAgent } from './base';
export type { AgentConfig, TaskInput, TaskOutput, AgentRole } from './base';

export { ProducerAgent, PRODUCER_CONFIG } from './producer-agent';
export { WriterAgent, WRITER_CONFIG } from './writer-agent';
export { ArtistAgent, ARTIST_CONFIG } from './artist-agent';
export { BlenderAgent, BLENDER_CONFIG } from './blender-agent';

// Импорт и экспорт остальных агентов
import { BaseAgent, AgentConfig, TaskInput, TaskOutput, AgentRole } from './base';
import { ProducerAgent } from './producer-agent';
import { WriterAgent } from './writer-agent';
import { ArtistAgent } from './artist-agent';
import { BlenderAgent } from './blender-agent';
import ZAI from 'z-ai-web-dev-sdk';

// Агент-озвучка
export const VOICE_CONFIG: AgentConfig = {
  id: 'voice',
  name: 'Озвучка',
  role: 'voice',
  description: 'Генерирует голоса персонажей, музыку и звуковые эффекты',
  systemPrompt: `Ты специалист по звуковому оформлению анимации. Создаёшь голоса, музыку и эффекты.`
};

export class VoiceAgent extends BaseAgent {
  constructor() {
    super(VOICE_CONFIG);
  }

  async execute(input: TaskInput): Promise<TaskOutput> {
    switch (input.type) {
      case 'generate_voice':
        return this.generateVoice(input.data);
      case 'create_music':
        return this.createMusicPrompt(input.data);
      default:
        return { success: false, error: `Неизвестный тип задачи: ${input.type}` };
    }
  }

  private async generateVoice(data: Record<string, unknown>): Promise<TaskOutput> {
    const { text, character, emotion } = data;
    
    try {
      // Создаём эмоциональный текст для озвучки
      const voiceText = `${emotion ? `[${emotion}] ` : ''}${text}`;
      
      const audioBase64 = await this.generateSpeech(voiceText);
      
      if (audioBase64) {
        return {
          success: true,
          data: { audioBase64 }
        };
      }
      
      return { success: false, error: 'Не удалось сгенерировать голос' };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async createMusicPrompt(data: Record<string, unknown>): Promise<TaskOutput> {
    const { scene, mood, duration, genre } = data;
    
    const prompt = `Создай описание музыки для сцены:
Сцена: ${scene}
Настроение: ${mood}
Длительность: ${duration} секунд
Жанр: ${genre || 'оркестровая'}

Опиши инструменты, темп и динамику.`;

    try {
      const description = await this.chat(prompt);
      return {
        success: true,
        data: { musicDescription: description }
      };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }
}

// Агент-монтажёр
export const EDITOR_CONFIG: AgentConfig = {
  id: 'editor',
  name: 'Монтажёр',
  role: 'editor',
  description: 'Собирает финальный ролик, накладывает звук и эффекты',
  systemPrompt: `Ты видеоредактор анимационной студии. Собираешь ролики, добавляешь переходы и эффекты.`
};

export class EditorAgent extends BaseAgent {
  constructor() {
    super(EDITOR_CONFIG);
  }

  async execute(input: TaskInput): Promise<TaskOutput> {
    switch (input.type) {
      case 'create_edit_plan':
        return this.createEditPlan(input.data);
      case 'generate_ffmpeg':
        return this.generateFFmpegCommand(input.data);
      default:
        return { success: false, error: `Неизвестный тип задачи: ${input.type}` };
    }
  }

  private async createEditPlan(data: Record<string, unknown>): Promise<TaskOutput> {
    const { scenes, totalDuration, style } = data;

    const prompt = `Создай план монтажа для анимационного ролика:

Сцены: ${JSON.stringify(scenes)}
Общая длительность: ${totalDuration} секунд
Стиль: ${style}

Создай JSON план монтажа:
{
  "cuts": [
    {
      "scene": 1,
      "start": 0,
      "end": 5,
      "transition": "fade/dissolve/cut",
      "effects": ["эффекты"]
    }
  ],
  "audio": {
    "music": "описание",
    "soundEffects": ["эффекты"]
  },
  "export": {
    "resolution": "1920x1080",
    "fps": 24,
    "format": "mp4"
  }
}`;

    try {
      const response = await this.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        return { success: true, data: { plan } };
      }

      return { success: false, error: 'Не удалось создать план монтажа' };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async generateFFmpegCommand(data: Record<string, unknown>): Promise<TaskOutput> {
    const { editPlan, inputFiles, outputFile } = data;

    const prompt = `Создай команду FFmpeg для монтажа видео:

План монтажа: ${JSON.stringify(editPlan)}
Входные файлы: ${JSON.stringify(inputFiles)}
Выходной файл: ${outputFile}

Создай полную команду FFmpeg для:
1. Объединения видеоклипов
2. Добавления аудиодорожки
3. Добавления переходов
4. Экспорта в указанном формате

Верни команду в формате shell.`;

    try {
      const command = await this.chat(prompt);
      return {
        success: true,
        data: { command },
        artifacts: [{
          type: 'text',
          content: command,
          name: 'render.sh'
        }]
      };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }
}

// Фабрика агентов
export function createAgent(role: AgentRole): BaseAgent {
  switch (role) {
    case 'producer':
      return new ProducerAgent();
    case 'writer':
      return new WriterAgent();
    case 'artist':
      return new ArtistAgent();
    case 'voice':
      return new VoiceAgent();
    case 'editor':
      return new EditorAgent();
    case 'blender':
      return new BlenderAgent();
    default:
      throw new Error(`Unknown agent role: ${role}`);
  }
}
