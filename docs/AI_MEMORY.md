# AI Memory (Project Preferences)

> **Last Updated**: 2025-12-17 (High Priority UI Improvements)  
> **Purpose**: Stable product/UI rules agreed with the project owner. Use as a "source of truth" during future changes.

---

## UI/UX Rules (agreed)

- **Selection UX (everywhere)**
  - Use the same **Popover-based grouped selector** pattern (like Channels form) for choosing category/subcategory.
  - Hierarchy must be visually clear: **Category → Subcategory**.
  - Labels inside selection popovers should be **compact** (`text-xs` where appropriate).

- **Buttons & layout**
  - Header primary actions are **strictly on the right**.
  - Avoid “weird widths”: don’t use percentage widths that cause crooked buttons (`w-[30%]` etc.) unless explicitly needed.
  - On the Categories page header: button text should be **only** “Добавить”.
  - Remove redundant actions if they exist elsewhere (e.g., no global “Add subcategory” button if it’s available in category cards).

- **Mobile behavior**
  - No floating FAB for adding videos on mobile: keep the **standard top button** (same placement as desktop).

- **Scheduled (“План”) logic**
  - “План” is only for tracking planned publications.
  - No “просрочено/overdue” concept on the Scheduled page UI.

- **Video cards interactions**
  - Clicking grouped status badges must **not** open the Translation dialog.
  - Only explicit actions (language chips / buttons) should open dialogs.

- **Time inputs**
  - AM/PM selector must be **fully removed/hidden** (24h only).

- **Global Search**
  - Do not use Ctrl+K / Cmd+K hotkey. Keep a clear search icon trigger.

---

## Design direction

- **Hybrid redesign is the baseline**
  - Glassmorphism for modals/popovers (subtle blur + semi-transparent backgrounds)
  - Smooth, lightweight micro-interactions (150–300ms)
  - Consistent spacing and typography across forms/pages
  - Enhanced card shadows on hover (`hover:shadow-lg` with smooth transitions)
  - Improved text contrast in dark theme (`--muted-foreground: 0 0% 65%`)
  - Vibrant status colors for better visibility (green/blue/orange/red with higher opacity and lighter text)
  - Increased spacing throughout (cards, grids, content sections)

---

## Related Documentation

- **Improvements Plan**: `docs/IMPROVEMENTS_PLAN.md` - единый документ со всеми планами улучшений проекта
- **Project State**: `docs/PROJECT_STATE.md` - текущее состояние проекта и последние изменения

