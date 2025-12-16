# Анализ реализации системы категорий и фильтрации каналов

## Текущее состояние

### Структура данных
- **Каналы (`channels`)**: имеют поле `niche` (text) - простой текст без структуры
- **Видео (`videos`)**: не имеют связи с категориями
- **Переводы (`translations`)**: связаны с каналом через `channelId`, но нет фильтрации по категориям

### Проблемы
1. Поле `niche` - это просто текст, нет иерархии (тематика → подтематика)
2. При добавлении перевода показываются **все** каналы без фильтрации
3. Нет связи между видео и категориями
4. Нет умной фильтрации по языку + категории

---

## Требования к системе

### Функциональные требования
1. **Иерархия категорий**: Тематика → Подтематика (например: "Истории" → "Страшные Истории")
2. **Связь каналов с категориями**: канал может быть связан с категорией/подкатегорией
3. **Связь видео с категориями**: видео должно иметь категорию/подкатегорию
4. **Умная фильтрация**: при добавлении перевода показывать только релевантные каналы:
   - Каналы с той же категорией/подкатегорией, что и видео
   - Каналы с подходящим языком (если указан `defaultLanguage`)
5. **Множественная связь**: канал может публиковать контент из нескольких категорий (опционально)

---

## Вариант 1: Нормализованная структура с Many-to-Many (Рекомендуемый)

### Структура БД

```sql
-- Таблица категорий (тематики)
categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Таблица подкатегорий
subcategories (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Связь каналов с подкатегориями (many-to-many)
channel_subcategories (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  PRIMARY KEY (channel_id, subcategory_id)
)

-- Добавить поле в videos
ALTER TABLE videos ADD COLUMN subcategory_id UUID REFERENCES subcategories(id);
-- или для поддержки множественных категорий:
-- video_subcategories (video_id, subcategory_id) - many-to-many
```

### Преимущества
✅ Полная нормализация - нет дублирования данных  
✅ Гибкость: канал может быть в нескольких подкатегориях  
✅ Легко добавлять новые категории/подкатегории  
✅ Эффективные запросы с JOIN  
✅ Можно отслеживать статистику по категориям  

### Недостатки
❌ Более сложная структура БД  
❌ Больше JOIN-запросов  
❌ Требуется миграция данных из `niche`  

### API изменения

**Новые эндпоинты:**
```typescript
GET    /api/categories              // Список всех категорий с подкатегориями
POST   /api/categories              // Создать категорию
POST   /api/categories/:id/subcategories  // Создать подкатегорию
PATCH  /api/categories/:id          // Обновить категорию
DELETE /api/categories/:id          // Удалить категорию

GET    /api/channels?subcategoryId=xxx  // Каналы с фильтрацией
GET    /api/channels?language=ru&subcategoryId=xxx  // С фильтрацией по языку
```

**Изменения в существующих эндпоинтах:**
```typescript
POST   /api/videos
  body: { url, title, thumbnailUrl, subcategoryId }  // Добавить subcategoryId

PATCH  /api/channels/:id
  body: { ..., subcategoryIds: string[] }  // Массив ID подкатегорий

GET    /api/videos/:id/translations/suggest-channels
  query: { language, subcategoryId }
  // Умный эндпоинт для предложения каналов
```

### Frontend изменения

**1. Страница управления категориями** (`/categories`):
- Список категорий с подкатегориями (tree view)
- CRUD операции
- Drag & drop для изменения порядка (опционально)

**2. Форма добавления/редактирования канала**:
```tsx
// Заменить поле niche на Select с подкатегориями
<FormField name="subcategoryIds">
  <Select multiple>
    {categories.map(cat => (
      <OptGroup label={cat.name}>
        {cat.subcategories.map(sub => (
          <SelectItem value={sub.id}>{sub.name}</SelectItem>
        ))}
      </OptGroup>
    ))}
  </Select>
</FormField>
```

