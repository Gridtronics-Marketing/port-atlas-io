

# Fix Location Delete Button Placement and Edit Location Failure

## Issue 1: Move Delete Button deeper
The Delete button is currently shown directly on the LocationDetailsModal header alongside Edit. It should only be accessible from within the Edit Location modal (AddLocationModal) to prevent accidental deletion.

### Changes:
**`src/components/LocationDetailsModal.tsx`** (lines 266-298):
- Remove the entire Delete button + AlertDialog block from the header
- Keep the Edit Location button as-is

**`src/components/AddLocationModal.tsx`**:
- Accept new props: `onDeleteLocation?: (id: string) => void`
- When editing (`isEditing` is true), add a Delete button at the bottom of the modal (inside the footer, left-aligned) with the same AlertDialog confirmation pattern
- This makes deletion a two-step process: Edit Location → Delete

**`src/components/LocationGrid.tsx`**:
- Pass `deleteLocation` to the `AddLocationModal` as `onDeleteLocation` prop (it already has `editingLocation` state)

## Issue 2: Fix "Failed to update location" error
The `handleSubmit` in `AddLocationModal` sends `locationData` with hardcoded `status: "Active"` and `completion_percentage: 0` on every update, overwriting existing values. More critically, the Supabase `.update()` call may fail because:

1. The `locationData` object includes fields that shouldn't change during edit (status, completion_percentage)
2. The update may be sending `project_id: null` which could violate constraints

### Changes:
**`src/components/AddLocationModal.tsx`** (handleSubmit, ~line 234-254):
- When editing, only send the fields that the edit form actually controls (name, address, building_type, floors, access_instructions, contact_onsite, contact_phone, client_id, latitude, longitude)
- Do NOT send `status`, `completion_percentage`, or `project_id` during updates
- Preserve existing values for fields not in the edit form

**`src/hooks/useLocations.ts`** (updateLocation, ~line 237-268):
- Strip out any joined/virtual fields (`client`, `project`, `drop_points_count`) before sending to Supabase, as these are not real columns and will cause the update to fail

