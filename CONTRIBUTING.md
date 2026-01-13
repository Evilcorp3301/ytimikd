# Руководство для разработчиков

Спасибо за интерес к проекту! Это руководство поможет вам начать работу.

## Разработка

### Требования

- Node.js 20+ (см. `.nvmrc`)
- npm

### Установка

```bash
# Установка зависимостей
npm install

# Применение схемы базы данных
npm run db:push
```

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5000`

### Проверка кода

Перед коммитом убедитесь, что код проходит все проверки:

```bash
# Проверка типов TypeScript
npm run typecheck

# Линтинг
npm run lint

# Форматирование (проверка)
npm run format:check

# Или исправить автоматически
npm run lint:fix
npm run format
```

## Коммиты

Проект использует [Conventional Commits](https://www.conventionalcommits.org/) для стандартизации сообщений коммитов.

### Формат

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Типы коммитов

- `feat`: Новая функциональность
- `fix`: Исправление бага
- `docs`: Изменения в документации
- `style`: Изменения форматирования (не влияющие на код)
- `refactor`: Рефакторинг кода
- `perf`: Улучшение производительности
- `test`: Добавление или изменение тестов
- `build`: Изменения в системе сборки
- `ci`: Изменения в CI/CD
- `chore`: Прочие изменения
- `revert`: Откат предыдущего коммита

### Примеры

```bash
git commit -m "feat: add video search functionality"
git commit -m "fix: resolve thumbnail loading issue"
git commit -m "docs: update README with installation instructions"
git commit -m "refactor: simplify video card component"
git commit -m "chore: update dependencies"
```

## Pull Requests

1. Создайте ветку от `main`
2. Внесите изменения
3. Убедитесь, что все проверки проходят (`npm run ci`)
4. Создайте Pull Request с описанием изменений
5. Дождитесь review

### Структура Pull Request

- **Заголовок**: Краткое описание изменения
- **Описание**: Детальное описание того, что изменилось и почему
- **Тип**: Укажите тип изменения (feat, fix, refactor, etc.)

## Стиль кода

Проект использует:

- **ESLint** для линтинга
- **Prettier** для форматирования
- **TypeScript** для типизации

Код автоматически форматируется при коммите через Husky hooks.

### Ручное форматирование

```bash
# Форматировать все файлы
npm run format

# Проверить форматирование
npm run format:check
```

## База данных

### Миграции

При изменении схемы базы данных:

```bash
# Применить изменения схемы
npm run db:push
```

### Схема

Схема базы данных определена в `shared/schema.ts` и управляется через Drizzle ORM.

## Структура проекта

- `client/` - Frontend приложение (React)
- `server/` - Backend приложение (Express)
- `shared/` - Общий код (схемы, типы)
- `script/` - Вспомогательные скрипты
- `netlify/` - Netlify Functions

## Вопросы?

Если у вас есть вопросы, создайте Issue в репозитории.