**3. Форма добавления видео**:
```tsx
<FormField name="subcategoryId">
  <Select>
    {categories.map(cat => (
      <OptGroup label={cat.name}>
        {cat.subcategories.map(sub => (
          <SelectItem value={sub.id}>{sub.name}</SelectItem>
        ))}
      </OptGroup>
    ))}
  </Select>
</FormField>
```

**4. TranslationDialog - умная фильтрация**:
```tsx
// В queue.tsx при открытии диалога
const { data: suggestedChannels } = useQuery({
  queryKey: ['/api/channels', video.subcategoryId, language],
  queryFn: () => apiRequest('GET', 
    `/api/channels?subcategoryId=${video.subcategoryId}&language=${language}`
  ),
  enabled: !!video.subcategoryId && !!language
});

// В TranslationDialog показывать только suggestedChannels
{filteredChannels.map(channel => ...)}
```

---

## Вариант 2: Денормализованная структура с JSONB

### Структура БД

```sql
-- Таблица категорий (та же, что в варианте 1)
categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  ...
)

subcategories (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  ...
)

-- В каналах хранить массив ID подкатегорий в JSONB
ALTER TABLE channels 
  ADD COLUMN subcategory_ids JSONB DEFAULT '[]'::jsonb;

-- В видео хранить ID подкатегории (или массив для множественных)
ALTER TABLE videos 
  ADD COLUMN subcategory_id UUID REFERENCES subcategories(id);
  -- или subcategory_ids JSONB для множественных

-- Индексы для JSONB запросов
CREATE INDEX idx_channels_subcategory_ids ON channels USING GIN (subcategory_ids);
```

### Преимущества
✅ Меньше JOIN-запросов (данные в одной таблице)  
✅ Быстрее чтение (меньше обращений к БД)  
✅ Проще миграция из существующего `niche`  
✅ Легко добавлять дополнительные метаданные в JSON  

### Недостатки
❌ Нарушение нормализации (дублирование данных)  
❌ Сложнее валидация целостности данных  
❌ JSONB запросы менее читаемы  
❌ Сложнее делать аналитику и отчеты  

### API изменения

**Запросы с фильтрацией:**
```typescript
// Использовать JSONB операторы PostgreSQL
GET /api/channels?subcategoryId=xxx
// SQL: WHERE subcategory_ids @> '[{"id": "xxx"}]'::jsonb

// Или более простой вариант с текстовым поиском
// Хранить как массив строк: ["subcategory-id-1", "subcategory-id-2"]
GET /api/channels?subcategoryId=xxx
// SQL: WHERE subcategory_ids ? 'xxx'  (оператор ? для проверки ключа в JSONB)
```

---

## Вариант 3: Гибридный подход (Категории нормализованы, связи через JSONB)

### Структура БД

```sql
-- Категории нормализованы (как в варианте 1)
categories (...)
subcategories (...)

-- В каналах и видео - JSONB с ID подкатегорий
ALTER TABLE channels 
  ADD COLUMN subcategory_ids JSONB DEFAULT '[]'::jsonb;

ALTER TABLE videos 
  ADD COLUMN subcategory_ids JSONB DEFAULT '[]'::jsonb;

-- Индексы
CREATE INDEX idx_channels_subcategory_ids ON channels USING GIN (subcategory_ids);
CREATE INDEX idx_videos_subcategory_ids ON videos USING GIN (subcategory_ids);
```

### Особенности
- **Категории** хранятся нормализованно (легко управлять, менять названия)
- **Связи** хранятся в JSONB (быстрый доступ, меньше JOIN)
- При запросе каналов делаем JOIN только если нужно получить названия категорий

### Преимущества
✅ Баланс между нормализацией и производительностью  
✅ Категории легко редактировать (изменения отражаются везде)  
✅ Быстрые запросы фильтрации (GIN индекс на JSONB)  
✅ Гибкость для хранения дополнительных метаданных  

### Недостатки
❌ Все еще JSONB (меньше гарантий целостности)  
❌ Нужно валидировать, что ID в JSONB существуют  

---

## Рекомендация: Вариант 1 (Нормализованная структура)

### Почему Вариант 1?

