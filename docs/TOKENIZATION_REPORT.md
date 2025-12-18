# Отчет по токенизации стилей

## Выполненные шаги

### ✅ ШАГ 0: Базовая проверка сборки
- Проект собирается без ошибок TypeScript
- UI доступен локально

### ✅ ШАГ 2: Добавление TO-BE токенов

#### A) SPACING SCALE
Добавлены токены:
- `--space-0`: 0px
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px

#### B) RADIUS
Добавлен токен:
- `--radius-pill`: 9999px (для чипов)

#### C) CONTROL SIZES
Добавлены токены:
- `--control-checkbox`: 16px
- `--control-switch-track-h`: 24px
- `--control-switch-track-w`: 44px
- `--control-switch-thumb`: 20px
- `--chip-height`: 28px

#### D) STATUS COLORS
Добавлены токены для LanguageChip статусов:
- `--status-planned-bg/fg/border` (light/dark)
- `--status-progress-bg/fg/border` (light/dark)
- `--status-done-bg/fg/border` (light/dark)
- `--status-scheduled-bg/fg/border` (light/dark)

#### E) TYPOGRAPHY
Добавлен класс:
- `.text-status`: 10px, leading-none, font-medium (для мелких статус-лейблов)
- `.text-label`: 14px, font-medium, leading-none (для лейблов форм и заголовков таблиц)

#### F) TAILWIND CONFIG
Добавлены mapping для:
- `status.planned/progress/done/scheduled` с `DEFAULT`, `fg`, `border`
- `borderRadius.pill`

### ✅ ШАГ 3: Миграция LanguageChip
- Заменен `text-[10px]` → `text-status`
- Заменены жесткие цвета (`bg-blue-50/text-blue-700/...`) → `bg-status-*/text-status-*-fg/border-status-*-border`
- Привязана высота к `--chip-height`
- Padding/radius через токены: `px-[var(--space-3)] py-[var(--space-1)]`, `rounded-[var(--radius-pill)]`

### ✅ ШАГ 4: Badge токенизация
- `px-2.5 py-0.5` → `px-[var(--space-2)] py-[var(--space-1)]`
- `rounded-md` → `rounded-[var(--radius-sm)]`

### ✅ ШАГ 5: Checkbox и Switch
- Checkbox: `h-4 w-4` → `h-[var(--control-checkbox)] w-[var(--control-checkbox)]`
- Switch track: `h-6 w-11` → `h-[var(--control-switch-track-h)] w-[var(--control-switch-track-w)]`
- Switch thumb: `h-5 w-5` → `h-[var(--control-switch-thumb)] w-[var(--control-switch-thumb)]`

### ✅ ШАГ 6: Popover/Tooltip
- Popover: `p-4` → `p-[var(--space-4)]`
- Tooltip: `px-3 py-1.5` → `px-[var(--space-3)] py-[var(--space-2)]`
- Tooltip: `text-sm` → `text-hint` (семантически правильно для подсказок)

### ✅ ШАГ 7: TableHead/Label
- TableHead: `px-4` → `px-[var(--space-4)]`, `font-medium` → `text-label`
- TableCell: `p-4` → `p-[var(--space-4)]`
- Label: `text-sm font-medium` → `text-label`

### ✅ ШАГ 8: Финальная чистка
Заменены оставшиеся "магические" значения:
- `px-2.5/py-0.5/py-1.5` → `px-[var(--space-*)]/py-[var(--space-*)]`
- `bg-*-50/text-*-700` в video-card.tsx → `bg-status-*/text-status-*-fg`
- `text-[0.8rem]` в calendar.tsx → `text-hint`

## Внедренные токены

### Spacing
- `--space-0` до `--space-6` (0px, 4px, 8px, 12px, 16px, 20px, 24px)

### Radius
- `--radius-pill` (9999px)

### Control Sizes
- `--control-checkbox` (16px)
- `--control-switch-track-h` (24px)
- `--control-switch-track-w` (44px)
- `--control-switch-thumb` (20px)
- `--chip-height` (28px)

### Status Colors
- `--status-planned-bg/fg/border` (light/dark)
- `--status-progress-bg/fg/border` (light/dark)
- `--status-done-bg/fg/border` (light/dark)
- `--status-scheduled-bg/fg/border` (light/dark)

## Компоненты, приведенные к токенам

1. **LanguageChip** - полностью токенизирован (spacing, radius, status colors, typography)
2. **Badge** - padding и radius через токены
3. **Checkbox** - размеры через `--control-checkbox`
4. **Switch** - размеры через `--control-switch-*`
5. **Popover** - padding через `--space-4`
6. **Tooltip** - padding через `--space-3/--space-2`, typography через `text-hint`
7. **TableHead/TableCell** - padding через `--space-4`, typography через `text-label`
8. **Label** - typography через `text-label`
9. **VideoCard** - статус цвета через `status-*` токены, padding через `--space-*`
10. **Button (sm)** - padding через `--space-3`
11. **Sidebar** - padding через `--space-3/--space-1`
12. **Calendar** - typography через `text-hint`

## Оставшиеся исключения

1. **text-[10px] в typography.css** - это определение класса `.text-status`, не исключение
2. **mx-3.5 в sidebar.tsx** - специфический отступ для sidebar, оставлен как есть
3. **bg-black/40, text-white/70** в video-card.tsx - специфические цвета для видео ID badge, оставлены

## Инструкция "как менять шрифт/размеры через одно место"

### Изменить размер шрифта кнопок
Изменить `--button-height` в `client/src/styles/tokens.css` (влияет на высоту, размер текста управляется через `text-button` класс)

### Изменить размер шрифта чипов
Изменить `--chip-height` в `client/src/styles/tokens.css` (высота) и `.text-status` в `client/src/styles/typography.css` (размер текста статуса)

### Изменить размер шрифта таблиц
Изменить `.text-label` в `client/src/styles/typography.css` (заголовки) и `text-sm` в Table компоненте (основной текст)

### Изменить spacing везде
Изменить `--space-1` до `--space-6` в `client/src/styles/tokens.css`

### Изменить цвета статусов
Изменить `--status-*-bg/fg/border` в `client/src/styles/tokens.css` (для light и dark mode отдельно)

### Изменить размеры контролов
Изменить `--control-checkbox`, `--control-switch-*` в `client/src/styles/tokens.css`

## Результат

- ✅ Все основные компоненты токенизированы
- ✅ Нет "магических" значений в ключевых компонентах
- ✅ Семантические классы типографики используются везде
- ✅ Проект собирается без ошибок
- ✅ Все изменения разбиты на маленькие безопасные коммиты

