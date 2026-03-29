// Агент-художник - создание изображений и раскадровок
import { BaseAgent, AgentConfig, TaskInput, TaskOutput } from './base';
import fs from 'fs/promises';
import path from 'path';

export const ARTIST_CONFIG: AgentConfig = {
  id: 'artist',
  name: 'Художник',
  role: 'artist',
  description: 'Создаёт концепт-арты, персонажей, раскадровки и фоны',
  systemPrompt: `Ты талантливый художник-аниматор. Твоя задача - создавать визуальные материалы для мультфильмов.

Твои навыки:
- Создание концепт-артов персонажей
- Рисование раскадровок (storyboard)
- Дизайн фонов и окружения
- Работа в различных стилях (Ghibli, Disney, Pixar, 2D, 3D)
- Создание референсов для анимации

При создании изображений:
1. Определи визуальный стиль
2. Создай детальные промпты для генерации
3. Убедись в согласованности стиля между кадрами
4. Опиши композицию и освещение

Для каждого изображения создавай детальный промпт на английском.`
};

export class ArtistAgent extends BaseAgent {
  constructor() {
    super(ARTIST_CONFIG);
  }

  async execute(input: TaskInput): Promise<TaskOutput> {
    this.log(`Начинаю работу над задачей: ${input.type}`);

    switch (input.type) {
      case 'generate_character':
        return this.generateCharacter(input.data);
      case 'generate_scene':
        return this.generateScene(input.data);
      case 'create_storyboard':
        return this.createStoryboard(input.data);
      case 'generate_background':
        return this.generateBackground(input.data);
      case 'create_style_guide':
        return this.createStyleGuide(input.data);
      default:
        return { success: false, error: `Неизвестный тип задачи: ${input.type}` };
    }
  }

  private buildPrompt(baseDescription: string, style: string, extra?: string): string {
    const styleMap: Record<string, string> = {
      'ghibli': 'Studio Ghibli style, hand-drawn animation, Hayao Miyazaki, watercolor backgrounds, soft colors, whimsical atmosphere',
      'disney': 'Disney animation style, 2D traditional animation, expressive characters, vibrant colors, magical atmosphere',
      'pixar': 'Pixar 3D animation style, modern CGI, detailed textures, cinematic lighting, emotional storytelling',
      'anime': 'anime style, vibrant colors, detailed backgrounds, expressive eyes, dynamic poses',
      'cartoon': 'modern cartoon style, bold outlines, flat colors, exaggerated expressions, fun and playful',
      'realistic': 'realistic digital painting, detailed textures, natural lighting, cinematic composition'
    };

    const stylePrompt = styleMap[style.toLowerCase()] || style;
    return `${baseDescription}, ${stylePrompt}, ${extra || ''}, high quality, detailed, professional animation artwork`;
  }

