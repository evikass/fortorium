// v3.10.6 - More free image sources
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const debug: string[] = [`START-${Date.now()}`];
  
  try {
    const body = await request.json();
    const { prompt, style = 'ghibli', width = 1024, height = 1024 } = body;
    
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'No prompt', debug }, { status: 400 });
    }
    
    const styles: Record<string, string> = {
      ghibli: 'Studio Ghibli style, Miyazaki, watercolor, magical anime',
      disney: 'Disney 2D animation, colorful, expressive',
      pixar: 'Pixar 3D animation, cinematic lighting',
      anime: 'Japanese anime style, vibrant, stylized'
    };
    const stylePrompt = styles[style] || styles.ghibli;
    const fullPrompt = `${stylePrompt}, ${prompt}, masterpiece`;
    
    debug.push(`style:${style}`);
    
    const baseUrl = process.env.Z_AI_BASE_URL;
    const apiKey = process.env.Z_AI_API_KEY;
    const stabilityKey = process.env.STABILITY_API_KEY;
    
    // 1. Zukijourney
    if (baseUrl && apiKey) {
      debug.push('try:zukijourney');
      try {
        const res = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ prompt: fullPrompt, size: `${width}x${height}` })
        });
        debug.push(`zukijourney:${res.status}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data?.[0]?.base64) {
            debug.push('SUCCESS:zukijourney');
            return NextResponse.json({ success: true, imageUrl: `data:image/png;base64,${data.data[0].base64}`, gen: 'zukijourney', debug });
          }
          if (data.data?.[0]?.url) {
            const imgRes = await fetch(data.data[0].url);
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              debug.push('SUCCESS:zukijourney-proxy');
              return NextResponse.json({ success: true, imageUrl: `data:image/png;base64,${buf.toString('base64')}`, gen: 'zukijourney-proxy', debug });
            }
          }
        }
      } catch (e: any) { debug.push(`zukijourney-err:${e.message?.substring(0,15)}`); }
    }
    
    // 2. Stability AI
    if (stabilityKey) {
      debug.push('try:stability');
      try {
        const res = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stabilityKey}`, 'Accept': 'application/json' },
          body: JSON.stringify({ text_prompts: [{ text: fullPrompt, weight: 1 }], cfg_scale: 7, height: 1024, width: 1024, steps: 20, samples: 1 })
        });
        debug.push(`stability:${res.status}`);
        if (res.ok) {
          const data = await res.json();
          if (data.artifacts?.[0]?.base64) {
            debug.push('SUCCESS:stability');
            return NextResponse.json({ success: true, imageUrl: `data:image/png;base64,${data.artifacts[0].base64}`, gen: 'stability', debug });
          }
        }
      } catch (e: any) { debug.push(`stability-err:${e.message?.substring(0,15)}`); }
    }
    
    // 3. Picsum Photos - FREE, no auth, always works
    debug.push('try:picsum');
    try {
      const seed = Math.floor(Math.random() * 1000);
      const picsumUrl = `https://picsum.photos/seed/${seed}/1024/1024`;
      const imgRes = await fetch(picsumUrl);
      debug.push(`picsum:${imgRes.status}`);
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        debug.push(`picsum-size:${buf.length}`);
        if (buf.length > 5000) {
          debug.push('SUCCESS:picsum');
          return NextResponse.json({ success: true, imageUrl: `data:image/jpeg;base64,${buf.toString('base64')}`, gen: 'picsum', debug });
        }
      }
    } catch (e: any) { debug.push(`picsum-err:${e.message?.substring(0,15)}`); }
    
    // 4. Lorem Flickr - FREE photos by keyword
    debug.push('try:flickr');
    try {
      const keywords = ['nature', 'space', 'cat', 'forest', 'mountain', 'city', 'ocean'];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const flickrUrl = `https://loremflickr.com/1024/1024/${keyword}`;
      const imgRes = await fetch(flickrUrl);
      debug.push(`flickr:${imgRes.status}`);
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length > 5000) {
          debug.push('SUCCESS:flickr');
          return NextResponse.json({ success: true, imageUrl: `data:image/jpeg;base64,${buf.toString('base64')}`, gen: 'flickr', debug });
        }
      }
    } catch (e: any) { debug.push(`flickr-err:${e.message?.substring(0,15)}`); }
    
    // 5. Placeholder with nicer design
    debug.push('try:placeholder');
    try {
      const colors = ['3B82F6', '8B5CF6', 'EC4899', 'F59E0B', '10B981'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const placeholderUrl = `https://placehold.co/1024x1024/${color}/white?text=${style.toUpperCase()}+Scene`;
      const imgRes = await fetch(placeholderUrl);
      debug.push(`placeholder:${imgRes.status}`);
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length > 1000) {
          debug.push('SUCCESS:placeholder');
          return NextResponse.json({ success: true, imageUrl: `data:image/svg+xml;base64,${buf.toString('base64')}`, gen: 'placeholder', debug });
        }
      }
    } catch (e: any) { debug.push(`placeholder-err:${e.message?.substring(0,15)}`); }
    
    // SVG Fallback
    debug.push('fallback:svg');
    const seed = Math.floor(Math.random() * 99999);
    const colors: Record<string, string> = { ghibli: '#8ecae6', disney: '#ffb703', pixar: '#219ebc', anime: '#fb8500' };
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors[style] || '#8ecae6'}"/>
        <stop offset="100%" stop-color="#1a1a2e"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="${width/2}" cy="${height/3}" r="80" fill="rgba(255,255,255,0.1)"/>
      <text x="50%" y="50%" text-anchor="middle" font-size="48" font-weight="bold" fill="white">${style.toUpperCase()}</text>
      <text x="50%" y="62%" text-anchor="middle" font-size="20" fill="rgba(255,255,255,0.8)">Scene ${seed}</text>
    </svg>`;
    
    return NextResponse.json({ success: true, imageUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, gen: 'svg', debug });
    
  } catch (e: any) {
    debug.push(`FATAL:${e.message?.substring(0,15)}`);
    return NextResponse.json({ success: false, error: e.message, debug }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ v: '3.10.6' });
}
