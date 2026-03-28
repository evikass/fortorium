# ФОРТОРИУМ - Best Practices для Vercel Deployment

## Проблемы, с которыми столкнулись

### 1. Кэширование JS-бандлов Vercel CDN
**Симптом**: Production URL показывает старый код, Preview URL показывает новый.
**Решение**: Создавать новый проект при критических изменениях.

### 2. Несовместимость localStorage данных
**Симптом**: `Cannot read properties of undefined (reading 'length')`
**Решение**: Валидация данных с версионированием.

---

## Рекомендации для проекта

### 1. Версионирование данных localStorage

\`\`\`typescript
// Добавить версию в структуру данных
interface Project {
  _version: number;  // Номер версии схемы данных
  id: string;
  title: string;
  // ... остальное
}

const CURRENT_VERSION = 1;

const isValidProject = (data: unknown): data is Project => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  // Проверяем версию
  if (obj._version !== CURRENT_VERSION) {
    console.log('Outdated project version, clearing...');
    return false;
  }
  
  // Проверяем обязательные поля
  return typeof obj.id === 'string' && typeof obj.title === 'string';
};
\`\`\`

### 2. Безопасное чтение массивов

\`\`\`typescript
// ВСЕГДА использовать ?? [] для массивов
const scenes = project?.script?.scenes ?? [];
const count = scenes.length; // Безопасно

// Или использовать optional chaining
const count = project?.script?.scenes?.length ?? 0;
\`\`\`

### 3. Graceful degradation для API

\`\`\`typescript
// Всегда иметь fallback
async function generateImage(prompt: string) {
  try {
    // Пробуем основной API
    return await stabilityAPI(prompt);
  } catch {
    try {
      // Fallback 1
      return await dicebearAPI(prompt);
    } catch {
      // Fallback 2 - локальный placeholder
      return generatePlaceholder(prompt);
    }
  }
}
\`\`\`

### 4. Очистка .next перед сборкой

\`\`\`json
// package.json
{
  "scripts": {
    "build": "rm -rf .next && next build"
  }
}
\`\`\`

### 5. Уникальный Build ID

\`\`\`typescript
// next.config.ts
{
  generateBuildId: async () => {
    return \`fortorium-v\${process.env.npm_package_version}-\${Date.now()}\`;
  }
}
\`\`\`

### 6. Environment Variables Checklist

Перед деплоем убедиться:
- [ ] STABILITY_API_KEY добавлен
- [ ] Переменные добавлены для Production И Preview
- [ ] После добавления переменных - Redeploy

---

## Чеклист при ошибках

### Ошибка: "Cannot read properties of undefined"
1. Открыть консоль браузера (F12)
2. Выполнить: \`localStorage.clear(); location.reload()\`
3. Проверить код на \`.length\` без \`?? []\` или \`?.\`

### Ошибка: "Configuration file not found"
1. Проверить, что в package.json НЕТ z-ai-web-dev-sdk
2. Удалить node_modules и .next
3. Переустановить зависимости

### Ошибка: "API request failed with status 401"
1. Проверить Environment Variables в Vercel
2. Убедиться что ключ правильный
3. Redeploy после добавления ключа

### Production URL показывает старую версию
1. Очистить кэш браузера (Ctrl+Shift+Delete)
2. Попробовать в приватном окне
3. Если не помогает - создать новый проект на Vercel

---

## Структура проекта для стабильности

\`\`\`
src/
├── app/
│   ├── page.tsx          # Тонкий wrapper
│   ├── FortoriumApp.tsx  # Основной компонент
│   └── api/
│       ├── generate/route.ts  # Генерация сценария
│       └── img/route.ts       # Генерация изображений
├── lib/
│   ├── validation.ts     # Валидация данных
│   └── constants.ts      # Константы и версии
└── types/
    └── project.ts        # TypeScript интерфейсы
\`\`\`

---

## Полезные команды

\`\`\`bash
# Очистка и пересборка
rm -rf .next node_modules/.cache && bun run build

# Принудительный push
git commit --allow-empty -m "trigger rebuild" && git push

# Проверка что в бандле нет старого кода
grep -r "z-ai-config" .next/server/ 2>/dev/null
\`\`\`
