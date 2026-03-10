

# Update Version and Change Log — v1.10.8

## Changes

### `src/lib/version.ts`

- Bump `APP_VERSION` from `"1.10.7"` to `"1.10.8"`
- Add new entry at top of `VERSION_HISTORY`:

```typescript
{
  version: "1.10.8",
  date: "2026-03-10",
  changes: [
    "Optimized Interactive Floor Plan toolbar for mobile and small screens",
    "Added hamburger menu to collapse secondary toolbar actions on mobile",
    "Primary actions (Add Drop Point, Add Room View) always visible on mobile toolbar",
    "Compact zoom controls for mobile floor plan view",
  ]
}
```

This also triggers a GitHub sync automatically on save.

