import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * Художник - создаёт раскадровки и иллюстрации
 * Генерирует изображения для каждой сцены
 */

const STYLE_PROMPTS: Record<string, string> = {
  ghibli: 'Studio Ghibli Miyazaki style watercolor magical anime, soft pastel colors, detailed backgrounds',
  disney: 'Disney 2D animation vibrant colorful classic, expressive characters, theatrical poses',
  pixar: 'Pixar 3D animation cinematic lighting detailed, photorealistic textures, volumetric lighting',
  anime: 'Japanese anime style vibrant stylized dynamic, contrast lines, stylized proportions'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, input } = body;

    switch (action) {
      case 'generate_storyboard':
        return await generateStoryboard(input);
      case 'generate_scene_image':
        return await generateSceneImage(input);
      case 'generate_character_design':
        return await generateCharacterDesign(input);
      case 'generate_background':
        return await generateBackground(input);
      default:
        return NextResponse.json({
          success: false,
          error: 'Неизвестное действие'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Artist] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

async function generateStoryboard(input: any) {
  const { scenes, style, title } = input;
  
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.ghibli;
  const baseUrl = process.env.Z_AI_BASE_URL;
  const apiKey = process.env.Z_AI_API_KEY;
  const storyboard = [];

  for (const scene of scenes || []) {
    const imagePrompt = `${stylePrompt}, ${scene.location}, ${scene.action}, ${scene.mood || 'cinematic'}, masterpiece, high quality`;
    
    let imageUrl = null;
    let gen = 'fallback';

    // Пробуем API для генерации
    if (baseUrl && apiKey) {
      try {
        const res = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${apiKey}` 
          },
          body: JSON.stringify({ 
            prompt: imagePrompt, 
            size: '1024x576' 
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.data?.[0]?.base64) {
            imageUrl = `data:image/png;base64,${data.data[0].base64}`;
            gen = 'zukijourney';
          } else if (data.data?.[0]?.url) {
            const imgRes = await fetch(data.data[0].url);
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              imageUrl = `data:image/png;base64,${buf.toString('base64')}`;
              gen = 'zukijourney-proxy';
            }
          }
        }
      } catch (e) {
        console.error('[Artist] Image gen error:', e);
      }
    }

    // Fallback - Picsum
    if (!imageUrl) {
      const seed = Math.floor(Math.random() * 10000);
      try {
        const imgRes = await fetch(`https://picsum.photos/seed/${seed}/1024/576`);
        if (imgRes.ok) {
          const buf = Buffer.from(await imgRes.arrayBuffer());
          imageUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
          gen = 'picsum';
        }
      } catch (e) {
        console.error('[Artist] Picsum error:', e);
      }
    }

    storyboard.push({
      sceneNumber: scene.number,
      title: scene.title,
      imagePrompt,
      imageUrl,
      generatedBy: gen,
      status: imageUrl ? 'ready' : 'failed'
    });

    // Небольшая пауза между запросами
    if (scenes.indexOf(scene) < scenes.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return NextResponse.json({
    success: true,
    agent: 'artist',
    action: 'generate_storyboard',
    storyboard,
    totalFrames: storyboard.length,
    readyFrames: storyboard.filter(f => f.status === 'ready').length,
    message: `Раскадровка создана: ${storyboard.filter(f => f.status === 'ready').length}/${storyboard.length} кадров`
  });
}

async function generateSceneImage(input: any) {
  const { scene, style, characters } = input;
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.ghibli;
  
  const baseUrl = process.env.Z_AI_BASE_URL;
  const apiKey = process.env.Z_AI_API_KEY;

  // Создаём детальный промпт
  const characterDesc = characters?.map((c: any) => c.description).join(', ') || '';
  const imagePrompt = `${stylePrompt}, ${scene.location}, ${scene.action}, ${scene.mood || 'cinematic'}, ${characterDesc}, masterpiece, detailed`;

  let imageUrl = null;
  let gen = 'fallback';

  if (baseUrl && apiKey) {
    try {
      const res = await fetch(`${baseUrl}/images/generations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${apiKey}` 
        },
        body: JSON.stringify({ 
          prompt: imagePrompt, 
          size: '1024x576' 
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.[0]?.base64) {
          imageUrl = `data:image/png;base64,${data.data[0].base64}`;
          gen = 'zukijourney';
        }
      }
    } catch (e) {
      console.error('[Artist] Scene image error:', e);
    }
  }

  if (!imageUrl) {
    const seed = Math.floor(Math.random() * 10000);
    try {
      const imgRes = await fetch(`https://picsum.photos/seed/${seed}/1024/576`);
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        imageUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
        gen = 'picsum';
      }
    } catch (e) {
      console.error('[Artist] Fallback error:', e);
    }
  }

  return NextResponse.json({
    success: true,
    agent: 'artist',
    action: 'generate_scene_image',
    scene: scene.number,
    imagePrompt,
    imageUrl,
    generatedBy: gen,
    message: `Изображение для сцены ${scene.number} создано`
  });
}

async function generateCharacterDesign(input: any) {
  const { character, style } = input;
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.ghibli;
  
  const baseUrl = process.env.Z_AI_BASE_URL;
  const apiKey = process.env.Z_AI_API_KEY;

  const imagePrompt = `${stylePrompt}, character design, ${character.name}, ${character.appearance || character.description}, full body, character sheet, white background`;

  let imageUrl = null;

  if (baseUrl && apiKey) {
    try {
      const res = await fetch(`${baseUrl}/images/generations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${apiKey}` 
        },
        body: JSON.stringify({ 
          prompt: imagePrompt, 
          size: '1024x1024' 
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.[0]?.base64) {
          imageUrl = `data:image/png;base64,${data.data[0].base64}`;
        }
      }
    } catch (e) {
      console.error('[Artist] Character design error:', e);
    }
  }

  return NextResponse.json({
    success: true,
    agent: 'artist',
    action: 'generate_character_design',
    character: character.name,
    imagePrompt,
    imageUrl,
    message: `Дизайн персонажа ${character.name} создан`
  });
}

async function generateBackground(input: any) {
  const { location, style, timeOfDay, mood } = input;
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.ghibli;
  
  const baseUrl = process.env.Z_AI_BASE_URL;
  const apiKey = process.env.Z_AI_API_KEY;

  const imagePrompt = `${stylePrompt}, background art, ${location}, ${timeOfDay || 'day'}, ${mood || 'atmospheric'}, no characters, detailed environment, wide shot`;

  let imageUrl = null;

  if (baseUrl && apiKey) {
    try {
      const res = await fetch(`${baseUrl}/images/generations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${apiKey}` 
        },
        body: JSON.stringify({ 
          prompt: imagePrompt, 
          size: '1344x768' 
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.[0]?.base64) {
          imageUrl = `data:image/png;base64,${data.data[0].base64}`;
        }
      }
    } catch (e) {
      console.error('[Artist] Background error:', e);
    }
  }

  return NextResponse.json({
    success: true,
    agent: 'artist',
    action: 'generate_background',
    location,
    imagePrompt,
    imageUrl,
    message: `Фон для ${location} создан`
  });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'artist',
    name: 'Художник',
    capabilities: [
      'Генерация раскадровок',
      'Создание иллюстраций сцен',
      'Дизайн персонажей',
      'Создание фонов',
      'Концепт-арты'
    ],
    status: 'ready',
    styleSupport: Object.keys(STYLE_PROMPTS)
  });
}
