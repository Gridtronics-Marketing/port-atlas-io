

# Add Light/Dark Mode Toggle

## Summary
The dark theme CSS is already defined in `index.css` (`.dark` class). We need a theme provider to manage the state and a toggle button in the header.

## Changes

### 1. New: `src/hooks/useTheme.ts`
- Simple hook using `localStorage` key `"theme"` with values `"light"` | `"dark"` | `"system"`
- On mount, read from localStorage (default `"light"`), apply/remove `.dark` class on `document.documentElement`
- Export `theme`, `setTheme`, `toggleTheme`

### 2. Modify: `src/components/AppLayout.tsx`
- Import `useTheme` and `Sun`/`Moon` icons from lucide-react
- Add a toggle button in the header right section (before the sign-out separator):
  - Shows `Sun` icon in dark mode, `Moon` icon in light mode
  - Calls `toggleTheme()` on click
  - Ghost button matching existing header button styling

### 3. Modify: `src/components/ClientPortalSidebar.tsx`
- Add the same theme toggle in the sidebar footer (above the PWA install button) so client portal users also get it

