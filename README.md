# YTimikD — личный органайзер переводов YouTube

Внутренний инструмент для двух ролей:

- **Куратор (друг)**: добавляет исходные видео в очередь и настраивает список языков перевода по умолчанию.
- **Публикатор (ты)**: переводит по языкам, публикует на YouTube и фиксирует результат (вставляет ссылку на опубликованное видео).

Проект: **Vite + React (frontend)** + **Express + Drizzle + PostgreSQL/Supabase (backend)**.

## Как устроен проект (структура)

```
client/                 # фронтенд (Vite + React)
  src/
    components/         # ui + layout + видео-компоненты
    pages/              # страницы (очередь, план, история, каналы, языки…)
    lib/                # провайдеры/утилиты (i18n, youtube id parsing)
server/                 # backend (Express)
shared/                 # общие типы/схемы Drizzle (таблицы)
script/build.ts         # сборка client + server в dist/
dist/                   # build output (НЕ коммитится)
STYLE_GUIDE.md          # source-of-truth по UI/UX правилам
```

## Быстрый старт (локально)

### 1) Установка

```bash
npm install
```

### 2) Переменные окружения

Создай `.env` (в Git не коммитится):

```bash
DATABASE_URL=postgresql://...
PORT=5000
```

Важно:
- Для Supabase нужен `DATABASE_URL` на Postgres.
- В коде включён SSL для Supabase (см. `server/db.ts`).

### 3) Применить схему в БД

```bash
npm run db:push
```

### 4) Запуск

```bash
npm run dev
```

Открой `http://localhost:5000`.

## Скрипты

- `npm run dev`: dev-сервер (Express + Vite dev middleware)
- `npm run build`: сборка клиента и сервера в `dist/`
- `npm run start`: запуск production сборки `dist/index.cjs`
- `npm run check`: TypeScript typecheck
- `npm run db:push`: применить Drizzle schema в базу

## База данных (Drizzle)

Источник схемы: `shared/schema.ts`.

Ключевые сущности:
- `videos`: исходные видео + статус архивации (`isArchived`, `archivedAt`, `archivedReason`)
- `translations`: строки “перевод по языку” для каждого видео
- `channels`: каналы публикации (язык/голос/пол могут подтягиваться автоматически)
- `default_languages`: список языков по умолчанию (чтобы куратор не выбирал каждый раз)
- `activity_logs`: журнал событий
- `settings`: ключ-значение настройки (YouTube API key, Telegram и т.д.)

## Основная логика (как это работает)

### Очередь
- Куратор добавляет исходное видео.
- Система автоматически создаёт `translations` для активных `default_languages`.
- В карточке видео видны языки (плашки), по клику открывается диалог перевода.

### Фиксация “опубликовано”
Правило: **если вставлена ссылка на переведённое видео (`translatedUrl`) — значит оно опубликовано**.

При сохранении `translatedUrl` сервер автоматически:
- ставит `status="completed"`
- ставит `publishedDate` (если не было)

### План (scheduled)
Если перевод готов заранее (ссылка уже известна), но публикация будет позже:
- в диалоге включается режим **“Запланировать публикацию”**
- задаются дата/время
- запись попадает в список **План** (`/scheduled`)

Технически:
- `scheduledDate` хранит момент времени (UTC), UI показывает в русском формате.
- Часовой пояс в UI фиксирован на **МСК (Europe/Moscow)** (региональные настройки удалены).
- При `scheduledDate` в будущем `publishedDate` остаётся `null`.

### История (по видео)
Страница **История** (`/history`) показывает **группы по исходному видео**:
- превью и заголовок — от оригинала
- внутри раскрытия — опубликованные языки с ссылкой и временем публикации

### Архив (ручной)
Ручная отмена/архивация видео отправляет его в **Архив** (`/archive`) и отмечает `archivedReason="manual"`.

## YouTube утилиты

### Скачать превью (макс. качество)
- UI: кнопка на карточке видео в очереди.
- API: `GET /api/youtube/thumbnail?videoId=...`
  - пробует `maxresdefault → sddefault → hqdefault → mqdefault`
  - отдаёт файл как `attachment`

### Автополучение названия
`GET /api/youtube/video-info?videoId=...` — требует настроенный `youtubeApiKey` в `/settings`.

## Cron / уведомления

В `server/index.ts` настроен cron (каждые 5 минут) для проверки запланированных публикаций/уведомлений (см. `server/telegram.ts`).

> Для деплоя на Vercel это нужно выносить во внешний планировщик (Supabase Scheduled Trigger / отдельный worker), потому что Vercel не держит постоянно работающий процесс.

## Деплой (GitHub → Vercel)

Этот репозиторий — монолит (frontend + backend). На Vercel корректно деплоить **frontend**, а backend держать отдельно (Render/Railway/VPS) и проксировать `/api/*`.

## Стиль/правила UI

Источник правил: `STYLE_GUIDE.md`.

Дополнительно:
- Primary-кнопки используют **бренд‑градиент** (см. `client/src/index.css` переменные `--brand-*`).

