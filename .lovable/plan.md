

# Custom Drop Point Shapes by Type

## Summary
Replace the current emoji-based / generic circle markers on the interactive floor plan with distinct **SVG shapes** per drop point type, making each type instantly recognizable at a glance.

## Shape Mapping
```text
Data           ▲  Triangle
WiFi           ●  Circle
Camera         ◻▸ Small square with triangle (camera shape)
MDF            ★  Star (5-point)
IDF            ★  Star (5-point, same as MDF)
Access Control ▯  Rectangle (portrait/standing)
AV             ◻⊺ Small square with antenna line on top
Other          ◆  Diamond (fallback)
```

## Changes

### 1. New shared utility: `src/lib/drop-point-shapes.tsx`
- Export a `DropPointShape` React component that takes `type` and `size` props and renders the correct inline SVG shape
- Each shape is a simple SVG: triangle path, circle, camera composite, 5-point star path, tall rectangle, square-with-antenna, diamond
- All shapes use `currentColor` fill so they inherit the status color from the parent

### 2. `src/components/InteractiveFloorPlan.tsx`
- **Replace `getDropPointIcon`** (line 606-615) — delete the emoji map entirely
- **Replace the marker div** (lines 1058-1082): swap `rounded-full` circle for a transparent container, render `<DropPointShape type={point.point_type} size={24 * filters.markerScale} />` inside
- Keep existing: status color applied as `color` style (shapes use `currentColor`), drag handling, scale, labels, cable count badge

### 3. `src/components/InteractiveMap.tsx`
- Replace `getDropPointIcon` function (lines 53-68) — use `DropPointShape` instead of Lucide icons
- Update marker button (line 218): remove `rounded-full`, render shape component instead of `<IconComponent />`

### 4. `src/lib/floor-plan-composite.ts`
- Replace `drawDropPointMarker` (lines 71-97): instead of drawing a circle, draw the type-appropriate shape (triangle, circle, star, etc.) using canvas path commands
- Add a `drawShapeByType(ctx, type, x, y, size)` helper with canvas path equivalents of each SVG shape

### 5. `src/components/DropPointColorLegend.tsx`
- Add a **type legend section** below the existing status colors showing each shape with its label (Data ▲, WiFi ●, Camera, MDF ★, etc.)
- Use the same `DropPointShape` component at small size

## File Summary
- **New**: `src/lib/drop-point-shapes.tsx`
- **Modified**: `InteractiveFloorPlan.tsx`, `InteractiveMap.tsx`, `floor-plan-composite.ts`, `DropPointColorLegend.tsx`

