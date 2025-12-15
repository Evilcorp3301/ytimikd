# Translation Management Dashboard - Design Guidelines

## Design Approach

**Selected System:** Material Design principles with modern dashboard aesthetics
**Justification:** Information-dense productivity application requiring clear hierarchy, efficient workflows, and data visualization capabilities.

**Key References:** Linear (clean typography, status indicators), Notion (flexible layouts), Asana (task management UX)

## Core Design Principles

1. **Information Clarity**: Prioritize scannable data over decorative elements
2. **Workflow Efficiency**: Minimize clicks, maximize visibility of critical information
3. **Status Visibility**: Clear visual indicators for translation states and urgency levels
4. **Responsive Data**: Tables gracefully transform to cards on mobile

## Typography

**Font Family:** Inter (primary), system-ui fallback
- **Display/Headings:** 24px-32px, weight 600-700
- **Section Headers:** 18px-20px, weight 600
- **Body Text:** 14px-16px, weight 400
- **Labels/Metadata:** 12px-14px, weight 500
- **Buttons/CTAs:** 14px-16px, weight 500

**Hierarchy Rules:**
- Page titles: 32px semibold
- Card titles: 18px semibold
- Table headers: 14px medium, uppercase tracking
- Status labels: 12px medium

## Layout System

**Spacing Primitives:** Tailwind units of **4, 6, 8, 12, 16** (as in p-4, gap-6, mb-8, py-12, px-16)

**Grid Structure:**
- Desktop: 12-column grid with max-w-7xl container
- Tablet: 8-column grid, max-w-4xl
- Mobile: Single column, full-width cards

**Page Layouts:**
- Sidebar navigation: Fixed 240px width on desktop, collapsible drawer on mobile
- Main content area: Responsive padding (px-4 mobile, px-8 tablet, px-12 desktop)
- Card grids: 3 columns desktop, 2 columns tablet, 1 column mobile

## Component Library

### Navigation
- **Sidebar (Desktop):** Fixed left panel, 240px width, icons + labels, active state indicator
- **Mobile Navigation:** Bottom tab bar with 5 primary sections, icons only
- **Top Bar:** Page title, quick actions (Add Video), theme toggle, notification bell

### Translation Queue Cards
- **Card Structure:** Elevated surface (shadow-md), 16px padding, 8px border-radius
- **Video Preview:** Thumbnail (16:9 aspect ratio, 120px height), fallback placeholder
- **Language Chips:** Pill-shaped buttons, 8px vertical padding, 12px horizontal, 4px gap between
  - Not started: Outlined, neutral
  - In progress: Filled, warning
  - Completed: Filled, success
- **Actions:** Icon buttons (Edit, Delete) top-right corner

### Forms & Inputs
- **Input Fields:** 40px height, 12px padding, 4px border-radius, clear labels above
- **Dropdowns:** Native select styling with chevron icon
- **Date/Time Pickers:** Calendar widget for scheduling
- **Buttons:**
  - Primary CTA: Filled, 40px height, 16px horizontal padding
  - Secondary: Outlined, same dimensions
  - Icon-only: 36px square, 8px border-radius

### Tables (Archive, Logs)
- **Desktop:** Full table with sortable columns, hover row highlight
- **Mobile:** Transform to stacked cards, key data only
- **Headers:** Sticky positioning, 48px height, medium weight text
- **Rows:** 56px height, alternating subtle background on hover
- **Pagination:** Bottom-center, show 10/25/50 per page options

### Scheduled Releases
- **Time-based Indicators:**
  - >12 hours: Standard card
  - <12 hours: Yellow-orange left border (4px), subtle warning background
  - <2 hours: Red left border (4px), prominent warning background
- **Calendar View Option:** Monthly grid with event dots

### Statistics Dashboard
- **Metric Cards:** Grid layout, large number display (32px), label below (14px)
- **Charts:** Bar/line charts using lightweight library (Chart.js), responsive canvas
- **Filters:** Horizontal chip group, multi-select dropdowns

### Settings Pages
- **Section Organization:** Clear headings (20px), divider lines between sections
- **API Configuration:** Expandable panels with inline help text, code formatting for tokens
- **Theme Switcher:** Toggle switch (Moon/Sun icons), instant preview

## Animations

**Minimal, purposeful only:**
- Card hover: Subtle elevation increase (shadow transition 150ms)
- Status chip changes: Smooth background/border transition (200ms)
- Modal/drawer open: Slide-in (300ms ease-out)
- Notifications: Fade in from top (250ms)
- NO scroll animations, NO complex page transitions

## Responsive Behavior

**Breakpoints:**
- Mobile: <640px
- Tablet: 640px-1024px
- Desktop: >1024px

**Mobile-Specific Adaptations:**
- Navigation: Bottom tab bar (60px height)
- Tables → Cards: Full transformation with collapsible details
- Multi-column grids → Single column
- Forms: Full-width inputs, larger touch targets (48px min)
- Action buttons: Fixed bottom position for primary CTAs

## Status Color System

**Semantic Usage (theme-independent):**
- Success/Completed: Green indicators
- Warning/Upcoming: Yellow-orange indicators
- Urgent/Imminent: Red indicators
- In Progress: Blue indicators
- Neutral/Not Started: Gray indicators

**Light Theme Example:**
- Success: green-600 text, green-50 background
- Warning: orange-600 text, orange-50 background

**Dark Theme Example:**
- Success: green-400 text, green-900/20 background
- Warning: orange-400 text, orange-900/20 background

## Images

**Video Thumbnails:**
- Placement: Left side of queue cards, archive table rows
- Dimensions: 16:9 aspect ratio, 120px width on desktop, 80px on mobile
- Fallback: YouTube logo placeholder with gray background
- Loading: Skeleton shimmer animation

**No hero images** - This is a dashboard application focused on functionality.