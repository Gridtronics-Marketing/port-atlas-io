

# Fix: Select Dropdown Closing Immediately on Click

## Problem
The status filter `Select` dropdown on the Locations page (and likely other pages) closes immediately when clicked. This is caused by the `overflow-auto` on the `<main>` element in `AppLayout.tsx` — Radix Select's positioning logic detects the scrollable container and can misfire, closing the popover.

## Root Cause
In `src/components/AppLayout.tsx` line 72:
```
<main className="flex-1 overflow-auto">
```
The `overflow-auto` creates a scroll container that interferes with Radix Select's portal positioning. The Select content renders via a portal at the document root, but the trigger is inside the scrollable main area, causing a focus/position mismatch.

## Fix

**`src/components/AppLayout.tsx`** — Change `overflow-auto` to `overflow-y-auto overflow-x-hidden` and add `position: relative` to give Radix a stable reference:

```tsx
<main className="flex-1 overflow-y-auto overflow-x-hidden relative">
```

If that alone doesn't resolve it, the more robust fix is to move the scroll responsibility to the page level instead of the main container:

```tsx
<main className="flex-1 min-h-0">
```

This lets each page handle its own scrolling, preventing the parent scroll container from interfering with portaled Radix components (Select, Popover, DropdownMenu).

## Scope
- Single file change: `src/components/AppLayout.tsx`
- Affects all pages using Select/Popover/DropdownMenu in the main content area

