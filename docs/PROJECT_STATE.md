# Project State & Session Notes

> **Last Updated**: 2025-12-16  
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

### Codebase Cleanup (Latest)
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
  ├── routes.ts         # API endpoints (videos, translations, channels, etc.)
  ├── storage.ts        # Storage abstraction (DatabaseStorage/MemoryStorage)
  ├── youtube.ts        # YouTube API utilities (video/channel metadata)
  └── telegram.ts       # Telegram notifications + scheduled check

client/src/
  ├── pages/            # All page components
  ├── components/
  │   ├── layout/       # Header, Sidebar, MobileNav
  │   ├── ui/           # shadcn/ui components
  │   └── videos/       # Video-specific components
  └── lib/              # Providers, utilities, YouTube parser

shared/
  └── schema.ts         # Drizzle ORM schema (used by both client & server)
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
- See `docs/IMPROVEMENTS.md` for detailed feature proposals

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
- Migrations: `npm run db:push` (Drizzle Kit)
- Setup guide: `docs/DB_SETUP.md`

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

## 🚀 Quick Start for New Session

1. Check `.env` exists with `DATABASE_URL` (if using DB)
2. Run `npm install` if needed
3. Run `npm run dev` to start
4. Check console for storage type being used
5. Review `STYLE_GUIDE.md` for UI rules
6. Check `docs/IMPROVEMENTS.md` for future work ideas

---

**Note**: This document should be updated after significant changes or at the end of each session.

