

# Show Cable Names on Map Labels

## Summary
Replace the generic label on floor plan markers with the individual cable names from `type_specific_data.cable_names`, formatted compactly using dash notation for sequential runs (e.g., "1-4" instead of "1,2,3,4").

## Changes

### 1. `src/hooks/useDropPoints.ts` — Expose type_specific_data
- Add `type_specific_data: Record<string, any> | null` to the `DropPoint` interface
- Include it in the validated mapping (already fetched via `select('*')`)

### 2. New utility: `src/lib/cable-label-utils.ts`
- `formatCableLabel(typeSpecificData, cableCount)` function
- Reads `cable_names` from type_specific_data, collects all names
- Detects sequential numeric runs and collapses them: `1,2,3,4` → `1-4`, `1,2,5,6` → `1-2, 5-6`
- Falls back to comma-separated list for non-numeric names
- Returns the original `label` field if no cable_names exist

### 3. `src/components/InteractiveFloorPlan.tsx` — Use cable names in map label
- Import `formatCableLabel`
- In the persistent label div (line ~1108), replace `{point.label || 'TBD'}` with the formatted cable names string, falling back to `point.label`
- Keep the cable count line above as-is

### 4. `src/components/InteractiveMap.tsx` — Same update for the map tooltip/label
- Use `formatCableLabel` for drop point labels shown on the map

### 5. `src/lib/floor-plan-composite.ts` — Update exported label text
- When drawing the label text on canvas export, use the same formatted cable name logic

## File Summary
- **New**: `src/lib/cable-label-utils.ts`
- **Modified**: `useDropPoints.ts` (interface), `InteractiveFloorPlan.tsx` (label), `InteractiveMap.tsx` (label), `floor-plan-composite.ts` (export label)

