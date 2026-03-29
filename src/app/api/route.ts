import { NextResponse } from 'next/server';

// Главный API endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    name: 'ФОРТОРИУМ',
    version: '3.3.0',
    description: 'Анимационная студия будущего',
    endpoints: {
      director: '/api/director',
      candidates: '/api/candidates',
      agents: '/api/agents/hire',
      projects: '/api/projects',
      tasks: '/api/tasks',
      work: '/api/work',
      img: '/api/img',
      video: '/api/video',
      tts: '/api/tts',
      blender: '/api/blender',
      hr: '/api/hr',
      version: '/api/version'
    },
    features: {
      imageGeneration: true,
      videoGeneration: false,
      audioGeneration: true,
      agentSystem: true
    },
    status: 'operational'
  });
}
