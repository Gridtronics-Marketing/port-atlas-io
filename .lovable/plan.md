
# Add Cable Count Column to Drop Point Management Table

## What's Happening

The `cable_count` field already exists end-to-end in the system:
- **Database**: `drop_points.cable_count INTEGER DEFAULT 1` (migration already applied)
- **Hook**: `useDropPoints.ts` fetches and validates it (`cable_count: point.cable_count ?? 0`)
- **Type**: Defined in the `DropPoint` interface as `cable_count: number`
- **Detail modal**: Shows and edits it correctly in `DropPointDetailsModal.tsx`

It is only missing from the **list table view** in `DropPointList.tsx`. This is a minimal, surgical change.

## Files to Change

### `src/components/DropPointList.tsx` — Two targeted edits

**Edit 1 — Add the column header** (line 222, after the "Patch Panel" `<TableHead>`):

Current table headers:
```
Label | Room | Floor | Type | Status | Cable ID | Patch Panel | (actions)
```

New table headers:
```
Label | Room | Floor | Type | Status | Cables | Cable ID | Patch Panel | (actions)
```

Add between Status and Cable ID:
```tsx
<TableHead className="text-center">Cables</TableHead>
```

**Edit 2 — Add the column cell** in each table row (after the Status `<TableCell>`):

```tsx
<TableCell className="text-center">
  {point.cable_count > 0 ? (
    <Badge variant="outline" className="font-mono text-xs gap-1">
      <Cable className="h-3 w-3" />
      {point.cable_count}
    </Badge>
  ) : (
    <span className="text-muted-foreground text-xs">—</span>
  )}
</TableCell>
```

The `Cable` icon is already imported in `DropPointList.tsx` (line 2), so no new imports are needed.

## Visual Result

Each row in the drop points table will show a small badge like `🔌 2` in the Cables column, making it immediately clear how many cables each drop point has. Drop points with `cable_count = 0` (unset) will show a dash.

## Technical Notes

- No database changes required — field is already fetched
- No hook changes required — field is already in the response
- No new dependencies — `Cable` icon already imported, `Badge` already imported
- The column appears between **Status** and **Cable ID** — logical grouping since cable count relates to the physical installation
- `cable_count` defaults to `0` in the hook's defensive mapping, so no risk of undefined/null rendering errors