  private async generateCharacter(data: Record<string, unknown>): Promise<TaskOutput> {
    const { name, description, style, personality, role } = data;

    const prompt = this.buildPrompt(
      `Character design of ${name}, ${description}, ${personality ? `personality: ${personality}` : ''}`,
      String(style || 'disney'),
      'character sheet, full body, multiple angles, expressive pose'
    );

    try {
      const imageBase64 = await this.generateImage(prompt, '1024x1024');
      
      if (imageBase64) {
        // Сохраняем изображение
        const fileName = `character_${Date.now()}.png`;
        const filePath = path.join('/home/z/my-project/download', fileName);
        const buffer = Buffer.from(imageBase64, 'base64');
        await fs.writeFile(filePath, buffer);

        return {
          success: true,
          data: {
            prompt,
            fileName,
            filePath
          },
          artifacts: [{
            type: 'image',
            url: `/download/${fileName}`,
            name: fileName
          }]
        };
      }

      return { success: false, error: 'Не удалось сгенерировать изображение персонажа' };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async generateScene(data: Record<string, unknown>): Promise<TaskOutput> {
    const { sceneDescription, style, characters, location, mood, cameraAngle } = data;

    const prompt = this.buildPrompt(
      `${sceneDescription}, ${location ? `location: ${location}` : ''}, ${characters ? `characters: ${characters}` : ''}, ${mood ? `mood: ${mood}` : ''}, ${cameraAngle ? `camera: ${cameraAngle}` : 'medium shot'}`,
      String(style || 'disney'),
      'cinematic scene, detailed background, animation frame'
    );

    try {
      const imageBase64 = await this.generateImage(prompt, '1344x768');
      
      if (imageBase64) {
        const fileName = `scene_${Date.now()}.png`;
        const filePath = path.join('/home/z/my-project/download', fileName);
        const buffer = Buffer.from(imageBase64, 'base64');
        await fs.writeFile(filePath, buffer);

        return {
          success: true,
          data: { prompt, fileName, filePath },
          artifacts: [{
            type: 'image',
            url: `/download/${fileName}`,
            name: fileName
          }]
        };
      }

      return { success: false, error: 'Не удалось сгенерировать сцену' };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async createStoryboard(data: Record<string, unknown>): Promise<TaskOutput> {
    const { scenes, style, aspectRatio } = data;
    const scenesArray = scenes as Array<Record<string, unknown>>;

    if (!scenesArray || !Array.isArray(scenesArray)) {
      return { success: false, error: 'Нужен массив сцен для раскадровки' };
    }

    const results = [];

    for (const scene of scenesArray) {
      const prompt = this.buildPrompt(
        `Storyboard frame: ${scene.description || scene.title}`,
        String(style || 'disney'),
        `scene ${scene.order || results.length + 1}, clear composition, animation keyframe`
      );

      try {
        const imageBase64 = await this.generateImage(prompt, '768x1344');
        
        if (imageBase64) {
          const fileName = `storyboard_frame_${Date.now()}_${results.length}.png`;
          const filePath = path.join('/home/z/my-project/download', fileName);
          const buffer = Buffer.from(imageBase64, 'base64');
          await fs.writeFile(filePath, buffer);

          results.push({
            sceneOrder: scene.order || results.length + 1,
            prompt,
            fileName,
            filePath,
            url: `/download/${fileName}`
          });
        }
      } catch (error) {
        console.error(`Error generating frame ${results.length}:`, error);
      }
    }

    return {
      success: true,
      data: {
        totalFrames: results.length,
        frames: results
      },
      artifacts: results.map(r => ({
        type: 'image' as const,
        url: r.url,
        name: r.fileName
      }))
    };
  }

  private async generateBackground(data: Record<string, unknown>): Promise<TaskOutput> {
    const { location, style, timeOfDay, weather, mood } = data;

    const prompt = this.buildPrompt(
      `Background art of ${location}, ${timeOfDay ? `time: ${timeOfDay}` : ''}, ${weather ? `weather: ${weather}` : ''}, ${mood ? `mood: ${mood}` : ''}`,
      String(style || 'ghibli'),
      'detailed background, no characters, landscape, environment design'
    );

    try {
      const imageBase64 = await this.generateImage(prompt, '1344x768');
      
      if (imageBase64) {
        const fileName = `background_${Date.now()}.png`;
        const filePath = path.join('/home/z/my-project/download', fileName);
        const buffer = Buffer.from(imageBase64, 'base64');
        await fs.writeFile(filePath, buffer);

        return {
          success: true,
          data: { prompt, fileName, filePath },
          artifacts: [{
            type: 'image',
            url: `/download/${fileName}`,
            name: fileName
          }]
        };
      }

      return { success: false, error: 'Не удалось сгенерировать фон' };
    } catch (error) {
      return { success: false, error: `Ошибка: ${error}` };
    }
  }

  private async createStyleGuide(data: Record<string, unknown>): Promise<TaskOutput> {
    const { projectName, style, colorPalette, mood } = data;

    const prompts = [
      {
        type: 'color_mood',
        prompt: this.buildPrompt(
          `Color palette and mood board for animation project "${projectName}", ${mood || 'adventure'}`,
          String(style || 'disney'),
          'color swatches, mood reference, artistic style guide'
        )
      },
      {
        type: 'character_style',
        prompt: this.buildPrompt(
          `Character design style reference sheet for animation project "${projectName}"`,
          String(style || 'disney'),
          'multiple character examples, consistent style, design guide'
        )
      },
      {
        type: 'environment_style',
        prompt: this.buildPrompt(
          `Environment and background style reference for animation project "${projectName}"`,
          String(style || 'ghibli'),
          'landscape examples, interior and exterior, atmospheric'
        )
      }
    ];

    const results = [];

    for (const item of prompts) {
      try {
        const imageBase64 = await this.generateImage(item.prompt, '1024x1024');
        
        if (imageBase64) {
          const fileName = `style_guide_${item.type}_${Date.now()}.png`;
          const filePath = path.join('/home/z/my-project/download', fileName);
          const buffer = Buffer.from(imageBase64, 'base64');
          await fs.writeFile(filePath, buffer);

          results.push({
            type: item.type,
            fileName,
            url: `/download/${fileName}`
          });
        }
      } catch (error) {
        console.error(`Error generating ${item.type}:`, error);
      }
    }

    return {
      success: true,
      data: {
        projectName,
        style,
        references: results
      },
      artifacts: results.map(r => ({
        type: 'image' as const,
        url: r.url,
        name: r.fileName
      }))
    };
  }
}
