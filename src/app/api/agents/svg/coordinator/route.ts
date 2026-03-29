import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

/**
 * SVG-координатор v4.7.0
 * Качественные SVG с градиентами, тенями, деталями
 */

const SVG_AGENTS = [
  { id: 'palette', name: 'Цветовая палитра', icon: '🎨', order: 1 },
  { id: 'background', name: 'Фон', icon: '🌄', order: 2 },
  { id: 'perspective', name: 'Перспектива', icon: '📐', order: 3 },
  { id: 'composition', name: 'Композиция', icon: '📊', order: 4 },
  { id: 'lighting', name: 'Освещение', icon: '💡', order: 5 },
  { id: 'details', name: 'Детали', icon: '✨', order: 6 },
  { id: 'objects', name: 'Предметы', icon: '🪑', order: 7 },
  { id: 'characters', name: 'Персонажи', icon: '👤', order: 8 },
  { id: 'layout', name: 'Расстановка', icon: '📍', order: 9 },
  { id: 'animation', name: 'Анимация', icon: '🎬', order: 10 },
  { id: 'typography', name: 'Типографика', icon: '🔤', order: 11 }
];

const STYLE_PALETTES: Record<string, any> = {
  ghibli: {
    sky: ['#87CEEB', '#B0E0E6', '#E0F7FA'],
    ground: ['#4CAF50', '#8BC34A', '#C5E1A5'],
    accent: ['#FF7043', '#FFAB91', '#FFE0B2'],
    skin: ['#FFCCBC', '#FFAB91', '#FF8A65'],
    hair: ['#5D4037', '#8D6E63', '#BCAAA4'],
    water: ['#4DD0E1', '#80DEEA', '#B2EBF2'],
    shadow: 'rgba(0,0,0,0.15)'
  },
  disney: {
    sky: ['#1E88E5', '#42A5F5', '#90CAF9'],
    ground: ['#43A047', '#66BB6A', '#A5D6A7'],
    accent: ['#FFC107', '#FFCA28', '#FFD54F'],
    skin: ['#FFCCBC', '#FFAB91', '#FF8A65'],
    hair: ['#4E342E', '#6D4C41', '#8D6E63'],
    water: ['#29B6F6', '#4FC3F7', '#81D4FA'],
    shadow: 'rgba(0,0,0,0.2)'
  },
  pixar: {
    sky: ['#5C6BC0', '#7986CB', '#9FA8DA'],
    ground: ['#26A69A', '#4DB6AC', '#80CBC4'],
    accent: ['#EF5350', '#EF9A9A', '#FFCDD2'],
    skin: ['#FFCCBC', '#FFAB91', '#FF8A65'],
    hair: ['#37474F', '#546E7A', '#78909C'],
    water: ['#29B6F6', '#4FC3F7', '#B3E5FC'],
    shadow: 'rgba(0,0,0,0.25)'
  },
  anime: {
    sky: ['#E91E63', '#F06292', '#F8BBD9'],
    ground: ['#9C27B0', '#BA68C8', '#E1BEE7'],
    accent: ['#FFEB3B', '#FFF176', '#FFF59D'],
    skin: ['#FFE0B2', '#FFCC80', '#FFB74D'],
    hair: ['#311B92', '#512DA8', '#673AB7'],
    water: ['#00BCD4', '#26C6DA', '#80DEEA'],
    shadow: 'rgba(0,0,0,0.18)'
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scene = {},
      style = 'ghibli',
      dimensions = { width: 1024, height: 576 },
      taskDescription = '',
      taskType = 'scene',
      customText = {}
    } = body;
    
    const settings = {
      width: dimensions.width,
      height: dimensions.height,
      location: scene.location || 'волшебный лес',
      timeOfDay: scene.timeOfDay || 'день',
      mood: scene.mood || 'сказочный',
      style,
      taskDescription,
      taskType,
      customText,
      palette: STYLE_PALETTES[style] || STYLE_PALETTES.ghibli
    };
    
    console.log('[SVG-Coordinator v4.7.0] Task:', taskType, 'Style:', style);
    const startTime = Date.now();
    
    // Генерация агентов
    const results: any = {};
    for (const agent of SVG_AGENTS) {
      const agentStart = Date.now();
      try {
        results[agent.id] = {
          success: true,
          svg: generateAgentSVG(agent.id, settings),
          executionTime: Date.now() - agentStart
        };
      } catch (e: any) {
        results[agent.id] = { success: false, error: e.message, executionTime: Date.now() - agentStart };
      }
    }
    
    const agentsTime = Date.now() - startTime;
    
    // Композитор
    const composerStart = Date.now();
    const finalScene = composeFinalScene({ settings, dimensions, taskType, customText });
    const composerTime = Date.now() - composerStart;
    
    const storyboard = {
      frames: SVG_AGENTS.map((a, i) => ({
        id: i + 1,
        agentId: a.id,
        agentName: a.name,
        agentIcon: a.icon,
        svg: results[a.id]?.svg || '',
        success: results[a.id]?.success || false,
        executionTime: results[a.id]?.executionTime || 0
      }))
    };
    
    return NextResponse.json({
      success: true,
      version: '4.7.0',
      taskType,
      taskDescription: taskDescription || null,
      executionTime: agentsTime,
      composerTime,
      totalTime: Date.now() - startTime,
      agents: results,
      storyboard,
      finalScene: { svg: finalScene, success: true },
      message: `Создано ${storyboard.frames.length} кадров + финальная сцена за ${Date.now() - startTime}мс`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function generateAgentSVG(id: string, s: any): string {
  const { width: w, height: h, style, mood, timeOfDay, location, taskType, customText, palette } = s;
  
  const generators: Record<string, () => string> = {
    palette: () => {
      const p = palette;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1a1a2e"/>
            <stop offset="100%" stop-color="#16213e"/>
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3"/><feColorMatrix type="saturate" values="1.5"/></filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGrad)"/>
        
        <!-- Header -->
        <text x="${w/2}" y="45" text-anchor="middle" font-size="26" font-weight="bold" fill="white">🎨 Цветовая палитра</text>
        <text x="${w/2}" y="70" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.5)">Style: ${style.toUpperCase()}</text>
        
        <!-- Sky Colors -->
        <g transform="translate(60, 100)">
          <text y="0" font-size="13" fill="rgba(255,255,255,0.6)" font-weight="500">НЕБО</text>
          ${p.sky.map((c: string, i: number) => `
            <rect x="${i*95}" y="15" width="85" height="85" rx="12" fill="${c}" filter="url(#glow)"/>
            <text x="${i*95+42}" y="115" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">${c}</text>
          `).join('')}
        </g>
        
        <!-- Ground Colors -->
        <g transform="translate(60, 230)">
          <text y="0" font-size="13" fill="rgba(255,255,255,0.6)" font-weight="500">ЗЕМЛЯ</text>
          ${p.ground.map((c: string, i: number) => `
            <rect x="${i*95}" y="15" width="85" height="85" rx="12" fill="${c}" filter="url(#glow)"/>
            <text x="${i*95+42}" y="115" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">${c}</text>
          `).join('')}
        </g>
        
        <!-- Accent Colors -->
        <g transform="translate(60, 360)">
          <text y="0" font-size="13" fill="rgba(255,255,255,0.6)" font-weight="500">АКЦЕНТЫ</text>
          ${p.accent.map((c: string, i: number) => `
            <rect x="${i*95}" y="15" width="85" height="85" rx="12" fill="${c}" filter="url(#glow)"/>
            <text x="${i*95+42}" y="115" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">${c}</text>
          `).join('')}
        </g>
        
        <!-- Watermark -->
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.15)">ФОРТОРИУМ</text>
      </svg>`;
    },
    
    background: () => {
      const timeColors: Record<string, {sky: string[], sun: string, sunY: number}> = {
        'день': { sky: palette.sky, sun: '#FFD700', sunY: 0.12 },
        'ночь': { sky: ['#0D1B2A', '#1B263B', '#415A77'], sun: '#F5F5DC', sunY: 0.15 },
        'вечер': { sky: ['#FF6B35', '#F7931E', '#FFD700'], sun: '#FF4500', sunY: 0.35 },
        'рассвет': { sky: ['#FFB6C1', '#FFC0CB', '#FFE4E1'], sun: '#FFA500', sunY: 0.45 }
      };
      const tc = timeColors[timeOfDay] || timeColors['день'];
      
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${tc.sky[0]}"/>
            <stop offset="50%" stop-color="${tc.sky[1]}"/>
            <stop offset="100%" stop-color="${tc.sky[2]}"/>
          </linearGradient>
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${palette.ground[0]}"/>
            <stop offset="100%" stop-color="${palette.ground[2]}"/>
          </linearGradient>
          <radialGradient id="sunGlow">
            <stop offset="0%" stop-color="${tc.sun}"/>
            <stop offset="100%" stop-color="transparent"/>
          </radialGradient>
          <filter id="sunBlur"><feGaussianBlur stdDeviation="5"/></filter>
        </defs>
        
        <!-- Sky -->
        <rect width="100%" height="${h*0.65}" fill="url(#skyGrad)"/>
        
        <!-- Sun/Moon -->
        <circle cx="${w*0.8}" cy="${h*tc.sunY}" r="60" fill="url(#sunGlow)" opacity="0.5"/>
        <circle cx="${w*0.8}" cy="${h*tc.sunY}" r="35" fill="${tc.sun}"/>
        
        <!-- Clouds -->
        ${timeOfDay !== 'ночь' ? `
          <g opacity="0.8">
            <ellipse cx="${w*0.15}" cy="${h*0.15}" rx="80" ry="30" fill="white" opacity="0.6"/>
            <ellipse cx="${w*0.2}" cy="${h*0.18}" rx="60" ry="25" fill="white" opacity="0.5"/>
            <ellipse cx="${w*0.5}" cy="${h*0.22}" rx="100" ry="35" fill="white" opacity="0.4"/>
            <ellipse cx="${w*0.55}" cy="${h*0.2}" rx="70" ry="25" fill="white" opacity="0.5"/>
          </g>
        ` : `
          <!-- Stars -->
          ${Array.from({length: 30}, (_, i) => {
            const x = Math.random() * w;
            const y = Math.random() * h * 0.5;
            const r = Math.random() * 2 + 1;
            return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${Math.random()*0.5+0.3}"/>`;
          }).join('')}
          <!-- Moon -->
          <circle cx="${w*0.8}" cy="${h*0.15}" r="30" fill="#F5F5DC"/>
          <circle cx="${w*0.82}" cy="${h*0.13}" r="25" fill="${tc.sky[0]}"/>
        `}
        
        <!-- Mountains/Hills -->
        <path d="M0 ${h*0.55} L${w*0.15} ${h*0.35} L${w*0.3} ${h*0.5} L${w*0.45} ${h*0.3} L${w*0.6} ${h*0.45} L${w*0.75} ${h*0.25} L${w*0.9} ${h*0.4} L${w} ${h*0.35} L${w} ${h*0.6} L0 ${h*0.6} Z" fill="${palette.ground[2]}" opacity="0.7"/>
        
        <!-- Ground -->
        <rect y="${h*0.58}" width="100%" height="${h*0.42}" fill="url(#groundGrad)"/>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.3)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">🌄 Фон</text>
        
        <!-- Watermark -->
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`;
    },
    
    perspective: () => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="perspBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1a1a2e"/>
            <stop offset="100%" stop-color="#16213e"/>
          </linearGradient>
          <radialGradient id="vp" cx="50%" cy="30%" r="15%">
            <stop offset="0%" stop-color="#FF6B6B"/>
            <stop offset="100%" stop-color="transparent"/>
          </radialGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#perspBg)"/>
        
        <!-- Perspective Lines -->
        <g opacity="0.6">
          ${Array.from({length: 20}, (_, i) => {
            const angle = (i - 10) * 8;
            return `<line x1="${w/2}" y1="${h*0.3}" x2="${w/2 + Math.tan(angle * Math.PI/180) * h}" y2="${h}" stroke="rgba(100,150,255,0.15)" stroke-width="1"/>`;
          }).join('')}
        </g>
        
        <!-- Horizon Line -->
        <line x1="0" y1="${h*0.3}" x2="${w}" y2="${h*0.3}" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="10,5"/>
        
        <!-- Vanishing Point -->
        <circle cx="${w/2}" cy="${h*0.3}" r="30" fill="url(#vp)"/>
        <circle cx="${w/2}" cy="${h*0.3}" r="8" fill="#FF6B6B"/>
        <text x="${w/2}" y="${h*0.3-45}" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.7)">Точка схода</text>
        
        <!-- Grid floor -->
        <g opacity="0.3">
          ${Array.from({length: 10}, (_, i) => {
            const y = h*0.3 + (h*0.7 * (i+1)/11);
            const scale = (y - h*0.3) / (h*0.7);
            const xOffset = scale * w/2;
            return `<line x1="${w/2 - xOffset}" y1="${y}" x2="${w/2 + xOffset}" y2="${y}" stroke="rgba(100,150,255,0.2)"/>`;
          }).join('')}
        </g>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.3)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">📐 Перспектива</text>
        
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`,
    
    composition: () => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="compBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1a1a2e"/>
            <stop offset="100%" stop-color="#16213e"/>
          </linearGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#compBg)"/>
        
        <!-- Rule of Thirds Grid -->
        <g stroke="rgba(255,255,255,0.2)" stroke-width="1">
          <line x1="${w/3}" y1="60" x2="${w/3}" y2="${h-20}"/>
          <line x1="${w*2/3}" y1="60" x2="${w*2/3}" y2="${h-20}"/>
          <line x1="20" y1="${h/3}" x2="${w-20}" y2="${h/3}"/>
          <line x1="20" y1="${h*2/3}" x2="${w-20}" y2="${h*2/3}"/>
        </g>
        
        <!-- Power Points -->
        ${[
          {x: w/3, y: h/3, label: '1'},
          {x: w*2/3, y: h/3, label: '2'},
          {x: w/3, y: h*2/3, label: '3'},
          {x: w*2/3, y: h*2/3, label: '4'}
        ].map((p, i) => `
          <circle cx="${p.x}" cy="${p.y}" r="25" fill="rgba(255,107,107,0.3)" stroke="${palette.accent[0]}" stroke-width="2"/>
          <text x="${p.x}" y="${p.y+6}" text-anchor="middle" font-size="16" font-weight="bold" fill="white">${p.label}</text>
        `).join('')}
        
        <!-- Golden Spiral hint -->
        <path d="M ${w*0.7} ${h*0.2} Q ${w*0.9} ${h*0.4} ${w*0.75} ${h*0.6} Q ${w*0.6} ${h*0.8} ${w*0.35} ${h*0.7}" 
              fill="none" stroke="${palette.accent[0]}" stroke-width="2" opacity="0.4" stroke-dasharray="5,3"/>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.3)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">📊 Композиция</text>
        <text x="${w/2}" y="${h-30}" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.4)">Правило третей • Точки силы</text>
        
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`,
    
    lighting: () => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="lightBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1a1a2e"/>
            <stop offset="100%" stop-color="#0d0d1a"/>
          </linearGradient>
          <radialGradient id="lightSource" cx="75%" cy="15%" r="50%">
            <stop offset="0%" stop-color="#FFD700"/>
            <stop offset="30%" stop-color="#FFA500"/>
            <stop offset="100%" stop-color="transparent"/>
          </radialGradient>
          <radialGradient id="lightCone" cx="75%" cy="15%" r="70%">
            <stop offset="0%" stop-color="rgba(255,215,0,0.3)"/>
            <stop offset="100%" stop-color="transparent"/>
          </radialGradient>
          <filter id="softGlow"><feGaussianBlur stdDeviation="10"/></filter>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#lightBg)"/>
        
        <!-- Light cone -->
        <ellipse cx="${w*0.75}" cy="${h*0.5}" rx="${w*0.6}" ry="${h*0.5}" fill="url(#lightCone)"/>
        
        <!-- Light source -->
        <circle cx="${w*0.75}" cy="${h*0.12}" r="80" fill="url(#lightSource)" filter="url(#softGlow)"/>
        <circle cx="${w*0.75}" cy="${h*0.12}" r="25" fill="#FFD700"/>
        
        <!-- Object with light/shadow -->
        <g transform="translate(${w*0.35}, ${h*0.55})">
          <!-- Shadow -->
          <ellipse cx="40" cy="80" rx="60" ry="15" fill="rgba(0,0,0,0.4)"/>
          <!-- Object -->
          <rect x="0" y="0" width="80" height="80" rx="10" fill="${palette.accent[0]}"/>
          <!-- Highlight -->
          <rect x="10" y="10" width="30" height="30" rx="5" fill="rgba(255,255,255,0.3)"/>
          <!-- Shadow side -->
          <rect x="50" y="0" width="30" height="80" rx="0 10 10 0" fill="rgba(0,0,0,0.2)"/>
        </g>
        
        <!-- Light rays -->
        <g stroke="#FFD700" stroke-width="1" opacity="0.3">
          ${Array.from({length: 8}, (_, i) => {
            const angle = -60 + i * 15;
            const rad = angle * Math.PI / 180;
            const x1 = w*0.75 + 30 * Math.cos(rad);
            const y1 = h*0.12 + 30 * Math.sin(rad);
            const x2 = w*0.75 + 200 * Math.cos(rad);
            const y2 = h*0.12 + 200 * Math.sin(rad);
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
          }).join('')}
        </g>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.3)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">💡 Освещение</text>
        
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`,
    
    details: () => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="detBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1a3a2e"/>
            <stop offset="100%" stop-color="#0d1f17"/>
          </linearGradient>
          <filter id="detBlur"><feGaussianBlur stdDeviation="2"/></filter>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#detBg)"/>
        
        <!-- Grass/Moss details -->
        ${Array.from({length: 60}, () => {
          const x = Math.random() * w;
          const y = h*0.4 + Math.random() * h*0.5;
          const h_ = Math.random() * 20 + 10;
          const color = palette.ground[Math.floor(Math.random() * 3)];
          return `<path d="M${x} ${y} Q${x-5} ${y-h_/2} ${x+Math.random()*10-5} ${y-h_}" stroke="${color}" stroke-width="${Math.random()*2+1}" fill="none" opacity="${Math.random()*0.5+0.3}"/>`;
        }).join('')}
        
        <!-- Flowers/Sparkles -->
        ${Array.from({length: 25}, () => {
          const x = Math.random() * w;
          const y = h*0.3 + Math.random() * h*0.5;
          const r = Math.random() * 6 + 3;
          const color = palette.accent[Math.floor(Math.random() * 3)];
          return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${Math.random()*0.4+0.3}"/>`;
        }).join('')}
        
        <!-- Leaves -->
        ${Array.from({length: 15}, () => {
          const x = Math.random() * w;
          const y = Math.random() * h*0.6;
          const s = Math.random() * 15 + 10;
          return `<ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s*0.6}" fill="${palette.ground[1]}" opacity="${Math.random()*0.3+0.2}" transform="rotate(${Math.random()*360} ${x} ${y})"/>`;
        }).join('')}
        
        <!-- Floating particles -->
        ${Array.from({length: 20}, () => {
          const x = Math.random() * w;
          const y = Math.random() * h;
          const r = Math.random() * 3 + 1;
          return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${Math.random()*0.3+0.1}"/>`;
        }).join('')}
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.3)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">✨ Детали</text>
        
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`,
    
    objects: () => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="objBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1e2d2d"/>
            <stop offset="100%" stop-color="#152222"/>
          </linearGradient>
          <filter id="objShadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/></filter>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#objBg)"/>
        
        <!-- Ground -->
        <rect y="${h*0.75}" width="100%" height="${h*0.25}" fill="rgba(0,0,0,0.2)"/>
        
        <!-- Trees -->
        <g transform="translate(100, ${h*0.35})" filter="url(#objShadow)">
          <rect x="-8" y="0" width="16" height="100" fill="#8B4513"/>
          <ellipse cx="0" cy="-20" rx="50" ry="70" fill="${palette.ground[0]}"/>
          <ellipse cx="-20" cy="-10" rx="30" ry="45" fill="${palette.ground[1]}"/>
        </g>
        
        <g transform="translate(${w-150}, ${h*0.4})" filter="url(#objShadow)">
          <rect x="-6" y="0" width="12" height="80" fill="#8B4513"/>
          <ellipse cx="0" cy="-15" rx="40" ry="55" fill="${palette.ground[1]}"/>
        </g>
        
        <!-- Rock -->
        <g transform="translate(${w*0.3}, ${h*0.7})" filter="url(#objShadow)">
          <ellipse cx="0" cy="0" rx="45" ry="30" fill="#696969"/>
          <ellipse cx="-10" cy="-10" rx="35" ry="22" fill="#808080"/>
        </g>
        
        <!-- Mushrooms -->
        <g transform="translate(${w*0.5}, ${h*0.75})">
          <ellipse cx="0" cy="5" rx="20" ry="8" fill="${palette.accent[0]}"/>
          <rect x="-6" y="5" width="12" height="20" fill="#F5DEB3"/>
          <circle cx="-8" cy="0" r="4" fill="white"/>
          <circle cx="5" cy="-3" r="3" fill="white"/>
        </g>
        
        <!-- Flowers -->
        ${Array.from({length: 5}, (_, i) => {
          const x = w*0.15 + i * (w*0.15);
          return `
            <g transform="translate(${x}, ${h*0.8})">
              <line x1="0" y1="0" x2="0" y2="25" stroke="#228B22" stroke-width="2"/>
              <circle cx="0" cy="-5" r="8" fill="${palette.accent[i % 3]}"/>
              <circle cx="0" cy="-5" r="3" fill="#FFD700"/>
            </g>
          `;
        }).join('')}
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.3)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">🪑 Предметы</text>
        
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`,
    
    characters: () => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="charBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1a1a2e"/>
            <stop offset="100%" stop-color="#0d0d1a"/>
          </linearGradient>
          <filter id="charShadow"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.4)"/></filter>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#charBg)"/>
        
        <!-- Ground shadow -->
        <ellipse cx="${w/2}" cy="${h*0.85}" rx="${w*0.4}" ry="30" fill="rgba(0,0,0,0.3)"/>
        
        <!-- Main Character (Wizard) -->
        <g transform="translate(${w*0.35}, ${h*0.5})" filter="url(#charShadow)">
          <!-- Body -->
          <ellipse cx="0" cy="60" rx="35" ry="15" fill="rgba(0,0,0,0.2)"/>
          <path d="M-30 30 Q-35 0 -25 -30 Q0 -50 25 -30 Q35 0 30 30 Q0 50 -30 30" fill="#6B4E9E"/>
          <path d="M-20 20 Q0 35 20 20" fill="#8B6BB8"/>
          
          <!-- Head -->
          <circle cx="0" cy="-45" r="28" fill="${palette.skin[0]}"/>
          
          <!-- Hair/Hat -->
          <path d="M-35 -50 Q0 -100 35 -50 Q20 -70 0 -65 Q-20 -70 -35 -50" fill="#4A3A6B"/>
          <polygon points="0,-95 -8,-65 8,-65" fill="#6B4E9E"/>
          <circle cx="0" cy="-95" r="8" fill="${palette.accent[0]}"/>
          
          <!-- Face -->
          <circle cx="-10" cy="-50" r="4" fill="#333"/>
          <circle cx="10" cy="-50" r="4" fill="#333"/>
          <path d="M-8 -35 Q0 -28 8 -35" fill="none" stroke="#333" stroke-width="2"/>
          
          <!-- Staff -->
          <line x1="35" y1="-20" x2="45" y2="60" stroke="#8B4513" stroke-width="6"/>
          <circle cx="40" cy="-25" r="10" fill="${palette.accent[0]}"/>
        </g>
        
        <!-- Second Character (Fairy) -->
        <g transform="translate(${w*0.65}, ${h*0.55})" filter="url(#charShadow)">
          <!-- Wings -->
          <ellipse cx="-25" cy="-10" rx="20" ry="35" fill="${palette.accent[0]}" opacity="0.4"/>
          <ellipse cx="25" cy="-10" rx="20" ry="35" fill="${palette.accent[0]}" opacity="0.4"/>
          
          <!-- Body -->
          <ellipse cx="0" cy="50" rx="20" ry="8" fill="rgba(0,0,0,0.2)"/>
          <path d="M-18 25 Q-20 0 -15 -20 Q0 -35 15 -20 Q20 0 18 25" fill="#4ECDC4"/>
          
          <!-- Head -->
          <circle cx="0" cy="-30" r="20" fill="${palette.skin[0]}"/>
          
          <!-- Hair -->
          <path d="M-22 -35 Q-10 -60 0 -55 Q10 -60 22 -35 Q15 -45 0 -42 Q-15 -45 -22 -35" fill="${palette.hair[0]}"/>
          
          <!-- Face -->
          <circle cx="-7" cy="-33" r="3" fill="#333"/>
          <circle cx="7" cy="-33" r="3" fill="#333"/>
          <path d="M-5 -22 Q0 -18 5 -22" fill="none" stroke="#333" stroke-width="1.5"/>
          
          <!-- Sparkles -->
          <circle cx="-30" cy="-30" r="3" fill="${palette.accent[0]}" opacity="0.8"/>
          <circle cx="30" cy="-20" r="2" fill="${palette.accent[0]}" opacity="0.6"/>
          <circle cx="0" cy="-55" r="2" fill="white" opacity="0.8"/>
        </g>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.3)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">👤 Персонажи</text>
        
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`,
    
    layout: () => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="layBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1a1a2e"/>
            <stop offset="100%" stop-color="#16213e"/>
          </linearGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#layBg)"/>
        
        <!-- Scene zones -->
        <!-- Background zone -->
        <rect x="${w*0.05}" y="${h*0.12}" width="${w*0.28}" height="${h*0.32}" rx="12" fill="rgba(100,200,100,0.1)" stroke="rgba(100,200,100,0.4)" stroke-width="2"/>
        <text x="${w*0.19}" y="${h*0.30}" text-anchor="middle" font-size="14" fill="rgba(100,200,100,0.8)">ФОН</text>
        <text x="${w*0.19}" y="${h*0.38}" text-anchor="middle" font-size="10" fill="rgba(100,200,100,0.5)">Горы, небо</text>
        
        <!-- Midground zone -->
        <rect x="${w*0.36}" y="${h*0.22}" width="${w*0.28}" height="${h*0.38}" rx="12" fill="rgba(200,200,100,0.1)" stroke="rgba(200,200,100,0.4)" stroke-width="2"/>
        <text x="${w*0.5}" y="${h*0.43}" text-anchor="middle" font-size="14" fill="rgba(200,200,100,0.8)">СРЕДНИЙ</text>
        <text x="${w*0.5}" y="${h*0.51}" text-anchor="middle" font-size="10" fill="rgba(200,200,100,0.5)">Персонажи</text>
        
        <!-- Foreground zone -->
        <rect x="${w*0.67}" y="${h*0.32}" width="${w*0.28}" height="${h*0.42}" rx="12" fill="rgba(200,100,100,0.1)" stroke="rgba(200,100,100,0.4)" stroke-width="2"/>
        <text x="${w*0.81}" y="${h*0.55}" text-anchor="middle" font-size="14" fill="rgba(200,100,100,0.8)">ПЕРЕДНИЙ</text>
        <text x="${w*0.81}" y="${h*0.63}" text-anchor="middle" font-size="10" fill="rgba(200,100,100,0.5)">Детали, предметы</text>
        
        <!-- Depth arrows -->
        <g fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2">
          <path d="M${w*0.19} ${h*0.48} L${w*0.5} ${h*0.65}"/>
          <path d="M${w*0.5} ${h*0.65} L${w*0.81} ${h*0.78}"/>
          <polygon points="${w*0.81},${h*0.75} ${w*0.78},${h*0.82} ${w*0.84},${h*0.82}" fill="rgba(255,255,255,0.3)"/>
        </g>
        
        <!-- Depth label -->
        <text x="${w*0.5}" y="${h*0.88}" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.4)">← ГЛУБИНА СЦЕНЫ →</text>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.3)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">📍 Расстановка</text>
        
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`,
    
    animation: () => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="animBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1a1a2e"/>
            <stop offset="100%" stop-color="#16213e"/>
          </linearGradient>
        </defs>
        <style>
          .float1 { animation: float1 2.5s ease-in-out infinite; }
          .float2 { animation: float2 2.5s ease-in-out infinite; animation-delay: 0.8s; }
          .float3 { animation: float3 2.5s ease-in-out infinite; animation-delay: 1.6s; }
          .pulse { animation: pulse 1.5s ease-in-out infinite; }
          @keyframes float1 { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-25px) scale(1.05); } }
          @keyframes float2 { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.1); } }
          @keyframes float3 { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(0.95); } }
          @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        </style>
        
        <rect width="100%" height="100%" fill="url(#animBg)"/>
        
        <!-- Animated elements -->
        <circle cx="${w*0.25}" cy="${h*0.45}" r="55" fill="${palette.sky[0]}" class="float1" opacity="0.8"/>
        <circle cx="${w*0.5}" cy="${h*0.5}" r="70" fill="${palette.ground[1]}" class="float2" opacity="0.7"/>
        <circle cx="${w*0.75}" cy="${h*0.42}" r="45" fill="${palette.accent[0]}" class="float3" opacity="0.8"/>
        
        <!-- Motion trails -->
        <ellipse cx="${w*0.25}" cy="${h*0.6}" rx="40" ry="8" fill="${palette.sky[0]}" opacity="0.2"/>
        <ellipse cx="${w*0.5}" cy="${h*0.68}" rx="55" ry="10" fill="${palette.ground[1]}" opacity="0.15"/>
        <ellipse cx="${w*0.75}" cy="${h*0.58}" rx="35" ry="6" fill="${palette.accent[0]}" opacity="0.2"/>
        
        <!-- Timeline -->
        <g transform="translate(50, ${h*0.85})">
          <rect width="${w-100}" height="8" rx="4" fill="rgba(255,255,255,0.1)"/>
          <rect width="${(w-100)*0.6}" height="8" rx="4" fill="url(#animBg)"/>
          <rect width="${(w-100)*0.6}" height="8" rx="4" fill="${palette.accent[0]}" class="pulse"/>
          
          <!-- Keyframes -->
          <circle cx="0" cy="4" r="10" fill="${palette.sky[0]}" stroke="white" stroke-width="2"/>
          <circle cx="${(w-100)*0.3}" cy="4" r="8" fill="${palette.ground[1]}" stroke="white" stroke-width="2"/>
          <circle cx="${(w-100)*0.6}" cy="4" r="10" fill="${palette.accent[0]}" stroke="white" stroke-width="2"/>
          <circle cx="${w-100}" cy="4" r="8" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="2"/>
        </g>
        
        <!-- Keyframe labels -->
        <text x="50" y="${h*0.82}" font-size="10" fill="rgba(255,255,255,0.5)">0s</text>
        <text x="${50+(w-100)*0.3}" y="${h*0.82}" font-size="10" fill="rgba(255,255,255,0.5)">0.5s</text>
        <text x="${50+(w-100)*0.6}" y="${h*0.82}" font-size="10" fill="rgba(255,255,255,0.5)">1s</text>
        <text x="${w-50}" y="${h*0.82}" font-size="10" fill="rgba(255,255,255,0.5)">END</text>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.3)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">🎬 Анимация</text>
        
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ</text>
      </svg>`,
    
    typography: () => {
      const title = customText?.title || (taskType === 'ad' ? 'БРЕНД' : taskType === 'banner' ? 'ЗАГОЛОВОК' : 'ТЕКСТ');
      const subtitle = customText?.subtitle || 'Подзаголовок проекта';
      const cta = customText?.cta || 'Подробнее';
      const fonts: Record<string, string> = { ghibli: 'Georgia, serif', disney: 'Impact, sans-serif', pixar: 'Helvetica, sans-serif', anime: 'Arial, sans-serif' };
      const font = fonts[style] || 'Georgia, serif';
      
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="typoBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1a1a2e"/>
            <stop offset="100%" stop-color="#0d0d1a"/>
          </linearGradient>
          <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="white"/>
            <stop offset="100%" stop-color="${palette.accent[0]}"/>
          </linearGradient>
          <filter id="textShadow"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/></filter>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#typoBg)"/>
        
        <!-- Title -->
        <text x="${w/2}" y="${h*0.3}" text-anchor="middle" font-family="${font}" font-size="52" font-weight="bold" fill="url(#textGrad)" filter="url(#textShadow)">${title}</text>
        
        <!-- Subtitle -->
        <text x="${w/2}" y="${h*0.42}" text-anchor="middle" font-family="${font}" font-size="22" fill="rgba(255,255,255,0.7)">${subtitle}</text>
        
        <!-- Divider -->
        <line x1="${w*0.3}" y1="${h*0.5}" x2="${w*0.7}" y2="${h*0.5}" stroke="${palette.accent[0]}" stroke-width="2" opacity="0.5"/>
        
        <!-- CTA Button -->
        <g transform="translate(${w/2 - 100}, ${h*0.6})">
          <rect width="200" height="55" rx="27" fill="${palette.accent[0]}"/>
          <rect x="2" y="2" width="196" height="51" rx="25" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
          <text x="100" y="36" text-anchor="middle" font-family="${font}" font-size="18" font-weight="bold" fill="white">${cta}</text>
        </g>
        
        <!-- Font samples -->
        <g transform="translate(50, ${h*0.78})">
          <text font-family="Georgia, serif" font-size="14" fill="rgba(255,255,255,0.4)">Serif</text>
          <text x="80" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.4)">Sans</text>
          <text x="150" font-family="Impact, sans-serif" font-size="14" fill="rgba(255,255,255,0.4)">Bold</text>
        </g>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.3)"/>
        <text x="${w/2}" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="white">🔤 Типографика</text>
        
        <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.2)">ФОРТОРИУМ • ${style.toUpperCase()}</text>
      </svg>`;
    }
  };
  
  return generators[id]?.() || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="${w/2}" y="${h/2}" text-anchor="middle" font-size="24" fill="white">${id}</text></svg>`;
}

function composeFinalScene(config: any): string {
  const { settings, dimensions, taskType, customText } = config;
  const { width: w, height: h } = dimensions;
  const { timeOfDay, location, mood, style, palette } = settings;
  
  const title = customText?.title || '';
  const subtitle = customText?.subtitle || '';
  const cta = customText?.cta || 'Подробнее';
  const price = customText?.price || '';
  const hashtag = customText?.hashtag || '';
  
  const fonts: Record<string, string> = { ghibli: 'Georgia', disney: 'Impact', pixar: 'Helvetica', anime: 'Arial' };
  const font = fonts[style] || 'Georgia';
  
  const timeColors: Record<string, {sky: string[], sun: string, sunY: number, moon: boolean}> = {
    'день': { sky: palette.sky, sun: '#FFD700', sunY: 0.1, moon: false },
    'ночь': { sky: ['#0D1B2A', '#1B263B', '#415A77'], sun: '#F5F5DC', sunY: 0.12, moon: true },
    'вечер': { sky: ['#FF6B35', '#F7931E', '#FFD700'], sun: '#FF4500', sunY: 0.3, moon: false },
    'рассвет': { sky: ['#FFB6C1', '#FFC0CB', '#FFE4E1'], sun: '#FFA500', sunY: 0.4, moon: false }
  };
  const tc = timeColors[timeOfDay] || timeColors['день'];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
    <defs>
      <!-- Sky gradient -->
      <linearGradient id="fSky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${tc.sky[0]}"/>
        <stop offset="50%" stop-color="${tc.sky[1]}"/>
        <stop offset="100%" stop-color="${tc.sky[2]}"/>
      </linearGradient>
      
      <!-- Ground gradient -->
      <linearGradient id="fGround" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${palette.ground[0]}"/>
        <stop offset="100%" stop-color="${palette.ground[2]}"/>
      </linearGradient>
      
      <!-- Water gradient -->
      <linearGradient id="fWater" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${palette.water[0]}"/>
        <stop offset="100%" stop-color="${palette.water[2]}"/>
      </linearGradient>
      
      <!-- Vignette -->
      <radialGradient id="fVignette" cx="50%" cy="50%" r="70%">
        <stop offset="60%" stop-color="transparent"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.4)"/>
      </radialGradient>
      
      <!-- Text gradient -->
      <linearGradient id="fTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="white"/>
        <stop offset="100%" stop-color="${palette.accent[0]}"/>
      </linearGradient>
      
      <!-- Filters -->
      <filter id="fShadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/></filter>
      <filter id="fGlow"><feGaussianBlur stdDeviation="3"/><feColorMatrix type="saturate" values="1.3"/></filter>
      <filter id="fSoftBlur"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>
    
    <!-- ========== SKY ========== -->
    <rect width="100%" height="${h*0.65}" fill="url(#fSky)"/>
    
    <!-- Sun/Moon -->
    ${tc.moon ? `
      <!-- Stars -->
      ${Array.from({length: 40}, () => {
        const x = Math.random() * w;
        const y = Math.random() * h * 0.45;
        const r = Math.random() * 1.5 + 0.5;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${Math.random()*0.6+0.2}"/>`;
      }).join('')}
      <!-- Moon -->
      <circle cx="${w*0.82}" cy="${h*0.12}" r="35" fill="#F5F5DC" filter="url(#fGlow)"/>
      <circle cx="${w*0.84}" cy="${h*0.1}" r="30" fill="${tc.sky[0]}"/>
    ` : `
      <!-- Sun glow -->
      <circle cx="${w*0.82}" cy="${h*tc.sunY}" r="70" fill="${tc.sun}" opacity="0.2" filter="url(#fSoftBlur)"/>
      <circle cx="${w*0.82}" cy="${h*tc.sunY}" r="35" fill="${tc.sun}"/>
      
      <!-- Clouds -->
      <g opacity="0.7">
        <ellipse cx="${w*0.12}" cy="${h*0.12}" rx="90" ry="35" fill="white" opacity="0.5"/>
        <ellipse cx="${w*0.18}" cy="${h*0.15}" rx="70" ry="28" fill="white" opacity="0.4"/>
        <ellipse cx="${w*0.55}" cy="${h*0.18}" rx="110" ry="40" fill="white" opacity="0.35"/>
        <ellipse cx="${w*0.6}" cy="${h*0.15}" rx="80" ry="30" fill="white" opacity="0.4"/>
      </g>
    `}
    
    <!-- ========== MOUNTAINS ========== -->
    <path d="M0 ${h*0.52} L${w*0.12} ${h*0.32} L${w*0.25} ${h*0.45} L${w*0.38} ${h*0.28} L${w*0.52} ${h*0.42} L${w*0.68} ${h*0.22} L${w*0.82} ${h*0.38} L${w*0.92} ${h*0.3} L${w} ${h*0.4} L${w} ${h*0.58} L0 ${h*0.58} Z" 
          fill="${palette.ground[2]}" opacity="0.6"/>
    <path d="M0 ${h*0.55} L${w*0.18} ${h*0.38} L${w*0.35} ${h*0.48} L${w*0.5} ${h*0.35} L${w*0.7} ${h*0.45} L${w*0.85} ${h*0.38} L${w} ${h*0.48} L${w} ${h*0.6} L0 ${h*0.6} Z" 
          fill="${palette.ground[1]}" opacity="0.7"/>
    
    <!-- ========== GROUND ========== -->
    <rect y="${h*0.55}" width="100%" height="${h*0.45}" fill="url(#fGround)"/>
    
    <!-- Grass details -->
    ${Array.from({length: 80}, () => {
      const x = Math.random() * w;
      const y = h*0.6 + Math.random() * h*0.35;
      const h_ = Math.random() * 15 + 8;
      const color = palette.ground[Math.floor(Math.random() * 2)];
      return `<path d="M${x} ${y} Q${x-3} ${y-h_/2} ${x+Math.random()*6-3} ${y-h_}" stroke="${color}" stroke-width="${Math.random()+0.5}" fill="none" opacity="${Math.random()*0.4+0.2}"/>`;
    }).join('')}
    
    <!-- Trees in background -->
    <g transform="translate(${w*0.08}, ${h*0.52})" opacity="0.7">
      <rect x="-4" y="0" width="8" height="35" fill="#5D4037"/>
      <ellipse cx="0" cy="-15" rx="25" ry="35" fill="${palette.ground[0]}"/>
    </g>
    <g transform="translate(${w*0.92}, ${h*0.55})" opacity="0.7">
      <rect x="-3" y="0" width="6" height="28" fill="#5D4037"/>
      <ellipse cx="0" cy="-12" rx="20" ry="28" fill="${palette.ground[1]}"/>
    </g>
    
    <!-- ========== CHARACTERS ========== -->
    <!-- Main Character -->
    <g transform="translate(${w*0.38}, ${h*0.72})" filter="url(#fShadow)">
      <ellipse cx="0" cy="55" rx="28" ry="10" fill="rgba(0,0,0,0.25)"/>
      <!-- Body -->
      <path d="M-28 25 Q-32 -5 -22 -35 Q0 -55 22 -35 Q32 -5 28 25 Q0 45 -28 25" fill="#6B4E9E"/>
      <path d="M-18 18 Q0 32 18 18" fill="#8B6BB8"/>
      <!-- Head -->
      <circle cx="0" cy="-48" r="26" fill="${palette.skin[0]}"/>
      <!-- Hair/Hat -->
      <path d="M-32 -52 Q0 -95 32 -52 Q18 -70 0 -65 Q-18 -70 -32 -52" fill="#4A3A6B"/>
      <polygon points="0,-88 -6,-62 6,-62" fill="#6B4E9E"/>
      <circle cx="0" cy="-88" r="6" fill="${palette.accent[0]}"/>
      <!-- Face -->
      <circle cx="-9" cy="-52" r="3.5" fill="#333"/>
      <circle cx="9" cy="-52" r="3.5" fill="#333"/>
      <path d="M-6 -38 Q0 -32 6 -38" fill="none" stroke="#333" stroke-width="2"/>
      <!-- Staff -->
      <line x1="32" y1="-25" x2="42" y2="52" stroke="#8B4513" stroke-width="5"/>
      <circle cx="37" cy="-30" r="8" fill="${palette.accent[0]}"/>
    </g>
    
    <!-- Second Character -->
    <g transform="translate(${w*0.62}, ${h*0.75})" filter="url(#fShadow)">
      <ellipse cx="0" cy="45" rx="22" ry="8" fill="rgba(0,0,0,0.25)"/>
      <!-- Wings -->
      <ellipse cx="-22" cy="-8" rx="18" ry="30" fill="${palette.accent[0]}" opacity="0.35"/>
      <ellipse cx="22" cy="-8" rx="18" ry="30" fill="${palette.accent[0]}" opacity="0.35"/>
      <!-- Body -->
      <path d="M-16 22 Q-18 0 -12 -18 Q0 -28 12 -18 Q18 0 16 22" fill="#4ECDC4"/>
      <!-- Head -->
      <circle cx="0" cy="-26" r="18" fill="${palette.skin[0]}"/>
      <!-- Hair -->
      <path d="M-18 -30 Q-8 -50 0 -46 Q8 -50 18 -30 Q12 -38 0 -36 Q-12 -38 -18 -30" fill="${palette.hair[0]}"/>
      <!-- Face -->
      <circle cx="-6" cy="-28" r="2.5" fill="#333"/>
      <circle cx="6" cy="-28" r="2.5" fill="#333"/>
      <path d="M-4 -20 Q0 -16 4 -20" fill="none" stroke="#333" stroke-width="1.5"/>
      <!-- Sparkles -->
      <circle cx="-25" cy="-25" r="2.5" fill="${palette.accent[0]}" opacity="0.7"/>
      <circle cx="25" cy="-18" r="2" fill="${palette.accent[0]}" opacity="0.5"/>
    </g>
    
    <!-- Flowers -->
    ${Array.from({length: 8}, (_, i) => {
      const x = w*0.1 + i * (w*0.1);
      const y = h*0.88 + Math.random() * 15 - 7;
      const color = palette.accent[i % 3];
      return `
        <g transform="translate(${x}, ${y})">
          <line x1="0" y1="0" x2="0" y2="18" stroke="#228B22" stroke-width="1.5"/>
          <circle cx="0" cy="-4" r="6" fill="${color}"/>
          <circle cx="0" cy="-4" r="2" fill="#FFD700"/>
        </g>
      `;
    }).join('')}
    
    <!-- ========== TEXT OVERLAYS ========== -->
    ${taskType === 'banner' || taskType === 'ad' ? `
      <!-- Dark overlay for text -->
      <rect x="0" y="0" width="100%" height="42%" fill="rgba(0,0,0,0.55)"/>
      
      <!-- Title -->
      ${title ? `<text x="${w/2}" y="${h*0.18}" text-anchor="middle" font-family="${font}" font-size="${taskType === 'ad' ? 54 : 46}" font-weight="bold" fill="url(#fTextGrad)">${title}</text>` : ''}
      
      <!-- Subtitle -->
      ${subtitle ? `<text x="${w/2}" y="${h*0.27}" text-anchor="middle" font-family="${font}" font-size="20" fill="rgba(255,255,255,0.85)">${subtitle}</text>` : ''}
      
      <!-- Price -->
      ${price ? `<text x="${w/2}" y="${h*0.36}" text-anchor="middle" font-family="${font}" font-size="32" font-weight="bold" fill="${palette.accent[0]}">${price}</text>` : ''}
      
      <!-- CTA Button -->
      <g transform="translate(${w/2 - 85}, ${h*0.32})">
        <rect width="170" height="48" rx="24" fill="${palette.accent[0]}"/>
        <text x="85" y="31" text-anchor="middle" font-family="${font}" font-size="16" font-weight="bold" fill="white">${cta}</text>
      </g>
    ` : ''}
    
    ${taskType === 'social' ? `
      <rect x="0" y="0" width="100%" height="32%" fill="rgba(0,0,0,0.5)"/>
      ${title ? `<text x="${w/2}" y="${h*0.15}" text-anchor="middle" font-family="${font}" font-size="40" font-weight="bold" fill="white">${title}</text>` : ''}
      ${hashtag ? `<text x="${w-20}" y="${h-20}" text-anchor="end" font-size="14" fill="rgba(255,255,255,0.6)">${hashtag}</text>` : ''}
    ` : ''}
    
    ${taskType === 'poster' ? `
      <rect x="0" y="0" width="100%" height="38%" fill="rgba(0,0,0,0.45)"/>
      ${title ? `<text x="${w/2}" y="${h*0.16}" text-anchor="middle" font-family="${font}" font-size="48" font-weight="bold" fill="white">${title}</text>` : ''}
      ${subtitle ? `<text x="${w/2}" y="${h*0.26}" text-anchor="middle" font-family="${font}" font-size="18" fill="rgba(255,255,255,0.8)">${subtitle}</text>` : ''}
    ` : ''}
    
    <!-- ========== VIGNETTE ========== -->
    <rect width="100%" height="100%" fill="url(#fVignette)"/>
    
    <!-- ========== WATERMARK ========== -->
    ${taskType === 'scene' ? `
      <text x="${w-15}" y="${h-15}" text-anchor="end" font-size="11" fill="rgba(255,255,255,0.35)" font-weight="bold">ФОРТОРИУМ</text>
      <text x="15" y="${h-15}" font-size="10" fill="rgba(255,255,255,0.4)">${location} • ${timeOfDay} • ${mood}</text>
    ` : `<text x="${w-15}" y="${h-15}" text-anchor="end" font-size="9" fill="rgba(255,255,255,0.25)">ФОРТОРИУМ • ${taskType}</text>`}
  </svg>`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'svg-coordinator',
    version: '4.7.0',
    team: SVG_AGENTS,
    taskTypes: ['scene', 'banner', 'ad', 'social', 'poster'],
    styles: Object.keys(STYLE_PALETTES),
    features: [
      '11 SVG агентов + композитор',
      'Качественные градиенты и тени',
      'Детализированные персонажи',
      'Анимации и эффекты',
      '4 визуальных стиля',
      'Поддержка ТЗ'
    ]
  });
}
