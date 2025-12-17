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
│   ├── PROJECT_STATE.md             # Текущее состояние проекта (архитектура/изменения)
│   ├── UX_UI_UPGRADE_PROPOSAL.md    # План улучшений UI/UX (фазы)
│   ├── UI_DESIGN_REDESIGN_PROPOSAL.md # Полный план редизайна UI (варианты + план внедрения)
│   ├── ARCHIVE_SCHEDULED_ANALYSIS.md  # Анализ логики/дизайна Архива и Плана
│   ├── IMPROVEMENTS.md              # Идеи/бэклог улучшений
│   ├── CATEGORIES_IMPLEMENTATION_ANALYSIS.md # Анализ/реализация категорий
│   ├── CATEGORIES_UX_IMPROVEMENTS.md         # UX улучшения категорий
│   ├── CATEGORIES_REDESIGN_PLAN.md           # План редизайна страницы категорий
│   ├── CATEGORIES_DEEP_ANALYSIS.md           # Глубокий анализ дизайна категорий
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
└── STYLE_GUIDE.md                   # Source-of-truth по UI/UX правилам
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
- `videos`: исходные видео + статус архивации + связь с подкатегориями (`subcategoryId`)
- `translations`: строки "перевод по языку" для каждого видео
- `channels`: каналы публикации (язык/голос/пол могут подтягиваться автоматически) + связь с подкатегориями (many-to-many)
- `categories`: категории (тематики)
- `subcategories`: подкатегории (связаны с категориями)
- `channel_subcategories`: связь каналов с подкатегориями (many-to-many)
- `default_languages`: список языков по умолчанию (чтобы куратор не выбирал каждый раз)
- `activity_logs`: журнал событий
- `settings`: ключ-значение настройки (YouTube API key, Telegram и т.д.)

## Основная логика (как это работает)

### Очередь
- Куратор добавляет исходное видео (с опциональной подкатегорией).
- Система автоматически создаёт `translations` для активных `default_languages`.
- В карточке видео видны:
  - Превью на всю ширину (16:9)
  - Прогресс-бар переводов (X/Y готово)
  - Группированные badges по статусу (готово/в работе/не начато)
  - Индивидуальные чипы языков с индикаторами срочности
  - Категория/подкатегория как badge
- По клику на языковой чип открывается диалог перевода (с умной фильтрацией каналов по подкатегории и языку).

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
- В **Плане** нет отдельного “просрочено”: это список для отслеживания запланированных публикаций.

### История (по видео)
Страница **История** (`/history`) показывает **группы по исходному видео**:
- превью и заголовок — от оригинала
- внутри раскрытия — опубликованные языки с ссылкой и временем публикации

### Архив (ручной)
Ручная отмена/архивация видео отправляет его в **Архив** (`/archive`) и отмечает `archivedReason="manual"`.
Архив отображается карточками в сетке (как современная “галерея”), чтобы быстрее сканировать список.

## YouTube утилиты

### Скачать превью (макс. качество)
- UI: кнопка на карточке видео в очереди.
- API: `GET /api/youtube/thumbnail?videoId=...`
  - пробует `maxresdefault → sddefault → hqdefault → mqdefault`
  - отдаёт файл как `attachment`

### Автополучение названия
`GET /api/youtube/video-info?videoId=...` — требует настроенный `youtubeApiKey` в `/settings`.

## Cron / уведомления

В `server/index.ts` настроен cron (каждую минуту) для проверки запланированных публикаций/уведомлений (см. `server/telegram.ts`).

> ⚠️ **Важно для Vercel**: Vercel не держит постоянно работающий процесс, поэтому cron нужно выносить во внешний планировщик (Supabase Scheduled Trigger / отдельный worker / отдельный VPS).

## Деплой

Проект — монолит (frontend + backend в одном репозитории). Есть два основных варианта деплоя:

### Вариант 1: VPS (рекомендуется для полного монолита)

Идеально подходит, если нужен **один сервер** для всего (frontend + backend + cron).

#### Требования

- VPS с Ubuntu/Debian (или другой Linux дистрибутив)
- Node.js 20+ и npm
- PostgreSQL/Supabase (или другой PostgreSQL-совместимый сервер)
- Доменное имя (опционально, для SSL)

#### Шаги деплоя

**1. Подготовка сервера**

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PM2 для управления процессом (опционально, но рекомендуется)
sudo npm install -g pm2
```

**2. Клонирование и настройка проекта**

```bash
# Клонирование репозитория
git clone https://github.com/Evilcorp3301/ytimikd.git
cd ytimikd

# Установка зависимостей
npm install

# Создание .env файла
nano .env
```

В `.env` укажи:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
PORT=5000
```

> 💡 **Важно**: Если пароль содержит спецсимволы (`@`, `!`, `#`, `/`, `:`), их нужно URL-кодировать (см. `docs/DB_SETUP.md`).

