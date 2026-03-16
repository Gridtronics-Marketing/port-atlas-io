
Goal: make the floor plan filter usable on mobile by moving it out of the nested dropdown flow that is closing it immediately.

What I’ll change
1. `src/components/InteractiveFloorPlan.tsx`
   - Remove the mobile-only `FloorPlanFilterDialog` usage from inside the hamburger `DropdownMenuItem`.
   - Add a dedicated mobile Filter action in the same action row as `Drop Point` and `Room View`.
   - Keep desktop behavior unchanged unless needed for the shared dialog API.

2. `src/components/FloorPlanFilterDialog.tsx`
   - Refactor it so it can be opened in a controlled way from the parent instead of always owning its own `DialogTrigger`.
   - Support two modes:
     - desktop: existing inline Filter button trigger
     - mobile: triggerless dialog controlled by `InteractiveFloorPlan`

Design approach
- Mobile toolbar becomes:
  - menu button
  - Filter
  - Drop Point
  - Room View
  - zoom controls
- The Filter control will open directly from its own button, not from a menu item nested inside another Radix overlay.
- If space is tight on smaller phones, I’ll make the mobile Filter control compact so it fits without breaking the toolbar.

Technical details
- Current issue is caused by this pattern in `InteractiveFloorPlan.tsx`:
  - `DropdownMenuItem asChild` wrapping `FloorPlanFilterDialog`
  - `FloorPlanFilterDialog` internally uses `DialogTrigger`
- That creates a nested Radix overlay interaction on mobile: the dropdown closes at the same time the dialog tries to open, so the filter flashes and disappears.
- The reliable fix is to separate the trigger from the dropdown lifecycle:
  - parent owns `filterOpen`
  - mobile button sets `filterOpen = true`
  - `FloorPlanFilterDialog` renders from controlled props
- This keeps the existing filter logic intact; only the open/trigger behavior changes.

Expected result
- On mobile, tapping Filter will keep the filter panel open reliably.
- Drop Point and Room View actions remain easy to reach.
- Desktop filter behavior stays the same.