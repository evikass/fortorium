/**
 * Система версионирования для проекта ФОРТОРИУМ
 * 
 * Позволяет автоматически обновлять клиент при выходе новой версии,
 * очищать устаревшие данные в localStorage и предотвращать
 * конфликты между версиями клиента и API.
 */

// Текущая версия клиента
export const CLIENT_VERSION = '9.0.0'

// Ключ для хранения версии в localStorage
const VERSION_KEY = 'fortorium_version'

// Ключ для хранения данных проекта
const PROJECT_DATA_KEY = 'fortorium_project'

// Минимальная поддерживаемая версия API
export const MIN_API_VERSION = '3.0.0'

/**
 * Сравнивает две семантические версии
 * @returns 1 если v1 > v2, -1 если v1 < v2, 0 если равны
 */
export function compareVersions(v1: string, v2: string): number {
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

/**
 * Проверяет, нужно ли обновить клиент
 */
export function checkClientVersion(): { 
  needsUpdate: boolean
  previousVersion: string | null
  currentVersion: string
  isBreaking: boolean
} {
  if (typeof window === 'undefined') {
    return { needsUpdate: false, previousVersion: null, currentVersion: CLIENT_VERSION, isBreaking: false }
  }
  
  const storedVersion = localStorage.getItem(VERSION_KEY)
  
  // Первая загрузка - сохраняем текущую версию
  if (!storedVersion) {
    localStorage.setItem(VERSION_KEY, CLIENT_VERSION)
    return { needsUpdate: false, previousVersion: null, currentVersion: CLIENT_VERSION, isBreaking: false }
  }
  
  // Версия изменилась
  if (storedVersion !== CLIENT_VERSION) {
    const comparison = compareVersions(CLIENT_VERSION, storedVersion)
    const isBreaking = comparison === 1 && hasBreakingChanges(storedVersion, CLIENT_VERSION)
    
    return {
      needsUpdate: true,
      previousVersion: storedVersion,
      currentVersion: CLIENT_VERSION,
      isBreaking
    }
  }
  
  return { needsUpdate: false, previousVersion: storedVersion, currentVersion: CLIENT_VERSION, isBreaking: false }
}

/**
 * Определяет, есть ли breaking changes между версиями
 */
function hasBreakingChanges(oldVersion: string, newVersion: string): boolean {
  const oldParts = oldVersion.split('.').map(Number)
  const newParts = newVersion.split('.').map(Number)
  
  // Major версия изменилась - breaking change
  if (newParts[0] > oldParts[0]) return true
  
  // Minor версия изменилась при переходе через порог 3.2 - потенциальный breaking change
  if (oldParts[0] === 3 && oldParts[1] < 2 && newParts[1] >= 2) return true
  
  // Переход на 3.7.0 требует очистки всех данных localStorage
  if (oldParts[0] === 3 && oldParts[1] < 8) return true
  
  return false
}

/**
 * Выполняет миграцию данных при обновлении версии
 */
export function migrateData(previousVersion: string | null, currentVersion: string): void {
  if (typeof window === 'undefined') return
  
  console.log(`[Version] Migrating from ${previousVersion} to ${currentVersion}`)
  
  // Миграция с версии < 3.7.0 - полная очистка localStorage
  if (!previousVersion || compareVersions(previousVersion, '3.8.0') < 0) {
    console.log('[Version] Clearing all Fortorium data for clean state...')
    
    // Очищаем ВСЕ ключи fortorium
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('fortorium_')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`[Version] Removed: ${key}`)
    })
  }
  
  // Миграция с версии < 3.2.0
  if (previousVersion && compareVersions(previousVersion, '3.2.0') < 0) {
    console.log('[Version] Clearing legacy data...')
    
    // Очищаем старые ключи localStorage
    const keysToPreserve = ['fortorium_version', 'fortorium_preferences']
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('fortorium_') && !keysToPreserve.includes(key)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`[Version] Removed: ${key}`)
    })
  }
  
  // Обновляем версию
  localStorage.setItem(VERSION_KEY, currentVersion)
}

/**
 * Принудительно обновляет страницу для загрузки новой версии
 */
export function forceReload(): void {
  if (typeof window === 'undefined') return
  
  console.log('[Version] Forcing page reload...')
  
  // Добавляем параметр для обхода кэша
  const url = new URL(window.location.href)
  url.searchParams.set('v', CLIENT_VERSION)
  url.searchParams.set('_', Date.now().toString())
  
  window.location.href = url.toString()
}

/**
 * Безопасное сохранение данных проекта
 */
export function saveProjectData(data: unknown): void {
  if (typeof window === 'undefined') return
  
  try {
    const payload = {
      version: CLIENT_VERSION,
      timestamp: Date.now(),
      data
    }
    localStorage.setItem(PROJECT_DATA_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error('[Version] Failed to save project data:', error)
  }
}

/**
 * Безопасная загрузка данных проекта
 */
export function loadProjectData<T>(): { 
  data: T | null
  version: string | null
  timestamp: number | null
  isOutdated: boolean
} {
  if (typeof window === 'undefined') {
    return { data: null, version: null, timestamp: null, isOutdated: false }
  }
  
  try {
    const raw = localStorage.getItem(PROJECT_DATA_KEY)
    if (!raw) {
      return { data: null, version: null, timestamp: null, isOutdated: false }
    }
    
    const parsed = JSON.parse(raw)
    const isOutdated = parsed.version && compareVersions(parsed.version, CLIENT_VERSION) < 0
    
    return {
      data: parsed.data,
      version: parsed.version,
      timestamp: parsed.timestamp,
      isOutdated
    }
  } catch (error) {
    console.error('[Version] Failed to load project data:', error)
    return { data: null, version: null, timestamp: null, isOutdated: false }
  }
}

/**
 * Полная инициализация системы версионирования
 * Вызывается при загрузке приложения
 */
export function initVersionSystem(): {
  needsReload: boolean
  version: string
  migrationPerformed: boolean
} {
  if (typeof window === 'undefined') {
    return { needsReload: false, version: CLIENT_VERSION, migrationPerformed: false }
  }
  
  const { needsUpdate, previousVersion, isBreaking } = checkClientVersion()
  
  if (needsUpdate) {
    console.log(`[Version] Update detected: ${previousVersion} -> ${CLIENT_VERSION}`)
    
    // Мигрируем данные
    migrateData(previousVersion, CLIENT_VERSION)
    
    // Если breaking change - перезагружаем страницу
    if (isBreaking) {
      console.log('[Version] Breaking change detected, will reload...')
      return { needsReload: true, version: CLIENT_VERSION, migrationPerformed: true }
    }
    
    return { needsReload: false, version: CLIENT_VERSION, migrationPerformed: true }
  }
  
  return { needsReload: false, version: CLIENT_VERSION, migrationPerformed: false }
}

/**
 * Хук для React компонентов
 */
export function useVersionCheck() {
  if (typeof window === 'undefined') {
    return { version: CLIENT_VERSION, needsReload: false, checked: false }
  }
  
  const { needsReload, version, migrationPerformed } = initVersionSystem()
  
  return {
    version,
    needsReload,
    migrationPerformed,
    checked: true
  }
}
