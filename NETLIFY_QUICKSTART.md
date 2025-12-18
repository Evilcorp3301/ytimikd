# Быстрый старт: Деплой на Netlify

## Шаги

### 1. Подготовка
```bash
npm install
npm run build
```

### 2. Настройка в Netlify Dashboard

1. **Подключите репозиторий:**
   - Зайдите на [app.netlify.com](https://app.netlify.com)
   - "Add new site" → "Import an existing project"
   - Выберите GitHub и ваш репозиторий

2. **Настройки сборки:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/public`

3. **Переменные окружения:**
   - Site settings → Environment variables
   - Добавьте обязательные:
     ```
     DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
     NODE_ENV=production
     ```
   - **API ключи** (для Telegram уведомлений и YouTube функций):
     ```
     TELEGRAM_BOT_ID=your_telegram_bot_token
     TELEGRAM_CHAT_ID=your_telegram_chat_id
     YOU_TUBE_API=your_youtube_api_key
     ```

4. **Scheduled Functions (опционально):**
   - Functions → Scheduled functions
   - Добавьте функцию `scheduled-check`
   - Schedule: `* * * * *` (каждую минуту)

### 3. Деплой

Netlify автоматически деплоит при каждом push в `main`.

Или нажмите "Deploy site" для первого деплоя.

## Проверка

После деплоя проверьте:
- Frontend: `https://your-site.netlify.app`
- API: `https://your-site.netlify.app/api/videos`
- Логи: Netlify Dashboard → Functions → Logs

## Подробная документация

См. [docs/NETLIFY_DEPLOY.md](docs/NETLIFY_DEPLOY.md)

