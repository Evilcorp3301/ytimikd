# Cleanup Plan for YTimikD

## Overview
This plan outlines the steps to clean up the codebase by removing unused components, dependencies, and files. The goal is to reduce technical debt and improve maintainability without altering existing functionality.

## Phase 1: Analysis (Completed)
- Identified unused Shadcn UI components.
- Identified unused npm dependencies associated with these components.
- Verified backend structure.

## Phase 2: Execution Steps

### 1. Frontend Cleanup (Remove Unused UI Components)
The following components are present in `client/src/components/ui` but are not imported or used in the application:

- `carousel.tsx`
- `context-menu.tsx`
- `drawer.tsx`
- `input-otp.tsx`
- `menubar.tsx`
- `navigation-menu.tsx`
- `radio-group.tsx`
- `resizable.tsx`
- `slider.tsx`
- `toggle.tsx`
- `toggle-group.tsx`

**Action:** Delete these files.

### 2. Dependency Cleanup (Uninstall Unused Packages)
Remove dependencies that were only used by the components listed above:

- `embla-carousel-react` (Carousel)
- `@radix-ui/react-context-menu` (ContextMenu)
- `vaul` (Drawer)
- `input-otp` (InputOTP)
- `@radix-ui/react-menubar` (Menubar)
- `@radix-ui/react-navigation-menu` (NavigationMenu)
- `@radix-ui/react-radio-group` (RadioGroup)
- `react-resizable-panels` (Resizable)
- `@radix-ui/react-slider` (Slider)
- `@radix-ui/react-toggle` (Toggle)
- `@radix-ui/react-toggle-group` (ToggleGroup)

**Action:** Run `npm uninstall ...`

### 3. Backend & Root Cleanup
- Ensure `server/storage.memory.ts` is fully removed (already done in previous step).
- Verify `server/storage.ts` logic is sound (already done).

### 4. Verification
- Run `npm run build` to ensure no build errors.
- Run `npm run dev` to ensure application starts correctly.
- Check that all existing features (Queue, Channels, Settings, etc.) continue to work.

## Expected Outcome
- Cleaner file structure in `client/src/components/ui`.
- Smaller `node_modules` and `package.json`.
- No functional changes.

