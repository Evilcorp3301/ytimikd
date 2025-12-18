# Аудит стилей и CSS переменных

## Проверка CSS переменных

### Неиспользуемые переменные (к удалению)

1. **Chart colors** (`--chart-1` до `--chart-5`)
   - Определены в `:root` и `.dark`
   - НЕ используются нигде (chart.tsx удален)
   - ✅ К удалению

2. **Font variables**
   - `--font-serif` - НЕ используется
   - `--font-mono` - используется только в video-card.tsx (font-mono класс)
   - `--tracking-normal` - НЕ используется
   - ✅ `--font-serif` и `--tracking-normal` к удалению

3. **Shadow variables**
   - `--shadow-2xs` - НЕ используется
   - `--shadow-xs` - НЕ используется  
   - `--shadow-sm` - НЕ используется
   - `--shadow-md` - НЕ используется
   - `--shadow-xl` - НЕ используется
   - `--shadow-2xl` - НЕ используется
   - `--shadow-lg` - используется в dialog.tsx и alert-dialog.tsx
   - `--shadow` - НЕ используется (дубликат shadow-sm)
   - ✅ К удалению: shadow-2xs, shadow-xs, shadow-sm, shadow-md, shadow-xl, shadow-2xl, shadow

4. **Radius variables**
   - `--radius-sm` - НЕ используется
   - `--radius` - НЕ используется (дубликат, есть radius-md)
   - `--radius-md` - используется
   - `--radius-lg` - используется
   - ✅ К удалению: radius-sm, radius

5. **Spacing variables**
   - `--spacing-10` - НЕ используется
   - `--spacing-12` - НЕ используется
   - `--spacing-16` - НЕ используется
   - `--spacing-20` - НЕ используется
   - `--spacing-24` - НЕ используется
   - `--spacing` (legacy) - НЕ используется
   - ✅ К удалению

6. **Light mode variables** (`:root`)
   - Весь блок `:root` не используется (только dark theme)
   - ✅ К удалению весь блок `:root`

### Используемые переменные (НЕ удалять)

- `--radius-md`, `--radius-lg` - используются
- `--shadow-lg` - используется
- `--spacing-1` до `--spacing-8` - используются
- `--elevate-1`, `--elevate-2` - используются
- `--font-mono` - используется в video-card.tsx
- Все остальные переменные в `.dark` блоке используются

### Неиспользуемые CSS классы/анимации

1. **`@keyframes slow-zoom`**
   - Определена в index.css
   - НЕ используется (video-thumbnail-zoom класс удален)
   - ✅ К удалению

2. **`[contenteditable][data-placeholder]`**
   - Определена в index.css
   - НЕ используется нигде
   - ✅ К удалению

