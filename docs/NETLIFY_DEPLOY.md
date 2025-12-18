# Деплой на Netlify

## Обзор

Проект адаптирован для деплоя на Netlify с использованием:
- **Netlify Functions** для API (serverless)
- **Статические файлы** для frontend
- **Scheduled Functions** для cron задач

## Требования

1. Аккаунт на [Netlify](https://netlify.com)
2. Подключённый репозиторий GitHub
3. Переменные окружения в Netlify

## Шаги деплоя

### 1. Подготовка проекта

Убедитесь, что проект собирается локально:
```bash
npm install
npm run build
```

### 2. Установка зависимостей Netlify

Зависимости уже добавлены в `package.json`. Установите их:

```bash
npm install
```

### 3. Настройка переменных окружения в Netlify

В Netlify Dashboard → Site settings → Environment variables добавьте:

**Обязательные переменные:**
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
NODE_ENV=production
```

**API ключи (для работы уведомлений и YouTube функций):**
```
TELEGRAM_BOT_ID=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
YOU_TUBE_API=your_youtube_api_key
```

**Важно:** 
- Если пароль содержит спецсимволы, их нужно URL-кодировать.
- API ключи Telegram и YouTube должны быть добавлены в переменные окружения Netlify для корректной работы уведомлений и получения метаданных YouTube.
- Эти переменные используются приложением для инициализации соответствующих сервисов.

### 4. Подключение репозитория

1. Зайдите на [app.netlify.com](https://app.netlify.com)
2. Нажмите "Add new site" → "Import an existing project"
3. Выберите GitHub и ваш репозиторий
4. Настройки сборки:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/public`
   - **Functions directory:** `netlify/functions` (опционально, Netlify найдёт автоматически)

### 5. Настройка Scheduled Functions

Для cron задач (проверка запланированных переводов) нужно настроить Scheduled Functions:

**Вариант 1: Через Netlify Dashboard (рекомендуется)**
1. В Netlify Dashboard → Functions → Scheduled functions
2. Добавьте функцию `scheduled-check` с расписанием:
   - **Schedule:** `* * * * *` (каждую минуту)
   - **Function:** `scheduled-check`

**Вариант 2: Через внешний сервис**
Если Netlify Scheduled Functions не подходят, используйте внешний сервис:
- [cron-job.org](https://cron-job.org) - бесплатный сервис для cron задач
- Настройте HTTP запрос на: `https://your-site.netlify.app/.netlify/functions/scheduled-check`
- Расписание: каждую минуту

### 6. Деплой

После подключения репозитория:
- Netlify автоматически деплоит при каждом push в `main`
- Или нажмите "Deploy site" для первого деплоя

## Структура файлов

```
netlify/
  functions/
    server.ts          # Основная serverless function для API
    scheduled-check.ts # Scheduled function для cron задач
netlify.toml          # Конфигурация Netlify
```

## Ограничения Netlify

### ⚠️ Важные моменты:

1. **Cron задачи:**
   - Netlify Scheduled Functions имеют ограничения
   - Минимальный интервал: 1 минута
   - Для более частых задач рассмотрите внешний сервис (например, cron-job.org)

2. **Cold start:**
   - Первый запрос к function может быть медленным (cold start)
   - Последующие запросы быстрые (warm)

3. **Таймауты:**
   - Netlify Functions: 10 секунд (free), 26 секунд (pro)
   - Для длительных операций используйте фоновые задачи

4. **База данных:**
   - Убедитесь, что Supabase/PostgreSQL доступен из интернета
   - Проверьте настройки firewall

## Проверка деплоя

После деплоя проверьте:

1. **Frontend:** Откройте ваш Netlify URL
2. **API:** `https://your-site.netlify.app/api/videos`
3. **Логи:** Netlify Dashboard → Functions → Logs

## Откат деплоя

В Netlify Dashboard → Deploys:
1. Выберите предыдущий деплой
2. Нажмите "Publish deploy"

## Альтернативы

Если Netlify не подходит из-за ограничений:
- **Vercel** - похожая платформа, лучше для Next.js
- **Railway** - поддерживает полноценный Node.js
- **Render** - простой деплой с поддержкой cron
- **VPS** - полный контроль (рекомендуется для монолита)

## Troubleshooting

### Ошибка: "Function not found"
- Убедитесь, что `netlify/functions/server.ts` существует
- Проверьте, что `@netlify/functions` установлен

### Ошибка: "Database connection failed"
- Проверьте `DATABASE_URL` в переменных окружения
- Убедитесь, что база данных доступна из интернета

### Ошибка: "Build failed"
- Проверьте логи сборки в Netlify Dashboard
- Убедитесь, что все зависимости установлены

### Cold start слишком долгий
- Это нормально для serverless функций
- Рассмотрите использование VPS для постоянной работы

