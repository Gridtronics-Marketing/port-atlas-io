

# Fix: Room View Photos Not Showing When Clicked from Floor Plan

## Problem
When clicking a room view marker on the **Floor Plan** tab, the dialog that opens (`RoomViewDetailDialog` inside `ClientFloorPlanViewer.tsx`) is a simple inline component that only shows the main photo and basic details. It does NOT have the "Details" and "Photos" tabs.

The tabbed UI with the photos gallery was added to the **Room Views tab** (`ClientRoomViewList.tsx`), but not to this floor plan dialog.

## Solution

Update the inline `RoomViewDetailDialog` at the bottom of `ClientFloorPlanViewer.tsx` (lines 330-370) to:

1. Import and use the `useRoomViewPhotos` hook to fetch additional photos for the selected room view
2. Add the same tabbed layout (Details + Photos) that already exists in `ClientRoomViewList`
3. Display photos in a read-only grid with descriptions and timestamps

## Technical Details

### File: `src/components/ClientFloorPlanViewer.tsx`

- Import `useRoomViewPhotos` from `@/hooks/useRoomViewPhotos`
- Import `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` from `@/components/ui/tabs`
- Import `Badge` and `ImageIcon` icon
- Convert `RoomViewDetailDialog` from an arrow function to a proper component (so hooks can be used)
- Add `useRoomViewPhotos(roomView.id)` inside the component
- Replace the simple content with a `Tabs` container containing:
  - **Details tab**: existing photo + metadata (floor, description)
  - **Photos tab**: grid of additional photos with badge count, loading state, and empty state

No database changes needed -- the RLS policy from v1.10.4 already grants client portal users access to `room_view_photos`.

