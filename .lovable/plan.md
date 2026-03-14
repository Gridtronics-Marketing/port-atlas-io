

# Update Version and Change Log

## Version Bump

Update from **v1.10.6** to **v1.10.7** with today's date (2026-03-01).

## Changes to Record

The following features and fixes were implemented in this session:

1. **Fixed Google Places Autocomplete selection in dialogs** -- Address suggestions can now be clicked without Radix Dialog stealing focus or closing
2. **Fixed interactive map not loading after address selection** -- Deferred map initialization to ensure DOM container is mounted before attaching Google Maps
3. **Fixed Google Maps API race condition** -- Added polling mechanism so multiple components correctly detect when the Maps script finishes loading
4. **Added right-click context menus to room views and wire paths on floor plans** -- Room views now have "View Details" and "Delete" options; wire paths auto-select on right-click to reveal the action panel

## File Changes

### `src/lib/version.ts`

- Update `APP_VERSION` from `"1.10.6"` to `"1.10.7"`
- Add a new entry at the top of `VERSION_HISTORY` array:

```typescript
{
  version: "1.10.7",
  date: "2026-03-01",
  changes: [
    "Fixed Google Places Autocomplete selection inside dialogs (focus trap and pointer event conflicts)",
    "Fixed interactive satellite map not loading after address selection or tab switch",
    "Fixed Google Maps API loading race condition when multiple components request the script",
    "Added right-click context menus to room views and wire paths on interactive floor plans",
    "Room view context menu with View Details and Delete actions",
    "Wire path right-click selects path and reveals action panel with edit/delete options",
    "Added delete confirmation dialogs for room views and wire paths (replaces native confirm)",
  ]
}
```

