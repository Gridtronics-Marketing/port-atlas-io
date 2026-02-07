

# Fix: Room View Photos Tab Missing for Client Portal Users

## Problem
Two issues prevent client portal users from seeing additional room view photos:

1. **Missing UI**: The `ClientRoomViewList` component only shows a simple dialog with the original room view photo. It does not have the "Photos" tab that the staff `RoomViewModal` has, so additional photos uploaded to `room_view_photos` are never displayed.

2. **Outdated RLS Policy**: The existing client SELECT policy on `room_view_photos` uses an old access pattern (joining through `projects -> clients -> contact_email`). The current architecture uses `client_portal_users` + `location_access_grants` + `has_location_access()`, so the old policy likely doesn't match.

## Solution

### 1. Database -- Replace Outdated RLS Policy

Drop the old client policy and create a new one using `has_location_access()`:

```sql
DROP POLICY IF EXISTS "Clients can view room view photos for their locations" 
  ON public.room_view_photos;

CREATE POLICY "Client portal users can view room view photos"
ON public.room_view_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_views rv
    WHERE rv.id = room_view_photos.room_view_id
    AND has_location_access(rv.location_id)
  )
);
```

### 2. Frontend -- Add Photos Tab to Client Room View Detail

Update `src/components/ClientRoomViewList.tsx` to:
- Import and use the `useRoomViewPhotos` hook to fetch additional photos for a selected room view
- Replace the simple detail dialog with a tabbed layout (Details + Photos) similar to the staff `RoomViewModal`
- Display the photo gallery in a read-only mode (no upload/delete buttons for clients)
- Show photo count badge on the Photos tab

### 3. Version Bump

Update `src/lib/version.ts` to `v1.10.4` with a changelog entry.

## Technical Details

### UI Changes (`ClientRoomViewList.tsx`)
- Add `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` imports
- Add state for `useRoomViewPhotos(selectedView?.id)` 
- Detail dialog gets two tabs: "Details" (existing content) and "Photos" (gallery of `room_view_photos`)
- Photos displayed as a read-only image grid with descriptions and timestamps
- No edit/delete/upload controls since this is the client-facing view
