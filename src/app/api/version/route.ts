import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Версия сервера (должна совпадать с CLIENT_VERSION)
const SERVER_VERSION = '9.2.0'

/**
 * API endpoint для проверки версии
 * GET /api/version
 * 
 * Возвращает текущую версию сервера и минимальную поддерживаемую версию клиента.
 * Клиент может сравнить свою версию с серверной и определить, нужно ли обновление.
 */
export async function GET() {
  const serverVersion = SERVER_VERSION
  const minClientVersion = '3.0.0'
  
  return NextResponse.json({
    success: true,
    version: serverVersion,
    minClientVersion,
    buildTime: Date.now(),
    environment: process.env.NODE_ENV || 'production',
    features: {
      imageGeneration: true,
      videoGeneration: false,
      audioGeneration: true,
      stabilityAI: !!process.env.STABILITY_API_KEY,
    }
  }, {
    headers: {
      // Не кэшировать ответ
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json',
    }
  })
}

/**
 * POST /api/version
 * 
 * Проверяет совместимость версии клиента с сервером.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientVersion } = body
    
    const serverVersion = SERVER_VERSION
    const minClientVersion = '3.0.0'
    
    // Сравнение версий
    const compareVersions = (v1: string, v2: string): number => {
      const parts1 = v1.split('.').map(Number)
      const parts2 = v2.split('.').map(Number)
      
      for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0
        const p2 = parts2[i] || 0
        if (p1 > p2) return 1
        if (p1 < p2) return -1
      }
      return 0
    }
    
    const isOutdated = clientVersion ? compareVersions(clientVersion, minClientVersion) < 0 : false
    const needsUpdate = clientVersion ? compareVersions(serverVersion, clientVersion) > 0 : false
    const isCompatible = !isOutdated
    
    return NextResponse.json({
      success: true,
      compatible: isCompatible,
      needsUpdate,
      isOutdated,
      serverVersion,
      clientVersion: clientVersion || 'unknown',
      minClientVersion,
      message: isOutdated 
        ? 'Ваш клиент устарел. Пожалуйста, обновите страницу.'
        : needsUpdate 
          ? 'Доступна новая версия. Рекомендуется обновить страницу.'
          : 'Клиент актуален'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request body'
    }, { status: 400 })
  }
}
