import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

// TTS API - генерация речи
// Поддерживаемые голоса: narrator, hero, heroine, child, elder, villain, fairy

const VOICE_CONFIGS: Record<string, { pitch: string; speed: number; description: string }> = {
  narrator: { pitch: 'medium', speed: 1.0, description: 'Нейтральный, спокойный голос' },
  hero: { pitch: 'low', speed: 1.0, description: 'Уверенный, мужественный голос' },
  heroine: { pitch: 'high', speed: 1.0, description: 'Мягкий, женственный голос' },
  child: { pitch: 'high', speed: 1.2, description: 'Высокий, живой голос' },
  elder: { pitch: 'low', speed: 0.85, description: 'Мудрый, медленный голос' },
  villain: { pitch: 'low', speed: 0.9, description: 'Тёмный, зловещий голос' },
  fairy: { pitch: 'high', speed: 1.1, description: 'Волшебный, нежный голос' },
  robot: { pitch: 'medium', speed: 1.0, description: 'Синтетический голос' }
};

export async function GET() {
  return NextResponse.json({
    success: true,
    voices: Object.entries(VOICE_CONFIGS).map(([id, config]) => ({
      id,
      ...config
    })),
    message: 'TTS API готов к работе'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = 'narrator', character } = body;

    if (!text) {
      return NextResponse.json({
        success: false,
        error: 'Текст обязателен'
      }, { status: 400 });
    }

    const voiceConfig = VOICE_CONFIGS[voice] || VOICE_CONFIGS.narrator;

    // Для реальной генерации используйте:
    // - ElevenLabs API
    // - Google Cloud TTS
    // - Amazon Polly
    // - OpenAI TTS API

    const audioId = `audio_${Date.now()}`;

    // Возвращаем информацию о "сгенерированном" аудио
    return NextResponse.json({
      success: true,
      audio: {
        id: audioId,
        text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        voice,
        character,
        duration: Math.ceil(text.length / 15), // примерная длительность
        config: voiceConfig,
        format: 'mp3',
        createdAt: new Date().toISOString()
      },
      note: 'Для реальной генерации аудио подключите ElevenLabs или Google Cloud TTS',
      message: `Текст готов к озвучке голосом ${voice}`
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
