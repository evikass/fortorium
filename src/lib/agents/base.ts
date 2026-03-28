// Базовый класс агента анимационной студии
import ZAI from 'z-ai-web-dev-sdk';

export type AgentRole = 'producer' | 'writer' | 'artist' | 'animator' | 'voice' | 'editor' | 'blender' | 'critic';

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  systemPrompt: string;
}

export interface TaskInput {
  type: string;
  data: Record<string, unknown>;
}

export interface TaskOutput {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  artifacts?: Array<{
    type: 'image' | 'video' | 'audio' | 'text' | 'file';
    url?: string;
    content?: string;
    name: string;
  }>;
}

export abstract class BaseAgent {
  protected zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  public config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
  }

  abstract execute(input: TaskInput): Promise<TaskOutput>;

  protected async chat(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.zai) {
      await this.initialize();
    }

    const response = await this.zai!.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt || this.config.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096
    });

    return response.choices[0]?.message?.content || '';
  }

  protected async generateImage(prompt: string, size: '1024x1024' | '768x1344' | '1344x768' = '1024x1024'): Promise<string | null> {
    if (!this.zai) {
      await this.initialize();
    }

    try {
      const response = await this.zai!.images.generations.create({
        prompt,
        size
      });

      return response.data[0]?.base64 || null;
    } catch (error) {
      console.error('Image generation error:', error);
      return null;
    }
  }

  protected async generateSpeech(text: string): Promise<string | null> {
    if (!this.zai) {
      await this.initialize();
    }

    try {
      const response = await this.zai!.audio.speech.create({
        input: text,
        voice: 'alloy'
      });

      return response.data || null;
    } catch (error) {
      console.error('Speech generation error:', error);
      return null;
    }
  }

  protected log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    console.log(`[${this.config.role.toUpperCase()}] ${level.toUpperCase()}: ${message}`);
  }
}
