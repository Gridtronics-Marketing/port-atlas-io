

# App-Wide UI Refresh — Bolder, Smoother, Friendlier

## Summary
Update the global design tokens and core UI primitives to produce a warmer, bolder, and more rounded look across the entire app. The Jobber screenshot shows the target aesthetic: generous padding, bolder headings, softer borders, larger radius, and an overall friendlier feel.

## Changes

### 1. `index.html` — Add Inter font
- Add Google Fonts link for **Inter** (weights 400, 500, 600, 700) for a modern, friendly typeface

### 2. `tailwind.config.ts` — Font family + larger radius
- Add `fontFamily: { sans: ["Inter", ...defaultTheme.fontFamily.sans] }`
- Increase `--radius` from `0.5rem` to `0.75rem` for softer corners everywhere

### 3. `src/index.css` — Design token & typography refresh
- **Radius**: `--radius: 0.75rem` (was 0.5rem)
- **Body text**: bump from `text-sm` to `text-[0.9375rem]` (15px base)
- **Headings**: increase weights to `font-bold` (was semibold), bump sizes up one step
- **Background**: soften to a warmer tone `220 14% 98%` (less gray)
- **Borders**: soften from `220 13% 88%` → `220 10% 91%` (lighter, less harsh)
- **Shadows**: make softer and more diffused
- **Muted foreground**: slightly darker for better readability `220 10% 42%` (was 46%)

### 4. `src/components/ui/button.tsx` — Bolder, rounder buttons
- Base: `rounded-lg` (was `rounded-md`), `font-semibold` (was `font-medium`)
- Default size: `h-10 px-5` (slightly wider padding)
- Add subtle `shadow-sm` to default and destructive variants
- Smoother hover transitions: `transition-all duration-200`

### 5. `src/components/ui/card.tsx` — Softer cards
- `rounded-xl` (was `rounded-lg`)
- `shadow-sm` default (consistent soft elevation)
- `hover:shadow-md` implicit via `transition-card`

### 6. `src/components/ui/input.tsx` — Friendlier inputs
- `rounded-lg` (was `rounded-md`)
- `h-11` (was `h-10`) — slightly taller, easier to tap
- Lighter border color feel via softer `border-input` token

### 7. `src/components/ui/badge.tsx` — Softer badges
- Already `rounded-full` — keep
- Bump to `font-bold` for bolder tag text

### 8. `src/components/ui/dialog.tsx` — Smoother modals
- `sm:rounded-xl` (was `sm:rounded-lg`)
- Softer overlay: `bg-black/60` (was `bg-black/80`) — less aggressive
- Add `shadow-xl` for more depth

### 9. `src/components/ui/table.tsx` — Friendlier tables
- Table header: remove uppercase, use `font-semibold text-sm` instead of `text-xs uppercase tracking-wider`
- Slightly more row padding `py-3.5` (was `py-3`)
- Softer row dividers

### 10. `src/components/ui/sidebar.tsx` (minor)
- If needed, bump sidebar font weight for menu labels

## What stays the same
- Color palette (Gold/Silver/Steel brand)
- Component structure and functionality
- Dark mode tokens (just inherits the radius/font changes)

## File Summary
- **Modified**: `index.html`, `tailwind.config.ts`, `src/index.css`, `button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `dialog.tsx`, `table.tsx`

