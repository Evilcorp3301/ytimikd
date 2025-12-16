# YTimikD — личный органайзер переводов YouTube

Внутренний инструмент для двух ролей:

- **Куратор (друг)**: добавляет исходные видео в очередь и настраивает список языков перевода по умолчанию.
- **Публикатор (ты)**: переводит по языкам, публикует на YouTube и фиксирует результат (вставляет ссылку на опубликованное видео).

Проект: **Vite + React (frontend)** + **Express + Drizzle + PostgreSQL/Supabase (backend)**.

## Как устроен проект (структура)

### Полная структура директорий проекта

```
ytimikd/
├── client/                          # Frontend (Vite + React + TypeScript)
│   ├── index.html                   # HTML entry point
│   ├── public/                      # Статические ресурсы
│   │   └── favicon.png
│   └── src/
│       ├── main.tsx                 # React entry point
│       ├── App.tsx                  # Root component + routing
│       ├── index.css                # Глобальные стили + CSS переменные (бренд-градиент)
│       ├── components/              # React компоненты
│       │   ├── layout/              # Layout компоненты (header, sidebar, mobile-nav)
│       │   ├── ui/                  # shadcn/ui компоненты (button, card, dialog, etc.)
│       │   └── videos/              # Компоненты для работы с видео
│       │       ├── video-card.tsx
│       │       ├── translation-dialog.tsx
│       │       └── edit-video-dialog.tsx
│       ├── pages/                   # Страницы приложения
│       │   ├── queue.tsx            # Очередь переводов
│       │   ├── scheduled.tsx        # План публикаций
│       │   ├── history.tsx          # История опубликованных
│       │   ├── archive.tsx          # Архив (отменённые/архивированные)
│       │   ├── channels.tsx         # Управление каналами YouTube
│       │   ├── languages.tsx        # Языки по умолчанию
│       │   ├── settings.tsx         # Настройки (API ключи, тема)
│       │   ├── activity.tsx         # Лог активности
│       │   ├── statistics.tsx       # Статистика
│       │   ├── add-video.tsx        # Форма добавления видео
│       │   └── not-found.tsx        # 404 страница
│       ├── lib/                     # Провайдеры и утилиты
│       │   ├── theme-provider.tsx   # Темная/светлая тема
│       │   ├── language-provider.tsx
│       │   ├── queryClient.ts       # TanStack Query конфигурация
│       │   ├── utils.ts             # Вспомогательные функции
│       │   └── youtube.ts           # Парсинг YouTube ID и утилиты
│       ├── hooks/                   # React hooks
│       │   ├── use-mobile.tsx
│       │   └── use-toast.ts
│       └── i18n/                    # Интернационализация
│           ├── index.ts
│           └── ru.json              # Русские переводы
│
├── server/                          # Backend (Express + Node.js)
│   ├── index.ts                     # Главный файл сервера (Express app + cron)
│   ├── routes.ts                    # API routes (videos, translations, channels, etc.)
│   ├── db.ts                        # Drizzle ORM connection (PostgreSQL/Supabase)
│   ├── storage.ts                   # Storage abstraction (выбор между DB/Memory)
│   ├── storage.database.ts          # DatabaseStorage (Drizzle ORM)
│   ├── storage.memory.ts            # MemoryStorage (для dev без БД)
│   ├── static.ts                    # Статические файлы (serving client/dist)
│   ├── vite.ts                      # Vite dev middleware
│   └── telegram.ts                  # Telegram уведомления + проверка scheduled
│
├── shared/                          # Общий код (frontend + backend)
│   └── schema.ts                    # Drizzle schema (таблицы: videos, translations, etc.)
│
├── script/                          # Скрипты сборки
│   └── build.ts                     # Сборка client + server → dist/
│
├── docs/                            # Документация
│   ├── DB_SETUP.md                  # Инструкция подключения БД (Supabase)
│   └── env.example.txt              # Пример .env файла
│
├── dist/                            # Build output (НЕ коммитится, в .gitignore)
│   ├── index.cjs                    # Compiled server
│   └── public/                      # Compiled client (Vite build)
│
├── node_modules/                    # Зависимости (НЕ коммитится)
│
├── .env                             # Переменные окружения (НЕ коммитится)
├── .gitignore                       # Git ignore правила
│
├── package.json                     # npm dependencies + scripts
├── package-lock.json                # Lock file
├── tsconfig.json                    # TypeScript конфигурация
├── vite.config.ts                   # Vite конфигурация (aliases, build)
├── tailwind.config.ts               # Tailwind CSS конфигурация
├── postcss.config.js                # PostCSS конфигурация
├── drizzle.config.ts                # Drizzle ORM конфигурация
├── components.json                  # shadcn/ui конфигурация
│
├── README.md                        # Основная документация проекта
├── STYLE_GUIDE.md                   # Source-of-truth по UI/UX правилам
└── design_guidelines.md             # Дополнительные гайдлайны дизайна
```

### Ключевые особенности структуры

- **Монолитная архитектура**: frontend и backend в одном репозитории, shared код в `shared/`.
- **TypeScript везде**: все файлы `.ts`/`.tsx`, единый `tsconfig.json`.
- **Drizzle ORM**: схема БД в `shared/schema.ts`, используется и на клиенте (типы) и на сервере.
- **Storage abstraction**: `server/storage.ts` автоматически выбирает `DatabaseStorage` (если есть `DATABASE_URL`) или `MemoryStorage` (для dev без БД).
- **shadcn/ui**: все UI компоненты в `client/src/components/ui/`, настраиваются через `components.json`.

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