1. **Масштабируемость**: Когда каналов и видео станет много, нормализованная структура будет работать лучше
2. **Целостность данных**: Foreign Key гарантируют, что нельзя связать канал с несуществующей подкатегорией
3. **Гибкость запросов**: Легко делать сложные фильтры, агрегации, статистику
4. **Стандартный подход**: Любой разработчик поймет структуру
5. **Легкая миграция**: Можно постепенно переносить данные из `niche`

### План реализации (Вариант 1)

#### Фаза 1: Структура БД
1. Создать таблицы `categories` и `subcategories`
2. Создать таблицу `channel_subcategories` (many-to-many)
3. Добавить поле `subcategory_id` в `videos` (можно потом расширить до many-to-many)
4. Миграция данных: парсить существующий `niche` и создавать категории

#### Фаза 2: Backend API
1. CRUD эндпоинты для категорий/подкатегорий
2. Обновить `POST /api/channels` - принимать `subcategoryIds[]`
3. Обновить `POST /api/videos` - принимать `subcategoryId`
4. Создать `GET /api/channels` с query параметрами фильтрации
5. Опционально: `GET /api/translations/suggest-channels` - умный эндпоинт

#### Фаза 3: Frontend - Управление категориями
1. Новая страница `/categories` с tree view
2. Формы создания/редактирования категорий и подкатегорий

#### Фаза 4: Frontend - Интеграция
1. Обновить форму канала: Select с подкатегориями (multi-select)
2. Обновить форму видео: Select с подкатегориями
3. Обновить `TranslationDialog`: фильтрация каналов по `video.subcategoryId` + `language`

#### Фаза 5: UX улучшения
1. Показывать категорию в карточках видео
2. Фильтры на странице "Очередь" по категориям
3. Статистика по категориям (сколько видео в каждой)

---

## Пример SQL схемы (Вариант 1)

```sql
-- Категории
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Подкатегории
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(category_id, name)  -- Нельзя создать дубликаты в одной категории
);

-- Связь каналов с подкатегориями (many-to-many)
CREATE TABLE channel_subcategories (
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  PRIMARY KEY (channel_id, subcategory_id)
);

-- Добавить поле в videos
ALTER TABLE videos 
  ADD COLUMN subcategory_id UUID REFERENCES subcategories(id);

-- Индексы для производительности
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_channel_subcategories_channel_id ON channel_subcategories(channel_id);
CREATE INDEX idx_channel_subcategories_subcategory_id ON channel_subcategories(subcategory_id);
CREATE INDEX idx_videos_subcategory_id ON videos(subcategory_id);
```

---

## Пример запроса фильтрации каналов (Вариант 1)

```typescript
// GET /api/channels?subcategoryId=xxx&language=ru
// SQL:
SELECT DISTINCT c.*
FROM channels c
INNER JOIN channel_subcategories cs ON c.id = cs.channel_id
WHERE cs.subcategory_id = $1  -- subcategoryId
  AND (c.default_language = $2 OR c.default_language IS NULL)  -- language (опционально)
ORDER BY c.name;
```

---

## Вопросы для обсуждения

1. **Один канал - одна категория или несколько?**
   - Рекомендация: несколько (many-to-many), больше гибкости
   
2. **Одно видео - одна подкатегория или несколько?**
   - Рекомендация: начать с одной, потом расширить при необходимости
   
3. **Обязательно ли указывать категорию при добавлении видео?**
   - Рекомендация: сделать опциональным, но показывать предупреждение
   
4. **Что делать с существующими данными в поле `niche`?**
   - Вариант A: Парсить и автоматически создавать категории
   - Вариант B: Оставить как есть, но добавить миграционный инструмент
   
5. **Нужна ли страница управления категориями сразу или можно начать с жестко заданных?**
   - Рекомендация: начать с жестко заданных категорий для MVP, потом добавить CRUD

---

## Следующие шаги

После выбора варианта:
1. Обсудить детали реализации
2. Создать миграцию БД
3. Реализовать backend API
4. Реализовать frontend компоненты
5. Интегрировать фильтрацию в существующие формы

