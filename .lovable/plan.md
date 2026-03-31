

# Add "Speaker" Drop Point Type

## Summary
Add a new "Speaker" drop point type with a speaker-shaped SVG icon across all relevant files.

## Changes

### 1. `src/lib/drop-point-shapes.tsx`
- Add `case 'speaker':` to `getShapePath()` — SVG speaker icon (rectangle body + sound waves or horn)
- Add `{ type: 'speaker', label: 'Speaker' }` to `dropPointShapeTypes` array
- Add `case 'speaker':` to `drawDropPointShape()` canvas function

### 2. `src/components/AddDropPointModal.tsx` (line 33)
- Add `{ value: 'speaker', label: 'Speaker' }` to `DROP_POINT_TYPES` array

### 3. `src/components/FloorPlanFilterDialog.tsx` (line 44)
- Add `{ value: 'speaker', label: 'Speaker' }` to `DROP_POINT_TYPES` array

### 4. `src/components/ClientDropPointPlacementDialog.tsx` (line 134)
- Add `<SelectItem value="speaker">Speaker</SelectItem>`

### 5. `src/components/ClientDropPointPlacementSession.tsx` (line 80)
- Add `<SelectItem value="speaker">Speaker</SelectItem>`

### 6. `src/components/DropPointList.tsx` (line 205 area)
- Add `<SelectItem value="speaker">Speaker</SelectItem>` to the type filter

### Speaker SVG Shape
A speaker icon: rectangle body with two arcs representing sound waves — distinct from all existing shapes.

## File Summary
- **Modified** (6 files): `drop-point-shapes.tsx`, `AddDropPointModal.tsx`, `FloorPlanFilterDialog.tsx`, `ClientDropPointPlacementDialog.tsx`, `ClientDropPointPlacementSession.tsx`, `DropPointList.tsx`

