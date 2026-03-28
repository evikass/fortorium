# ФОРТОРИУМ v3.3.0

**Анимационная студия будущего** — AI-powered animation studio

## 🚀 Быстрый деплой на Vercel

### Вариант 1: Через GitHub (рекомендуется)

1. Создайте новый репозиторий на GitHub:
   ```bash
   # В директории проекта
   git remote set-url origin https://github.com/YOUR_USERNAME/fortorium.git
   git push -u origin master
   ```

2. Импортируйте проект в Vercel:
   - Откройте https://vercel.com/new
   - Выберите ваш GitHub репозиторий
   - Нажмите "Deploy"

### Вариант 2: Прямой деплой через Vercel CLI

```bash
# Установка Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

## ⚙️ Переменные окружения

Добавьте в Vercel Dashboard → Settings → Environment Variables:

| Переменная | Значение | Описание |
|------------|----------|----------|
| `STABILITY_API_KEY` | `sk-V2gw...` | API ключ Stability AI для генерации изображений |

## 🔧 Что нового в v3.3.0

### Система версионирования
- ✅ Автоматическая проверка версии при загрузке
- ✅ Миграция данных между версиями
- ✅ Очистка устаревшего localStorage
- ✅ Автоматическая перезагрузка при обновлении

### Улучшенное кэширование
- ✅ Уникальные Build ID для каждого деплоя
- ✅ Правильные Cache-Control заголовки
- ✅ Предотвращение проблем с Vercel CDN

### API улучшения
- ✅ `/api/version` — проверка совместимости версий
- ✅ `/api/img` — генерация изображений (Stability AI + fallback)
- ✅ Поддержка всех стилей анимации

## 🎨 Стили анимации

| Стиль | Описание |
|-------|----------|
| Ghibli | Studio Ghibli, Миядзаки, акварель |
| Disney | Классическая диснеевская анимация |
| Pixar | Современный 3D |
| Anime | Японская анимация |
| Soviet | Союзмультфильм, классика |
| Claymation | Пластилиновая анимация |

## 📖 Документация

- [Рекомендации по кэшированию Vercel](./Vercel_Caching_Recommendations.docx)

## 🔗 Ссылки

- Рабочий URL: `https://fortorium-02-git-master-evikass-projects.vercel.app/`

## 📝 Разработка

```bash
# Установка зависимостей
bun install

# Запуск в development режиме
bun run dev

# Сборка для production
bun run build

# Запуск production сервера
bun run start
```

---

**ФОРТОРИУМ © 2024** — Анимационная студия будущего
