# Project State & Session Notes

> **Last Updated**: 2025-12-17 (Hybrid UI Redesign Phase 1–2 + Archive/Scheduled updates)  
> **Purpose**: Quick reference for AI assistants and developers to understand current project state and recent changes.

## 🎯 Project Overview

**YTimikD** — личный органайзер переводов YouTube

Внутренний инструмент для управления переводами YouTube видео:
- **Куратор**: добавляет исходные видео в очередь и настраивает языки
- **Публикатор**: переводит по языкам, публикает на YouTube, фиксирует результаты

**Tech Stack:**
- Frontend: Vite + React + TypeScript + Tailwind CSS + shadcn/ui + Wouter + TanStack Query
- Backend: Express + Node.js + TypeScript + Drizzle ORM
- Database: PostgreSQL (Supabase)
- Storage: Abstraction layer (DatabaseStorage / MemoryStorage)

## 📋 Recent Changes (2025-12-17)

### Hybrid UI Redesign (Phase 1–2) ✅
- ✅ **Glassmorphism for Modals**
  - `Dialog` and `AlertDialog`: `bg-background/95`, `backdrop-blur-md`, `border-border/50`, `shadow-xl`
  - Overlay: `bg-black/60`, `backdrop-blur-sm`
- ✅ **Enhanced Interactions**
  - `Card`: smooth transitions + subtle lift (`hover:-translate-y-1`) + stronger hover shadow
  - `Button`: micro-interactions (`transition-all`, tactile `active:scale-[0.98]`)
  - `Input` / `Textarea` / `Select` / `Checkbox`: smooth transitions + softer focus ring (`ring-ring/50`)
  - `SelectContent`: subtle blur (`bg-popover/95 backdrop-blur-sm`) + `shadow-lg`

**Files**: `client/src/components/ui/dialog.tsx`, `client/src/components/ui/alert-dialog.tsx`, `client/src/components/ui/card.tsx`, `client/src/components/ui/button.tsx`, `client/src/components/ui/input.tsx`, `client/src/components/ui/textarea.tsx`, `client/src/components/ui/select.tsx`, `client/src/components/ui/checkbox.tsx`

### UI Consistency Fixes (Latest)
- ✅ **Select Component Typography**: Unified text sizing across all Select components
  - SelectItem and SelectLabel now use `text-sm leading-snug md:text-xs` to match SelectTrigger
  - Ensures consistent appearance in all dropdown menus (category filter, channel filter, event filter)
  - Improved visual consistency across the application
- ✅ **Select Voice Gender Text Size**: Fixed text size in translation dialog
  - Added `text-sm leading-snug md:text-xs` to voice gender SelectTrigger
  - Matches other form input fields for consistency
- ✅ **Channel Subcategories Display**: Added subcategory badges in channel cards
  - Subcategories now displayed as "Category / Subcategory" badges in channel cards
  - Replaces old `niche` field display
  - Efficient loading using Promise.all for better performance

**Files**: select.tsx, translation-dialog.tsx, channels.tsx

### Categories Page Redesign & Mobile UI Fixes
- ✅ **Categories Page Complete Redesign**: Modern grid-based layout
  - Removed accordion/Collapsible pattern for better UX
  - Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
  - All subcategories visible at once in each category card
  - Improved hover states with smooth transitions
  - Action buttons appear on hover for cleaner interface
  - Statistics display with Video and Tv icons below category description
  - Empty state with call-to-action when no subcategories exist
- ✅ **Mobile Sidebar Fix**: Hide "Add Video" button on mobile devices
  - Button hidden on mobile (using `hidden md:block`)
  - Queue page uses the standard top action button (no mobile FAB)
  - Better mobile UX with less clutter and predictable actions

**Files**: categories.tsx, app-sidebar.tsx

### Category Statistics & Delete Warnings
- ✅ **Category Statistics**: Added usage statistics for categories
  - Backend method `getCategoryStats()` to count videos and channels per category
  - API endpoint `GET /api/categories/stats` returns statistics
  - Frontend displays statistics in category cards (video count and channel count)
  - Statistics shown with icons (Video and Tv) below category name
- ✅ **Delete Warning**: Enhanced category deletion with usage warnings
  - Warning dialog shows when category has active connections
  - Displays exact count of videos and channels linked to category
  - Destructive button styling when category is in use
  - Prevents accidental deletion of categories with active data

**Files**: categories.tsx, routes.ts, storage.database.ts, storage.memory.ts, storage.ts

