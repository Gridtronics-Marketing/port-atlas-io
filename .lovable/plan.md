

# Update Client Portal Floor Plan Legend to Match Admin View

## Problem
The client portal legend (in `ClientFloorPlanViewer.tsx`) differs from the admin legend (`DropPointColorLegend.tsx`):
- Client legend combines "Finished/Tested" into one entry; admin has them separate (Finished = green, Tested = green with checkmark)
- Client legend shows Room View with orange dot; admin uses blue dot with camera icon
- Client legend lacks borders/shadows on dots
- Client legend uses `text-sm`; admin uses `text-xs`

## Change

**`src/components/ClientFloorPlanViewer.tsx`** (lines 271-295): Replace the inline legend with the reusable `DropPointColorLegend` component already used in the admin view. This ensures both views stay in sync automatically.

- Import `DropPointColorLegend` from `@/components/DropPointColorLegend`
- Replace the entire legend `<div>` block with `<DropPointColorLegend />`
- Also update the Room View marker color from `bg-orange-500` to `bg-blue-500` (line 244) to match the admin view and legend

