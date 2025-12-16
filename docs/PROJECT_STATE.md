# Project State & Session Notes

> **Last Updated**: 2025-12-16 (Categories Implementation)  
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

## 📋 Recent Changes (2025-12-16)

### Categories & Subcategories System (Latest Implementation)
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
- ✅ **Video Form**: Added subcategory selection (Select with grouping)
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
   - Mobile-responsive button widths (`w-[30%] min-w-32 sm:w-auto`)

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

