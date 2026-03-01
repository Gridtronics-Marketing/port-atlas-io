
# Make Floor Plan Toolbar Float Above the Plan

## Overview

Extract the entire toolbar (Upload Map, Draw Floor Plan, Filter, Add Drop Point, Add Room View, Draw Wire Path, Export PDF, Delete, Zoom controls) out of `CardHeader` and make it a sticky/floating bar that stays visible as the user scrolls through the floor plan.

## Changes

### `src/components/InteractiveFloorPlan.tsx`

**1. Move toolbar out of `CardHeader` into a sticky overlay inside `CardContent`**

Currently the toolbar buttons (lines ~644-864) are inside `CardHeader`, which scrolls away when the floor plan image is large or zoomed in.

The fix:
- Keep `CardHeader` minimal -- just the title "Floor N - Interactive Plan"
- Move the entire toolbar (Upload Map through Zoom controls) into a new `div` placed **inside `CardContent` but above the floor plan container**, with these classes:

```tsx
<div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b rounded-t-lg px-3 py-2">
  <div className="flex flex-wrap items-center gap-2">
    {/* All toolbar buttons moved here */}
  </div>
</div>
```

**2. Wrap the `CardContent` area in a scrollable container**

To make `sticky` work, the `CardContent` (or its parent `Card`) needs to be the scroll container. Add `max-h-[85vh] overflow-y-auto` to `CardContent` so the toolbar sticks to the top as the user scrolls through a large/zoomed floor plan:

```tsx
<CardContent className="space-y-4 max-h-[85vh] overflow-y-auto p-0">
  {/* Sticky toolbar */}
  <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b px-3 py-2">
    <div className="flex flex-wrap items-center gap-2">
      {/* Upload Map, Draw Floor Plan, Filter, Add Drop Point, 
          Add Room View, Draw Wire Path, Export PDF, Delete, Zoom */}
    </div>
  </div>
  {/* Drop point count + legend */}
  {/* Floor plan container (the existing ref={containerRef} div) */}
</CardContent>
```

**3. Simplify `CardHeader`**

`CardHeader` keeps only:
- The title "Floor N - Interactive Plan"
- The "Manage Floors" button (if present at that level)

**4. Styles**

- `sticky top-0 z-30` -- pins the toolbar to the top of the scrollable card
- `bg-background/95 backdrop-blur-sm` -- semi-transparent background so the plan is slightly visible behind it, matching the app's design system
- `border-b` -- subtle separator between toolbar and plan content
- `px-3 py-2` -- compact padding to keep the toolbar slim

## What stays unchanged

- All button logic, click handlers, and state management
- The floor plan container, markers, context menus, drag behavior
- Zoom/scale controls and their functionality
- All modals and dialogs
- The drop point count/legend section (moves below toolbar but above the plan)
