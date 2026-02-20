

# Add Cable Naming to Drop Point Edit Modal

## Problem

When **adding** a new drop point via `AddDropPointModal`, users can set a cable count and then name each individual cable using the `CableNameFields` component. However, when **editing** an existing drop point in `DropPointDetailsModal`, this cable naming UI is completely absent -- users can only change the cable count number but cannot name or rename individual cables.

## What Changes

### `src/components/DropPointDetailsModal.tsx` -- 3 edits

**Edit 1 -- Add import and state**

- Import `CableNameFields` from `@/components/CableNameFields`
- Add a `cableNames` state: `useState<Record<number, string>>({})`
- In the existing `useEffect` that initializes edit data from `dropPoint`, also initialize `cableNames` from `dropPoint.type_specific_data.cable_names` (or empty object if none)

**Edit 2 -- Add `CableNameFields` below the cable count input in editing mode**

After the second "Number of Cables" field (around line 532), when `isEditing` is true and `cable_count > 1`, render:

```tsx
{isEditing && (editData.cable_count ?? 0) > 1 && (
  <CableNameFields
    cableCount={editData.cable_count as number}
    cableNames={cableNames}
    onChange={setCableNames}
  />
)}
```

When NOT editing and cable names exist, show a read-only list of the named cables.

**Edit 3 -- Persist cable names in `handleSave`**

Update the `handleSave` function to merge cable names into `typeSpecificData` before saving, matching the exact logic from `AddDropPointModal`:

```typescript
// Inside handleSave, before building dataToSave:
const cableCount = editData.cable_count ?? 0;
if (cableCount > 1) {
  const names: Record<number, string> = {};
  for (let i = 0; i < cableCount; i++) {
    if (cableNames[i]?.trim()) {
      names[i] = cableNames[i].trim();
    }
  }
  if (Object.keys(names).length > 0) {
    mergedTypeData.cable_names = names;
  } else {
    delete mergedTypeData.cable_names;
  }
} else {
  delete mergedTypeData.cable_names;
}
```

### Additional cleanup

The "Number of Cables" field currently appears **twice** in the edit form (lines 467-480 and lines 507-532 -- a duplication bug). The first occurrence (lines 467-480) will be removed as part of this change to clean up the form.

## Technical Notes

- **No new dependencies** -- `CableNameFields` component already exists and is reused as-is
- **No database changes** -- cable names are already stored in the `type_specific_data` JSONB column
- **Matches the Add flow exactly** -- same component, same data shape (`type_specific_data.cable_names`), same persistence logic
- The `handleCancel` already resets `typeSpecificData` from the drop point, so cable name reset on cancel works automatically

