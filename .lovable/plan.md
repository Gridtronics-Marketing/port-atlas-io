

# Google Maps-Style Floor Plan Viewer

## What changes

Replace the current scrollbar-based zoom with a **pan-and-zoom canvas** (like Google Maps), strip the toolbar down to **3 floating buttons**, and remove the legend.

### Current layout
```text
┌─────────────────────────────────────────┐
│ Floor 1 - Interactive Plan              │
├─────────────────────────────────────────┤
│ [Upload][Satellite][Filter][+DP][+RV]   │  ← full toolbar
│ [WirePath][Export][Delete][- 100% + ↺]  │
├─────────────────────────────────────────┤
│ 3 drop points on this floor             │
│ ● Planned ● Roughed-in ● Finished ...  │  ← legend
├─────────────────────────────────────────┤
│ ┌──────────────────────────────────┐    │
│ │  (floor plan image, CSS scale)   │ ←scroll│
│ │  overflow-y-auto with scrollbars │    │
│ └──────────────────────────────────┘    │
├─────────────────────────────────────────┤
│ Instructions text block                 │
└─────────────────────────────────────────┘
```

### New layout
```text
┌─────────────────────────────────────────┐
│                                         │
│  [+ Drop Point] [📷 Room View] [Filter] │ ← floating top-right
│                                         │
│         (floor plan image)              │
│     pan by drag, zoom by wheel/pinch    │
│     no scrollbars, overflow: hidden     │
│                                         │
└─────────────────────────────────────────┘
```

## Technical approach

### `src/components/InteractiveFloorPlan.tsx`

**1. Add pan state + wheel/pinch zoom**

New state: `panOffset: {x, y}`, `isPanning: boolean`, `lastPanPoint`.

- `onWheel` on outer container: adjust `scale` (0.3-5.0 range), zoom toward cursor position by adjusting `panOffset`
- Touch: track two-finger distance for pinch zoom, single-finger drag for pan
- Mouse: middle-click or drag on empty space pans; existing drop-point drag logic stays

**2. Replace container styling**

Current: `CardContent` has `max-h-[85vh] overflow-y-auto`, inner div uses `transform: scale()` with `transformOrigin: top left`.

New:
- Outer wrapper: `overflow: hidden`, `position: relative`, full height, `touch-action: none`
- Inner content: `transform: translate(panX, panY) scale(scale)`, `transformOrigin: 0 0`
- No scrollbars at all

**3. Floating action buttons**

Replace entire toolbar (lines ~688-954) with a simple floating div:

```tsx
<div className="absolute top-3 right-3 z-30 flex items-center gap-2">
  <Button size="sm" variant={isAddingPoint ? "default" : "secondary"}
    onClick={() => { setIsAddingPoint(!isAddingPoint); setIsAddingRoomView(false); }}
    className="shadow-lg bg-background/90 backdrop-blur-sm">
    <Plus className="h-4 w-4 mr-1" /> Drop Point
  </Button>
  <Button size="sm" variant={isAddingRoomView ? "default" : "secondary"}
    onClick={() => { setIsAddingRoomView(!isAddingRoomView); setIsAddingPoint(false); }}
    className="shadow-lg bg-background/90 backdrop-blur-sm">
    <Camera className="h-4 w-4 mr-1" /> Room View
  </Button>
  <Button size="sm" variant="secondary"
    onClick={() => setFilterOpen(true)}
    className="shadow-lg bg-background/90 backdrop-blur-sm">
    <Filter className="h-4 w-4 mr-1" /> Filter
  </Button>
</div>
```

**4. Move secondary actions to a small "..." menu (bottom-right)**

Upload, Satellite, Export PDF, Delete, Wire Path — keep accessible but tucked away in a small floating `DropdownMenu` with a `MoreHorizontal` icon so power users still have them.

**5. Remove legend + instructions**

- Delete the `DropPointColorLegend` rendering block (lines ~956-971)
- Delete the "Interactive Controls" instructions section (lines ~1380-1391)
- Remove `CardHeader` title bar (the full-screen page already has its own title)

**6. Coordinate adjustment for pan**

Update `handleContainerClick` (for placing drop points/room views) and `handlePointerDown`/`handleMouseMove` (for dragging) to account for the pan offset when calculating percentage coordinates:
```typescript
const rect = containerRef.current.getBoundingClientRect();
const x = ((clientX - rect.left) / (rect.width)) * 100;  // rect already reflects transform
```
Since `getBoundingClientRect()` returns the transformed bounds, existing percentage math should work. Will verify and adjust if needed.

**7. Prevent pan when dragging drop points**

When `isMouseDown` is true for a drop point/room view, skip panning. Pan only triggers on empty-space drag.

## File summary
- **Modified**: `src/components/InteractiveFloorPlan.tsx` — pan+zoom logic, floating buttons, remove toolbar/legend/instructions

