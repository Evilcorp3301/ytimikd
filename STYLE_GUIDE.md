# STYLE GUIDE (Source of Truth)

This document is the single source of truth for UI/UX rules in this project.  
It is intentionally **small and enforceable**: only rules we actually use in the codebase.

## Typography (hierarchy)

- **Base text**: 14px (`text-sm`) everywhere by default.
- **Inputs**:
  - Mobile must keep **16px** (`text-base`) to avoid iOS auto-zoom.
  - Desktop uses `text-sm`.
  - Placeholders are **smaller than input text** (`placeholder:text-sm`, desktop `md:placeholder:text-xs`).
- **Page title (`Header`)**: `text-lg font-semibold` (single line, truncates).
- **Card title**: `text-base font-semibold`.
- **Secondary text / hints** (`FormDescription`, small metadata): `text-xs text-muted-foreground`.
- **Error text**: `text-sm font-medium text-destructive` (inline, near the field).
- **Numbers**: use **tabular numbers** for dates/counters (`tabular-nums`).

## Spacing & layout

- Use Tailwind spacing scale consistently: `2/3/4/6/8/12/16`.
- Page padding: `p-4` mobile, `md:p-6`, `lg:p-8` (already in `PageContainer`).
- Avoid accidental scrollbars; containers must handle `overflow` intentionally.

## Forms & inputs (behavior)

- Must allow paste in inputs.
- Must keep submit enabled until request starts; then disable + show progress.
- Errors must be inline and should focus the first invalid field on submit (future improvement).
- Use meaningful `name`, correct `type`, and add `autoComplete` where appropriate.

## Buttons

- Icon-only buttons must have **`title`** and ideally **`aria-label`** (future improvement).
- Minimum hit target: 36px desktop, 44px mobile (we use `h-9 w-9` as a baseline).

## Dates & time

- Store times in DB as UTC instants; display in UI in **Russian format**: `dd.MM.yyyy HH:mm`.
- Scheduling UI:
  - If “Опубликовано” is selected, date/time fields are hidden.
  - If “Запланировано”, date/time fields are visible and required.

## Accessibility

- Keyboard support via native semantics first (`button`, `a`, `label`).
- Visible focus rings (`focus-visible`) must remain enabled.
- Do not disable browser zoom (`maximum-scale=1` is forbidden).

## Where rules are implemented

- **Base fonts**: `client/src/index.css`
- **Inputs**: `client/src/components/ui/input.tsx`, `textarea.tsx`, `select.tsx`
- **Form hints**: `client/src/components/ui/form.tsx`
- **Page chrome**: `client/src/components/layout/header.tsx`, `client/src/components/ui/page-container.tsx`