**3. Применение схемы БД**

```bash
npm run db:push
```

**4. Сборка проекта**

```bash
npm run build
```

Это создаст:
- `dist/index.cjs` — скомпилированный сервер
- `dist/public/` — собранный frontend (Vite build)

**5. Запуск через PM2**

```bash
# Запуск приложения
pm2 start dist/index.cjs --name ytimikd

# Сохранение конфигурации PM2
pm2 save
pm2 startup  # выполни команду, которую выведет PM2

# Просмотр логов
pm2 logs ytimikd

# Перезапуск после изменений
pm2 restart ytimikd
```

**6. Настройка Nginx (reverse proxy)**

Установи Nginx:

```bash
sudo apt install -y nginx
```

Создай конфигурацию `/etc/nginx/sites-available/ytimikd`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # или IP адрес

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активируй конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/ytimikd /etc/nginx/sites-enabled/
sudo nginx -t  # проверка конфигурации
sudo systemctl restart nginx
```

**7. SSL через Let's Encrypt (опционально, но рекомендуется)**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot автоматически обновит конфигурацию Nginx и настроит автообновление сертификата.

**8. Обновление после изменений**

```bash
cd /path/to/ytimikd
git pull
npm install
npm run build
pm2 restart ytimikd
```

---

### Вариант 2: Vercel (frontend) + отдельный backend

Подходит, если хочешь использовать Vercel для frontend, а backend держать на VPS/Railway/Render.

#### Frontend на Vercel

**1. Подключение репозитория к Vercel**

1. Зайди на [vercel.com](https://vercel.com)
2. Импортируй репозиторий `Evilcorp3301/ytimikd`
3. В настройках проекта укажи:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (корень репозитория)
   - **Build Command**: `npm install && npm run build` (собирает и client, и server, но нужен только client)
   - **Output Directory**: `dist/public` (только собранный frontend)

   > ⚠️ **Важно**: Vercel будет собирать весь проект, но использует только `dist/public`. Backend (`dist/index.cjs`) не нужен на Vercel.

**2. Настройка API проксирования**

Клиент использует относительные пути (`/api/...`), поэтому нужно настроить проксирование запросов к API на backend сервер.

Создай файл `vercel.json` в корне проекта:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-url.com/api/:path*"
    }
  ]
}
```

Замени `your-backend-url.com` на реальный URL твоего backend сервера (например, `api.your-domain.com` или IP адрес VPS).

**Альтернатива**: Настрой проксирование на уровне Nginx backend сервера (см. раздел "Backend на VPS" ниже).

#### Backend на VPS (или Railway/Render)

Задéй backend так же, как в **Варианте 1**, но:

- Используй домен, например `api.your-domain.com`
- Настрой CORS в `server/routes.ts` для разрешения запросов с Vercel домена
- Если используешь Nginx, добавь заголовки CORS:

```nginx
location /api/ {
    proxy_pass http://localhost:5000;
    # ... остальные proxy_set_header (как выше)
    
    # CORS заголовки
    add_header 'Access-Control-Allow-Origin' 'https://your-vercel-app.vercel.app' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PATCH, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

**Важно**: На Vercel **cron не работает** (нет постоянно работающего процесса). Для проверки scheduled переводов используй один из вариантов:

1. **Отдельный VPS worker** с cron-задачей, которая вызывает API endpoint
2. **Supabase Scheduled Functions** (если используешь Supabase)
3. **GitHub Actions** с расписанием (бесплатно для публичных реп)

---

### Сравнение вариантов

| Характеристика | VPS (монолит) | Vercel + Backend |
|---|---|---|
| Простота настройки | ⭐⭐⭐ Средняя | ⭐⭐ Сложная |
| Стоимость | ⭐⭐⭐ От $5/мес | ⭐⭐⭐⭐ Vercel бесплатно, backend от $5/мес |
| Cron поддержка | ✅ Да (встроено) | ❌ Нет (нужен внешний) |
| Масштабирование | ⭐⭐ Ручное | ⭐⭐⭐⭐ Автоматическое |
| Производительность | ⭐⭐⭐⭐ Высокая | ⭐⭐⭐ Хорошая |
| Рекомендация | Для старта и малого трафика | Для production с высоким трафиком |

## Стиль/правила UI

Источник правил: `STYLE_GUIDE.md`.

Дополнительно:
- Primary-кнопки используют **бренд‑градиент** (см. `client/src/index.css` переменные `--brand-*`).
- Принят **гибридный редизайн** (glassmorphism + микроанимации) и внедрён по этапам:
  - **Фаза 1**: `Dialog`/`AlertDialog` (glassmorphism), `Card` (hover/тени), `Button` (микроанимации).
  - **Фаза 2**: `Input`/`Textarea`/`Select`/`Checkbox` (плавные переходы, мягкий focus ring, лёгкий blur в попапах).

