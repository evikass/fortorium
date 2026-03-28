import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

// API для генерации изображений через AI
export async function POST(request: NextRequest) {
  console.log('🎨 AI Image Generation API');
  
  try {
    const body = await request.json();
    const { prompt, style = 'disney' } = body;
    
    // Получаем конфигурацию из переменных окружения
    const baseUrl = process.env.Z_AI_BASE_URL;
    const apiKey = process.env.Z_AI_API_KEY;
    
    if (!baseUrl || !apiKey) {
      console.error('❌ Missing Z_AI_BASE_URL or Z_AI_API_KEY');
      return NextResponse.json({
        success: false,
        error: 'AI configuration not set. Please add Z_AI_BASE_URL and Z_AI_API_KEY to Vercel environment variables.'
      }, { status: 500 });
    }
    
    const stylePrompts: Record<string, string> = {
      ghibli: 'Studio Ghibli style, Miyazaki, watercolor, magical, soft colors, anime',
      disney: 'Disney 2D animation style, classic animation, vibrant colors',
      pixar: 'Pixar 3D style, modern 3D animation, cinematic lighting',
      anime: 'Anime style, Japanese animation, bright colors, stylized',
      cartoon: 'Modern cartoon style, bright and colorful, playful'
    };
    
    const stylePrompt = stylePrompts[style] || stylePrompts.disney;
    const fullPrompt = `${stylePrompt}, ${prompt}, high quality, detailed illustration`;
    
    console.log('🖼️ Prompt:', fullPrompt.substring(0, 80) + '...');
    console.log('🔗 API URL:', baseUrl);
    
    // Делаем запрос к AI API
    const startTime = Date.now();
    
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        size: '1024x1024',
        n: 1
      })
    });
    
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `API error: ${response.status}`,
        details: errorText.substring(0, 200)
      }, { status: 500 });
    }
    
    const data = await response.json();
    console.log(`✅ Response received in ${elapsed}ms`);
    
    if (data.data?.[0]?.base64) {
      const base64 = data.data[0].base64;
      console.log('📊 Base64 length:', base64.length);
      
      return NextResponse.json({
        success: true,
        imageUrl: `data:image/png;base64,${base64}`,
        prompt: fullPrompt,
        generationTime: elapsed
      });
    } else if (data.data?.[0]?.url) {
      // Если возвращается URL вместо base64
      console.log('📊 Image URL:', data.data[0].url);
      return NextResponse.json({
        success: true,
        imageUrl: data.data[0].url,
        prompt: fullPrompt,
        generationTime: elapsed
      });
    } else {
      console.error('❌ No image in response:', JSON.stringify(data).substring(0, 200));
      return NextResponse.json({
        success: false,
        error: 'No image in response',
        response: data
      });
    }
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || String(error)
    }, { status: 500 });
  }
}
