

# Add Right-Click Context Menu to Room Views and Wire Paths

## Overview

Drop points already have a right-click context menu with Edit, Lock/Unlock, and Delete actions. Room views and wire paths currently lack this -- room views only open on click, and wire paths show a bottom panel. This change adds consistent context menus to both.

## Changes

### `src/components/InteractiveFloorPlan.tsx`

**1. Import `deleteRoomView` from `useRoomViews` hook**

Update the destructured values on line 120 to also pull `deleteRoomView`:
```tsx
const { roomViews, loading: roomViewsLoading, updateRoomView, deleteRoomView, fetchRoomViews } = useRoomViews(validLocationId);
```

**2. Add state for room view and wire path delete confirmation targets**

Add new state variables (alongside the existing `contextDeleteTarget` for drop points):
```tsx
const [contextDeleteRoomViewTarget, setContextDeleteRoomViewTarget] = useState<any>(null);
const [contextDeleteWirePathTarget, setContextDeleteWirePathTarget] = useState<WirePath | null>(null);
```

**3. Wrap room view markers with ContextMenu (lines ~1063-1111)**

Replace the current `Tooltip`-only wrapper with `ContextMenu > Tooltip > ContextMenuTrigger` (same pattern as drop points). The context menu will have:
- **View Details** -- opens the room view modal (same as current click behavior)
- **Delete** -- sets `contextDeleteRoomViewTarget` to trigger a confirmation dialog

**4. Wrap wire path `<g>` elements with a context menu approach**

Since wire paths are SVG elements and ContextMenu requires DOM elements, add a right-click handler (`onContextMenu`) on the wire path `<g>` element that opens a small popover/action panel. Alternatively, use the existing selected wire path panel pattern but trigger it on right-click as well. The pragmatic approach:
- On right-click of a wire path, set it as `selectedWirePath` (reusing the existing bottom panel with Edit/Delete actions)
- This gives consistent access to wire path actions via both click and right-click

**5. Add confirmation AlertDialogs for room view and wire path deletion**

Add two new `AlertDialog` components (matching the existing drop point delete confirmation pattern):
- Room view delete confirmation: calls `deleteRoomView(id)` on confirm
- Wire path delete confirmation: calls `handleDeleteWirePath(id)` on confirm

### Summary of user experience
- **Drop points**: Right-click shows Edit Details, Lock/Unlock, Delete (unchanged)
- **Room views**: Right-click shows View Details, Delete (new)
- **Wire paths**: Right-click selects the path and shows the existing action panel with Delete (enhanced)

