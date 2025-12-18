# Карта проекта - Анализ для очистки

## Точки входа
- **Frontend**: `client/src/main.tsx` → `client/src/App.tsx`
- **Backend**: `server/index.ts`

## Текущие роуты страниц (из App.tsx)
1. `/` - QueuePage (очередь переводов)
2. `/add-video` - AddVideoPage
3. `/history` - HistoryPage
4. `/scheduled` - ScheduledPage
5. `/channels` - ChannelsPage
6. `/languages` - LanguagesPage
7. `/categories` - CategoriesPage
8. `/activity` - ActivityPage
9. `/settings` - SettingsPage
10. `*` - NotFound (404)

## Страницы, НЕ подключенные в роутере
- `dashboard.tsx` - НЕ используется в роутере, НЕ импортируется в App.tsx

## Основные API вызовы (из routes.ts)
- `/api/videos` - GET, POST, PATCH, DELETE
- `/api/channels` - GET, POST, PATCH, DELETE
- `/api/translations` - GET, POST, PATCH, DELETE
- `/api/languages` - GET, POST, PUT, PATCH, DELETE, PUT /reorder
- `/api/categories` - GET, POST, PATCH, DELETE, GET /stats
- `/api/subcategories` - GET, POST, PATCH, DELETE
- `/api/activity-logs` - GET, DELETE
- `/api/settings` - GET, PUT
- `/api/statistics` - GET (проверить использование)
- `/api/search` - GET
- `/api/youtube/video-info` - GET
- `/api/youtube/thumbnail` - GET

## Критические сценарии
1. Добавить видео (add-video)
2. Открыть перевод (queue → translation-dialog)
3. История (history)
4. Настройки (settings)
5. Очередь переводов (queue)

## Компоненты UI (проверить использование)
- accordion, aspect-ratio, avatar, breadcrumb, calendar, chart, collapsible, hover-card, pagination, scroll-area, sheet, tabs

## Хуки
- use-mobile.tsx
- use-toast.ts

## Утилиты
- youtube.ts (extractYouTubeVideoId)
- utils.ts (cn)

