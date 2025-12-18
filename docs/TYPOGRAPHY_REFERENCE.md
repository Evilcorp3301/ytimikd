# Справочник типографики проекта

## Основные классы типографики (из `typography.css`)

### Заголовки

| Класс | Размер | Начертание | Использование |
|-------|--------|------------|---------------|
| `.text-heading-1` | **18px** (`text-lg`) | `font-semibold` | Заголовки страниц (Header) |
| `.text-heading-2` | **16px** (`text-base`) | `font-semibold` | Заголовки карточек (CardTitle) |
| `.text-heading-3` | **14px** (`text-sm`) | `font-semibold` | Подзаголовки, заголовки секций |

### Основной текст

| Класс | Размер | Начертание | Использование |
|-------|--------|------------|---------------|
| `.text-body` | **14px** (`text-sm`) | `font-normal` | Основной текст, содержимое форм (Input, Select) |

### Вторичный текст

| Класс | Размер | Начертание | Использование |
|-------|--------|------------|---------------|
| `.text-hint` | **12px** (`text-xs`) | `font-normal` | Описания страниц, подсказки, метаданные (CardDescription, FormDescription) |

### Специальные классы

| Класс | Размер | Начертание | Использование |
|-------|--------|------------|---------------|
| `.text-error` | **14px** (`text-sm`) | `font-medium` | Текст ошибок (FormMessage) |
| `.text-button` | **14px** (`text-sm`) | `font-normal` | Текст кнопок (Button) |
| `.text-nav` | **14px** (`text-sm`) | `font-normal` | Навигация (Sidebar) |
| `.text-number` | - | `tabular-nums` | Числа для выравнивания (только стиль, без размера) |

### Дополнительные классы

| Класс | Размер | Начертание | Использование |
|-------|--------|------------|---------------|
| `.placeholder-muted` | - | - | Placeholder для полей ввода (только цвет) |

## Компоненты UI

### Label / FormLabel
- **Размер**: **14px** (`text-sm`)
- **Начертание**: `font-medium`
- **Использование**: Лейблы полей форм

### Button
- **Размер текста**: **14px** (`text-button` = `text-sm`)
- **Варианты размеров**:
  - `default`: `min-h-[var(--button-height)]` (32px)
  - `sm`: `min-h-[var(--button-height-sm)]` (28px) + `text-xs`
  - `lg`: `min-h-[var(--button-height-lg)]` (40px)
  - `icon`: `h-[var(--button-height)] w-[var(--button-height)]` (32x32px)

### Input / Select
- **Размер текста**: **14px** (`text-body` = `text-sm`)
- **Высота**: `h-[var(--input-height)]`

## Иерархия размеров

```
18px (text-lg)    → text-heading-1  [Заголовки страниц]
16px (text-base)  → text-heading-2  [Заголовки карточек]
14px (text-sm)    → text-heading-3  [Подзаголовки]
14px (text-sm)    → text-body       [Основной текст]
14px (text-sm)    → text-button     [Кнопки]
14px (text-sm)    → text-nav        [Навигация]
14px (text-sm)    → Label           [Лейблы форм]
14px (text-sm)    → text-error      [Ошибки]
12px (text-xs)    → text-hint       [Подсказки, описания]
```

## Tailwind размеры (справочно)

- `text-xs` = 12px
- `text-sm` = 14px
- `text-base` = 16px
- `text-lg` = 18px
- `text-xl` = 20px
- `text-2xl` = 24px
- `text-3xl` = 30px

## Рекомендации по использованию

1. **Заголовки страниц**: используйте `.text-heading-1`
2. **Заголовки карточек**: используйте `.text-heading-2` (CardTitle)
3. **Подзаголовки**: используйте `.text-heading-3`
4. **Описания**: используйте `.text-hint`
5. **Лейблы форм**: используйте `FormLabel` (автоматически применяет правильный размер)
6. **Основной текст**: используйте `.text-body` или просто `text-sm`
7. **Кнопки**: используйте `Button` компонент (автоматически применяет `.text-button`)

## Примечания

- Все размеры указаны для базового размера шрифта (обычно 14px)
- `text-number` не задает размер, только стиль `tabular-nums` для выравнивания чисел
- `placeholder-muted` не задает размер, только цвет для placeholder текста

