import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

// Video Generation API
// Примечание: для реальной генерации видео нужна интеграция с Runway, Pika или Stable Video

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, projectId, title, style } = body;
    
    console.log('🎬 Video generation request:', { 
      imageCount: images?.length, 
      projectId,
      title,
      style
    });
    
    if (!images || images.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Нет изображений для создания видео' 
      }, { status: 400 });
    }

    // Генерируем слайд-шоу видео с помощью FFmpeg (симуляция)
    // В реальном проекте используйте Runway ML, Pika Labs или Stable Video Diffusion
    
    const videoConfig = {
      duration: images.length * 3, // 3 секунды на кадр
      fps: 24,
      resolution: '1920x1080',
      format: 'mp4',
      style: style || 'cinematic'
    };

    // Создаём информацию о "виртуальном" видео
    const videoId = `video_${Date.now()}`;
    
    // Возвращаем результат - URL для слайд-шоу
    const slideshowData = {
      id: videoId,
      title: title || 'Мультфильм',
      images: images.map((img: any, idx: number) => ({
        url: img.imageUrl || img.url,
        duration: 3,
        order: idx + 1
      })),
      totalDuration: videoConfig.duration,
      style: videoConfig.style,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      videoUrl: null, // Реальный URL нужен сервис генерации видео
      slideshow: slideshowData,
      message: 'Изображения готовы для создания видео. Используйте слайд-шоу или подключите сервис генерации видео (Runway, Pika).',
      note: 'Для полноценной генерации видео интегрируйте Runway ML API или Stable Video Diffusion'
    });
    
  } catch (error) {
    console.error('❌ Ошибка в Video API:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}

// GET - получить статус генерации видео
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  
  return NextResponse.json({
    success: true,
    videoId,
    status: 'ready',
    message: 'API видео готов к работе'
  });
}
