

# Fix Login Page for iPhone / Small Screens

## Problem
On iPhone, the login card content overflows the viewport. The Sign In button is pushed below the visible area, requiring zooming and scrolling to tap it.

## Root Cause
The page uses `flex items-center justify-center min-h-screen` which vertically centers the card, but the card's content (logo at `h-16`, title, subtitle, tabs, form fields, button, checkbox) is too tall for small phone screens (~568-812px). The card doesn't scroll internally, and the outer container's `overflow-hidden` prevents page scrolling.

## Fix — `src/pages/Auth.tsx`

1. **Remove `overflow-hidden`** from the outer container so the page can scroll on small screens
2. **Add `py-safe` / `min-h-[100dvh]`** — use `dvh` (dynamic viewport height) which accounts for mobile browser chrome (address bar, toolbar)
3. **Shrink logo on mobile** — reduce from `h-16` to `h-10` on small screens (`h-10 sm:h-16`)
4. **Reduce card padding on mobile** — tighten `CardHeader` spacing with `space-y-2 sm:space-y-4` and smaller title text `text-xl sm:text-2xl`
5. **Change outer div** from `overflow-hidden` to `overflow-auto` so content scrolls naturally if it still exceeds viewport

These are minimal, targeted changes — no layout restructuring needed.

