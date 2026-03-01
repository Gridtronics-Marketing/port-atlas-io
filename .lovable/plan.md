

# Add Context Menu, Fix Mobile Long-Press Conflicts, and Verify Coordinate Mapping

## Overview

Three targeted improvements to `src/components/InteractiveFloorPlan.tsx`:

1. Replace the simple click-to-open-details interaction on drop point markers with a **right-click context menu** using the existing shadcn `ContextMenu` component, offering Edit, Delete, Lock/Unlock, and Move actions.
2. **Fix mobile long-press conflicts** by adding CSS properties to the floor plan container and image that prevent iOS "Save Image" and Android "Search with Google Lens" callouts from interfering with marker interactions.
3. Coordinate mapping is already correct (percentage-based), so no changes needed there -- just a confirmation.

---

## Changes

### `src/components/InteractiveFloorPlan.tsx`

**1. New imports (line 2 area)**

Add the `ContextMenu` primitives:
```typescript
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Lock, Unlock } from 'lucide-react';
```

**2. Add CSS to prevent mobile long-press browser defaults (line ~849-863)**

On the main floor plan container `div` (the one with `ref={containerRef}`), add these inline styles:

```typescript
style={{
  // ...existing styles...
  WebkitTouchCallout: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none',
}}
```

On the `<img>` tag (~line 867), add the same properties plus `draggable={false}`:

```tsx
<img
  src={actualFileUrl}
  alt={`Floor ${floorNumber} plan`}
  className="w-full h-auto"
  draggable={false}
  style={{
    display: 'block',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  }}
  // ...existing onError...
/>
```

This prevents iOS Safari from showing the "Save Image" callout and Android Chrome from showing "Search with Google Lens" when users long-press on the floor plan or its markers.

**3. Wrap each drop point marker in a `ContextMenu` (~lines 911-977)**

Currently each drop point is wrapped in a `Tooltip` > `TooltipTrigger`. The change wraps each marker in a `ContextMenu` > `ContextMenuTrigger` around the existing marker `div`, and adds a `ContextMenuContent` with actions.

The structure becomes:

```text
<Tooltip>
  <TooltipTrigger asChild>
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <> 
          [existing marker div]
          [existing label div]
        </>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem> Edit Details </ContextMenuItem>
        <ContextMenuItem> Lock / Unlock </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive"> Delete </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  </TooltipTrigger>
  <TooltipContent>...</TooltipContent>
</Tooltip>
```

Context menu actions:
- **Edit Details**: Opens the `DropPointDetailsModal` (same as current click behavior)
- **Lock / Unlock**: Toggles the `is_locked` field via `updateDropPoint` with a toast confirmation
- **Delete**: Opens a confirmation dialog (reuses existing delete pattern) then calls `deleteDropPoint` (will need to destructure from `useDropPoints`)

**4. Add a `handleDeleteDropPoint` function and `handleToggleLock` function**

```typescript
const handleToggleLock = async (point: any) => {
  try {
    await updateDropPoint(point.id, { is_locked: !point.is_locked });
    toast({
      title: point.is_locked ? "Drop Point Unlocked" : "Drop Point Locked",
      description: `${point.label || 'Drop point'} has been ${point.is_locked ? 'unlocked' : 'locked'}.`,
    });
  } catch (error) {
    toast({ title: "Error", description: "Failed to update lock status.", variant: "destructive" });
  }
};

const handleDeleteDropPoint = async (point: any) => {
  try {
    await deleteDropPoint(point.id);
    toast({
      title: "Drop Point Deleted",
      description: `${point.label || 'Drop point'} has been removed.`,
    });
  } catch (error) {
    toast({ title: "Error", description: "Failed to delete drop point.", variant: "destructive" });
  }
};
```

This requires destructuring `deleteDropPoint` from the existing `useDropPoints` hook call (line 110).

**5. Add state for context-menu-triggered delete confirmation**

```typescript
const [contextDeleteTarget, setContextDeleteTarget] = useState<any>(null);
```

When "Delete" is chosen from the context menu, set `contextDeleteTarget`. Render an `AlertDialog` (already imported) that confirms deletion, then calls `handleDeleteDropPoint`.

---

## Coordinate Mapping -- No Changes Needed

The existing code already calculates coordinates as percentages of the container dimensions:

```typescript
const x = ((e.clientX - rect.left) / rect.width) * 100;
const y = ((e.clientY - rect.top) / rect.height) * 100;
```

This is correct and consistent across both `InteractiveFloorPlan` and `ClientFloorPlanViewer`. No changes required.

---

## What Stays Unchanged

- All existing click-to-open behavior (left-click still opens details modal)
- Drag-and-drop repositioning logic
- Wire path drawing and rendering
- Room view markers (no context menu added -- can be a follow-up)
- All zoom/pan/scale functionality
- Floor plan upload, export, and delete features

## Technical Notes

- The shadcn `ContextMenu` component is already installed at `@/components/ui/context-menu.tsx`
- On desktop, right-click triggers the context menu; on mobile, long-press triggers it (this is the default Radix behavior)
- The `-webkit-touch-callout: none` CSS property is the standard way to suppress iOS image callouts
- `user-select: none` prevents text selection during drag operations on all platforms
- `draggable={false}` on the `<img>` prevents the browser's native image drag behavior

