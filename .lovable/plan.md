

# Update Drop Point Colors to Match Reference Map

## Problem
The "Roughed In" status uses **yellow** (`bg-yellow-500`) but the reference image shows it should be **orange** (`bg-orange-500`). All other colors match correctly (Planned=red, Finished/Tested=green, Proposed=grey, Room View=blue).

## Changes

### 1. `src/components/InteractiveFloorPlan.tsx`
- `getDropPointColor`: Change `roughed_in` from `bg-yellow-500 border-yellow-600` to `bg-orange-500 border-orange-600`
- `getStatusTextColor`: Change `roughed_in` from `text-yellow-600` to `text-orange-600`

### 2. `src/components/DropPointColorLegend.tsx`
- Change Roughed In dot from `bg-yellow-500 border-yellow-600` to `bg-orange-500 border-orange-600`
- Add **Proposed** legend entry (grey) and **Room View** legend entry (blue) to match the reference

### 3. `src/components/DropPointList.tsx`
- Change roughed_in badge from `bg-yellow-500/20 text-yellow-700 border-yellow-500/40` to `bg-orange-500/20 text-orange-700 border-orange-500/40`

### 4. `src/components/DropPointDetailsModal.tsx`
- Same yellow→orange badge color update for roughed_in

### 5. `src/components/ClientFloorPlanViewer.tsx`
- Change "Roughed In" from `bg-yellow-500` to `bg-orange-500`

### 6. `src/lib/floor-plan-composite.ts`
- Update `getStatusColor` to use correct colors matching the app (planned=red, roughed_in=orange, finished/tested=green, etc.)

