

# Mobile Toolbar Optimization for Interactive Floor Plan

## Problem
The floating toolbar has 10+ buttons that wrap and clutter the UI on mobile screens. Need to show only two primary actions (Add Drop Point, Add Room View) directly, and collapse the rest into a hamburger/dropdown menu.

## Approach

### `src/components/InteractiveFloorPlan.tsx`

**1. Add imports**
- Import `Menu` from lucide-react
- Import `useIsMobile` from `@/hooks/use-mobile`
- Import `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger` from `@/components/ui/dropdown-menu`

**2. Use the hook**
```tsx
const isMobile = useIsMobile();
```

**3. Restructure the toolbar (lines 648-873)**

On mobile (`isMobile === true`):
- Show a compact row with:
  - **Hamburger menu button** (Menu icon) containing: Upload Map, Satellite View, Draw Floor Plan, Edit Drawing, Filters, Draw Wire Path, Export PDF, Delete Floor Plan, Repair Files
  - **Add Drop Point** button (always visible)
  - **Add Room View** button (always visible)
  - **Zoom controls** (compact: just +/- and percentage badge, no reset)

On desktop (`isMobile === false`):
- Keep the current layout unchanged

The hamburger uses `DropdownMenu` which is already in the project. Each menu item triggers the same handlers as the current buttons.

```text
Mobile toolbar layout:
┌──────────────────────────────────┐
│ [☰] [+ Drop Point] [📷 Room] [−][100%][+] │
└──────────────────────────────────┘

Hamburger expands to:
┌─────────────────┐
│ Upload Map      │
│ Satellite View  │
│ Draw Floor Plan │
│ Edit Drawing    │
│ ─────────────── │
│ Filters         │
│ Draw Wire Path  │
│ ─────────────── │
│ Export PDF      │
│ Delete Plan     │
│ Repair Files    │
└─────────────────┘
```

