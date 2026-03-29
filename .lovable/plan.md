

# Compact Inline Badge Map Labels

## What changes
Replace the current two-line black bubble label with a single-line **compact badge** attached directly to the shape marker.

### Current
```text
┌──────────────┐
│ 2 Cables     │  ← blue text, separate line
│ D101, D102   │  ← white text, separate line
└──────────────┘
```

### New
```text
▲ ─ 2- D101, D102
     ↑blue  ↑white
```

A small rounded pill sitting right next to the marker with:
- Cable count in blue (e.g. `2-`) immediately followed by cable names in white (e.g. `D101, D102`)
- All on one line, smaller font, no multi-line box
- Semi-transparent dark background (`bg-black/60`) with subtle border, tightly padded
- Positioned with a small offset to the right of the shape, vertically centered

## File: `src/components/InteractiveFloorPlan.tsx` (~lines 1102-1110)

Replace the two-div label block with a single inline span:

```tsx
<div 
  className="bg-black/60 text-white px-1 py-0.5 rounded whitespace-nowrap shadow-sm border border-white/10 flex items-center gap-0.5"
  style={{ fontSize: `${9 * filters.markerScale}px` }}
>
  <span className="text-blue-400 font-semibold">
    {point.cable_count || 1}-
  </span>
  <span className="font-medium">
    {formatCableLabel(point.type_specific_data, point.label) || point.label || 'TBD'}
  </span>
</div>
```

Key differences:
- Single line instead of two
- Cable count shown as `2-` in blue, followed by names in white
- Tighter padding (`px-1 py-0.5`), smaller font (9px base vs 10px)
- Slightly more transparent background

## File Summary
- **Modified**: `src/components/InteractiveFloorPlan.tsx` (label block only, ~8 lines)

