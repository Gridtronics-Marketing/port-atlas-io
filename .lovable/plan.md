

# Update Version Number and Change Log

## Changes to `src/lib/version.ts`

**Bump version** from `1.13.0` to `1.14.0` and add a new changelog entry at the top of `VERSION_HISTORY`:

```typescript
export const APP_VERSION = "1.14.0";
```

New entry:
```typescript
{
  version: "1.14.0",
  date: "2026-03-31",
  changes: [
    "Google Maps-style floor plan viewer — pan by drag, zoom by mouse wheel (PC) or pinch gesture (mobile), no scrollbars",
    "Floating action buttons for Drop Point, Room View, and Filter — always visible regardless of zoom position",
    "Secondary actions (Upload, Satellite, Wire Path, Export PDF, Delete) moved to floating '...' menu",
    "Removed floor plan legend and instructions panel for cleaner map view",
    "Fixed floor plan image not loading in full-screen editor — resolves file URL from database when not passed as prop",
    "Fixed signed URL file extension detection — strips query parameters before checking image type",
    "Added Speaker drop point type with speaker icon (rectangle body + sound waves)",
  ]
}
```

## File Summary
- **Modified**: `src/lib/version.ts` — version bump + new changelog entry