### Global Search & Mobile UI Improvements
- ✅ **Global Search**: Implemented comprehensive search functionality
  - Search across videos (title, URL, ID) and channels (name, URL, ID)
  - Command Dialog interface with grouped results
  - Real-time search with debouncing
  - Navigation to found items with scroll-to-element functionality
  - Search icon in header for easy access
- ✅ **Mobile UX (Queue Add Button)**: Reverted FAB → standard top action
  - Removed fixed circular FAB on mobile
  - Keep consistent “Add” action in page header across screen sizes

**Files**: global-search.tsx, header.tsx, queue.tsx, routes.ts, storage.database.ts, storage.memory.ts, storage.ts

### Translation Dialog & Scheduled Page UI Fixes
- ✅ **Date Picker Button Styling**: Fixed sizing and typography to match input fields
  - Height: `h-9` (matches input fields)
  - Padding: `px-3 py-2` (matches input fields)
  - Typography: `text-sm leading-snug font-normal md:text-xs` (matches input fields)
- ✅ **Icon Colors Unification**: CalendarIcon and Clock icons now use `text-muted-foreground` for consistency
- ✅ **Time Input AM/PM Selector**: Added CSS to hide AM/PM selector in time inputs (forces 24-hour format)
- ✅ **Scheduled Page Enhancements**:
  - Added category/subcategory badge display on scheduled translation cards
  - Fixed date font style to use `text-muted-foreground` for better visual consistency
  - Improved spacing and layout structure in scheduled cards
  - Real-time countdown updates every minute (shows "через X мин/ч" updating live)
  - Scheduled page is for tracking planned publications (no “overdue” label)
- ✅ **Storage Layer Updates**: Updated `getTranslations()` and `getTranslation()` to include subcategory with category data
- ✅ **Type Updates**: Updated `TranslationWithDetails` type to include subcategory in video relation

**Files**: translation-dialog.tsx, scheduled.tsx, index.css, storage.database.ts, storage.memory.ts, schema.ts

### Phase 1 UI/UX Improvements - Video Cards Redesign
- ✅ **Full-width Thumbnail Design**: Complete redesign of video cards
  - Thumbnail now spans full width at top with 16:9 aspect ratio
  - Hover effects: subtle image zoom and overlay with gradient action buttons
  - Brand gradient buttons (YouTube link and Download) on hover overlay
- ✅ **Progress Bar**: Added progress indicator showing completed/total translations
- ✅ **Grouped Language Status**: Compact badges showing translation status counts
  - "✓ X готово" (green), "◐ X в работе" (blue), "X не начато" (gray)
  - Individual language chips with urgency indicators remain below
- ✅ **Improved Scheduled Indicators**: Enhanced urgency visualization
  - "Срочно"/"Скоро" badges for urgent/warning items
  - Time until publication displayed ("через X мин/ч")
  - Enhanced shadows and animations for urgent items
- ✅ **Typography Improvements**: Reduced font sizes in subcategory selection forms (text-xs)
- ✅ **Better Visual Hierarchy**: Improved spacing and information density

**Files**: video-card.tsx, scheduled.tsx, add-video.tsx, edit-video-dialog.tsx, channels.tsx

### Archive Page UI Update ✅
- ✅ **Archive is a visual tracking list**
  - Grid cards with full-width thumbnails (aspect-video)
  - Better scan-ability and consistent card visual language

**Files**: `client/src/pages/archive.tsx`

### Form Accessibility & Browser Compatibility Fixes
- ✅ **Form Field Attributes**: Added `autocomplete` attributes to all input fields
  - URL fields: `autoComplete="url"`
  - Name fields: `autoComplete="name"` or `autoComplete="organization-title"`
  - Time fields: `autoComplete="off"`
- ✅ **Button Elements in Forms**: Added `type="button"` and `name` attributes to Button elements inside FormControl
  - Prevents browser warnings about form fields without id/name
  - Applied to subcategory selection buttons in channels, add-video, and edit-video forms
- ✅ **Checkbox-Label Associations**: Fixed all checkbox-label relationships
  - Added unique `id` attributes to all Checkbox elements
  - Added `htmlFor` attributes to corresponding label elements
  - Applied in categories selection (channels.tsx, add-video.tsx, edit-video-dialog.tsx)

