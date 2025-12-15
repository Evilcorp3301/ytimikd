# Horizons - Translation Management Dashboard

## Overview

A translation management dashboard for tracking and managing video translations across multiple languages and channels. The application enables users to add videos, assign translations to different language channels, schedule publishing dates, and monitor translation progress through various workflow states.

## User Preferences

Preferred communication style: Simple, everyday language.
Default theme: Dark mode
UI Language: Russian

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state management with caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode by default)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API endpoints under `/api/*`
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod

### Data Layer
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` contains all table definitions and relations
- **Key Entities**: Videos, Channels, Translations, Default Languages, Activity Logs, Settings
- **Migrations**: Managed via Drizzle Kit (`npm run db:push`)

### Project Structure
```
├── client/src/          # React frontend application
│   ├── components/      # UI components (layout, ui, videos)
│   ├── pages/           # Route page components
│   ├── hooks/           # Custom React hooks
│   ├── i18n/            # Internationalization files (en.json, ru.json)
│   └── lib/             # Utilities and providers
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations layer
│   └── db.ts            # Database connection
├── shared/              # Shared code between client/server
│   └── schema.ts        # Drizzle schema definitions
└── attached_assets/     # Reference images and assets
```

### Key Design Patterns
- **Storage Abstraction**: `server/storage.ts` provides an interface layer between routes and database
- **Shared Types**: Schema types are generated and shared between frontend and backend
- **Component Composition**: UI built with composable shadcn/ui components
- **Path Aliases**: `@/` maps to client/src, `@shared/` maps to shared directory

## Color Scheme (Dark Mode)
- Background: #0d0d0d (hsl(0, 0%, 5%))
- Sidebar: #121212 (hsl(0, 0%, 7%))
- Cards: #141414 (hsl(0, 0%, 8%))
- Primary/Accent: #7c3aed (Purple/Violet - hsl(263, 70%, 50%))
- Text: #f2f2f2 (hsl(0, 0%, 95%))
- Muted text: #8c8c8c (hsl(0, 0%, 55%))

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Query builder and schema management

### UI/Frontend Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **date-fns**: Date manipulation and formatting

### Build Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **TypeScript**: Type checking across the stack

---

## Supabase Integration Guide

### Подготовка к подключению Supabase

Проект уже настроен для работы с PostgreSQL через переменную окружения `DATABASE_URL`. Для подключения Supabase нужно выполнить следующие шаги:

### Шаг 1: Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com) и войдите в аккаунт
2. Нажмите "New Project"
3. Выберите организацию и введите название проекта
4. Выберите регион (ближайший к вашим пользователям)
5. Создайте надёжный пароль для базы данных (сохраните его!)
6. Нажмите "Create new project"
7. Дождитесь создания проекта (1-2 минуты)

### Шаг 2: Получение строки подключения

1. В панели управления Supabase перейдите в **Settings** (шестерёнка внизу слева)
2. Выберите **Database** в боковом меню
3. Найдите раздел **Connection string**
4. Выберите вкладку **URI**
5. Скопируйте строку подключения

Строка будет выглядеть примерно так:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

Замените `[YOUR-PASSWORD]` на пароль, который вы создали при создании проекта.

### Шаг 3: Настройка переменной окружения в Replit

1. В Replit откройте вкладку **Secrets** (иконка замка в левой панели)
2. Найдите переменную `DATABASE_URL`
3. Замените её значение на строку подключения Supabase
4. Сохраните изменения

### Шаг 4: Создание таблиц в базе данных

После настройки `DATABASE_URL` выполните команду для создания таблиц:

```bash
npm run db:push
```

Это создаст все необходимые таблицы в вашей базе данных Supabase.

### Шаг 5: Перезапуск приложения

После настройки базы данных перезапустите приложение, чтобы изменения вступили в силу.

### Важные примечания

- **Безопасность**: Никогда не публикуйте строку подключения в открытом доступе
- **Pooling**: Для продакшена рекомендуется использовать Connection Pooling (порт 6543 вместо 5432)
- **Резервные копии**: Supabase автоматически создаёт резервные копии данных на платных планах
- **RLS (Row Level Security)**: При необходимости можно настроить политики безопасности на уровне строк в панели Supabase

### Дополнительные функции Supabase

После подключения базы данных вы можете использовать дополнительные функции Supabase:

1. **Table Editor**: Визуальный редактор таблиц прямо в панели Supabase
2. **SQL Editor**: Выполнение SQL-запросов напрямую
3. **Realtime**: Подписка на изменения в базе данных в реальном времени
4. **Edge Functions**: Серверные функции для дополнительной логики
5. **Storage**: Хранение файлов и изображений

---

## Recent Changes

- Restructured project from nested directories to root level
- Updated app name to "Horizons"
- Applied dark theme by default with violet accent color
- Updated Russian translations to match reference screenshots
- Configured database schema with Drizzle ORM
- Added Supabase integration documentation
