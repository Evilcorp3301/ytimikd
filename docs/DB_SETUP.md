# Подключение базы данных (Supabase / Postgres)

Этот файл — **единственная инструкция**, по которой нужно подключать базу данных к проекту `ytimikd`.
Можно дать ассистенту задачу: **«Открой `docs/DB_SETUP.md` и подключись к базе по инструкции»**.

## Что важно знать

- Приложение использует переменную окружения **`DATABASE_URL`**.
- При наличии `DATABASE_URL` сервер использует **Postgres (DatabaseStorage)**.
- При отсутствии `DATABASE_URL` сервер запускается в **MemoryStorage** (данные не сохраняются между рестартами).
- Supabase часто требует **SSL**, это уже учтено в `server/db.ts`.

## Шаг 1 — Создать `.env` в корне проекта

Создайте файл:

- `D:\\CursorSite\\ytimikd\\.env` (Windows)

Содержимое:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
PORT=5000
```

> **Важно**: `.env` не коммитится. В репозитории хранится только эта инструкция.

## Шаг 2 — Вставить строку подключения Supabase

В Supabase:

- Project → **Settings** → **Database** → **Connection string** → вкладка **URI**

Получится строка вида:

```text
postgresql://postgres:YOUR_PASSWORD@aws-1-...pooler.supabase.com:5432/postgres
```

### ВАЖНО: URL-encoding пароля

Если пароль содержит спецсимволы, их нужно **URL-encoded** внутри URI (иначе строка ломается).
Частые замены:

- `@` → `%40`
- `!` → `%21`
- `#` → `%23`
- `/` → `%2F`
- `:` → `%3A`

Пример:

```text
password: Qwaszx12@@!!00
в URI:    Qwaszx12%40%40%21%2100
```

## Шаг 3 — Применить схему Drizzle (один раз на пустой базе)

```bash
npm run db:push
```

## Шаг 4 — Запуск

```bash
npm run dev
```

Откройте: `http://localhost:5000`

## Как проверить, что реально подключились к БД (а не к памяти)

1) В логах запуска сервера должно быть:

```text
[storage] Using DatabaseStorage (DATABASE_URL present, length=...)
```

2) Быстрая проверка персистентности:

- Запишите маркер в settings:

```bash
node -e "fetch('http://localhost:5000/api/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({persistMarker:Date.now()})}).then(r=>r.json()).then(console.log)"
```

- Перезапустите сервер
- Прочитайте settings:

```bash
node -e "fetch('http://localhost:5000/api/settings').then(r=>r.json()).then(console.log)"
```

Если `persistMarker` сохранился — вы точно на Postgres.