### Categories & Subcategories System
- ✅ **Database Schema**: Added `categories`, `subcategories`, `channel_subcategories` tables
- ✅ **Video-Category Link**: Added `subcategoryId` field to `videos` table
- ✅ **Backend API**: Full CRUD endpoints for categories and subcategories
  - `GET/POST/PATCH/DELETE /api/categories`
  - `GET/POST/PATCH/DELETE /api/subcategories`
  - `GET /api/channels/:id/subcategories` - get channel subcategories
- ✅ **Channel Filtering**: Updated `GET /api/channels` to support filtering by `subcategoryId` and `language`
- ✅ **Storage Layer**: Updated `DatabaseStorage` and `MemoryStorage` with category methods
- ✅ **Frontend Pages**: New `/categories` page with hierarchical UI (Collapsible categories with subcategories)
- ✅ **Channel Form**: Replaced `niche` field with multi-select subcategories (Popover + Checkbox, grouped by category)
- ✅ **Video Form**: Added subcategory selection (Popover-based grouped selector for clear hierarchy)
- ✅ **TranslationDialog**: Automatic channel filtering by video subcategory and translation language
- ✅ **Translations**: Added all category-related translations to `ru.json`
- ✅ **Navigation**: Added "Категории" menu item to sidebar

### Codebase Cleanup
- ✅ Removed unused dependencies: `passport`, `express-session`, `connect-pg-simple`, `memorystore`, `react-icons`, `ws`, `@jridgewell/trace-mapping`
- ✅ Removed duplicate documentation (`design_guidelines.md` - `STYLE_GUIDE.md` is source of truth)
- ✅ Cleaned up `script/build.ts` allowlist to match actual dependencies
- ✅ Added missing dependencies: `nanoid` (used in `server/vite.ts`), `@types/pg`
- ✅ Updated README to reflect current structure

### Features Implemented
1. **Automatic YouTube metadata fetching**
   - Video title and thumbnail auto-fill when adding videos (`POST /api/videos`)
   - Channel name auto-fill when adding channels (`POST /api/channels`)
   - Server-side implementation in `server/youtube.ts`
   - Fallback handling if API key is missing or API fails

2. **UI/UX Improvements**
   - Brand gradient buttons (defined in `client/src/index.css`)
   - Consistent text sizing (`text-xs text-muted-foreground` for secondary text)
   - Standardized spacing (`mb-4 md:mb-6 lg:mb-8` for top blocks)
   - Removed regional settings (timezone fixed to Moscow)
   - Removed non-functional notifications button
   - Added scheduled count badge to sidebar "План" menu item
   - Improved Activity log (clickable URLs, better alignment)
   - Consistent header actions aligned right; avoid percentage widths that break layout

3. **Backend Logic**
   - Automatic scheduled → completed transition via cron (every minute)
   - Auto-archiving prevention for videos with scheduled translations
   - Activity log descriptions in Russian
   - Channel name made optional (auto-filled from YouTube API)

## 🔧 Current Architecture

### Key Files Structure
```
server/
  ├── index.ts          # Express app + cron setup
  ├── routes.ts         # API endpoints (videos, translations, channels, categories, etc.)
  ├── storage.ts        # Storage abstraction (DatabaseStorage/MemoryStorage)
  ├── storage.database.ts  # PostgreSQL implementation
  ├── storage.memory.ts    # In-memory implementation (dev mode)
  ├── youtube.ts        # YouTube API utilities (video/channel metadata)
  └── telegram.ts       # Telegram notifications + scheduled check

client/src/
  ├── pages/            # All page components
  │   ├── categories.tsx  # Categories management page (NEW)
  │   ├── channels.tsx    # Channel form with subcategories multi-select
  │   ├── add-video.tsx   # Video form with subcategory selection
  │   └── queue.tsx       # Queue with TranslationDialog filtering
  ├── components/
  │   ├── layout/       # Header, Sidebar, MobileNav
  │   ├── ui/           # shadcn/ui components
  │   └── videos/       # Video-specific components (TranslationDialog with filtering)
  └── lib/              # Providers, utilities, YouTube parser

shared/
  └── schema.ts         # Drizzle ORM schema (categories, subcategories, channel_subcategories)
```

### Storage Strategy
- Uses `DATABASE_URL` env variable to determine storage
- If present → `DatabaseStorage` (PostgreSQL via Drizzle)
- If missing → `MemoryStorage` (in-memory, dev mode)
- Logs which storage is being used on startup

### YouTube API Integration
- Location: `server/youtube.ts`
- Functions: `extractYouTubeVideoId`, `fetchYouTubeVideoMetadata`, `extractYouTubeChannelIdentifier`, `fetchYouTubeChannelMetadata`
- Requires `youtubeApiKey` in settings
- Graceful fallback if API unavailable

## 🎨 UI Guidelines (Quick Reference)

**Source of Truth**: `STYLE_GUIDE.md`

Key rules:
- Base text: `text-sm` (14px)
- Secondary text: `text-xs text-muted-foreground`
- Page title: `text-lg font-semibold`
- Card title: `text-base font-semibold`
- Button: Brand gradient (see `index.css` `--brand-*` variables)
- Spacing: `mb-4 md:mb-6 lg:mb-8` for top blocks
- Timezone: Fixed to Moscow (Europe/Moscow)

## 🐛 Known Issues / TODO

### Recent Fixes
- ✅ Fixed channel creation - name field validation (made optional, auto-filled)
- ✅ Fixed channel data processing - explicit object construction (no spread req.body)
- ✅ Fixed form accessibility issues - added autocomplete, name attributes, checkbox-label associations
- ✅ Fixed browser warnings about form fields without id/name attributes
- ✅ Improved video card category display - fixed subcategory rendering with proper null checks
- ✅ Removed accidental click handlers from status badges (prevents unwanted translation dialog opening)
- ✅ Improved typography consistency - reduced font sizes in subcategory selection forms (text-xs)

### Potential Future Improvements
- ✅ Categories & Subcategories system - **IMPLEMENTED**
- See `docs/IMPROVEMENTS.md` for detailed feature proposals
- See `docs/CATEGORIES_IMPLEMENTATION_ANALYSIS.md` for implementation details

## 📝 Development Notes

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for production)
- `PORT`: Server port (default: 5000)
- See `docs/env.example.txt` for details

### Build Process
- `npm run dev`: Development server (Vite dev + Express)
- `npm run build`: Build client + server to `dist/`
- `npm run start`: Production server
- `npm run check`: TypeScript check

### Database
- Schema: `shared/schema.ts`
  - **Categories**: `categories` (id, name, description, sort_order)
  - **Subcategories**: `subcategories` (id, category_id, name, description, sort_order)
  - **Channel-Subcategory Links**: `channel_subcategories` (channel_id, subcategory_id) - many-to-many
  - **Video-Subcategory Link**: `videos.subcategory_id` - foreign key to subcategories
- Migrations: `npm run db:push` (Drizzle Kit)
- Setup guide: `docs/DB_SETUP.md`
- Categories implementation: `docs/CATEGORIES_IMPLEMENTATION_ANALYSIS.md`

## 🔑 Key Concepts

1. **Translation Status Flow**:
   - `not_started` → `completed` (manual or via scheduled date)
   - Scheduled translations automatically move to `completed` when `scheduledDate` arrives

2. **Video States**:
   - Active (in queue)
   - Archived (all translations completed OR manual archive)
   - Never auto-archive if any translation has future `scheduledDate`

3. **Activity Logging**:
   - All major actions logged to `activity_logs` table
   - Descriptions in Russian
   - Includes metadata (IDs, etc.)

4. **Categories System**:
   - Hierarchical structure: Categories → Subcategories
   - Videos linked to subcategories (one-to-one via `subcategoryId`)
   - Channels linked to subcategories (many-to-many via `channel_subcategories`)
   - Smart filtering: TranslationDialog filters channels by video's subcategory and translation language

## 🚀 Quick Start for New Session

1. Check `.env` exists with `DATABASE_URL` (if using DB)
2. Run `npm install` if needed
3. Run `npm run dev` to start
4. Check console for storage type being used
5. Review `STYLE_GUIDE.md` for UI rules
6. Check `docs/IMPROVEMENTS.md` for future work ideas
7. Review `docs/CATEGORIES_IMPLEMENTATION_ANALYSIS.md` for categories system details

---

## 📚 Related Documentation

- **Categories Implementation**: `docs/CATEGORIES_IMPLEMENTATION_ANALYSIS.md` - детальный анализ и реализация системы категорий
- **UI/UX Proposals**: `docs/UX_UI_UPGRADE_PROPOSAL.md` - предложения по улучшению интерфейса
- **Feature Ideas**: `docs/IMPROVEMENTS.md` - список возможных улучшений и новых функций
- **Database Setup**: `docs/DB_SETUP.md` - инструкции по подключению БД
- **Deployment**: `README.md` (раздел Deployment) - инструкции по развертыванию

---

**Note**: This document should be updated after significant changes or at the end of each session.

