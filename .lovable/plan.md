

# Fix Context Menu Not Opening on Right-Click

## Problem

The `ContextMenuTrigger` uses `asChild` but wraps a React Fragment (`<>...</>`). The `asChild` pattern from Radix requires a **single DOM element** child that can accept a ref. Fragments cannot receive refs, so the context menu never activates.

Additionally, the `ContextMenu` component is nested inside `TooltipTrigger asChild`, creating another `asChild`-wrapping-non-element issue.

## Solution

Restructure the nesting so that:
1. `ContextMenu` is the outermost wrapper (not inside `TooltipTrigger`)
2. `ContextMenuTrigger asChild` wraps a **single `div`** (not a fragment)
3. The label element moves inside that single wrapper div
4. `Tooltip` wraps the trigger div inside the context menu trigger

### New structure (per marker):

```text
ContextMenu
  ContextMenuTrigger asChild
    div (single wrapper element - receives ref)
      div (marker circle)
      div (label, if visible)
  ContextMenuContent
    ContextMenuItem (Edit)
    ContextMenuItem (Lock/Unlock)
    ContextMenuSeparator
    ContextMenuItem (Delete)
```

The Tooltip can either wrap around the ContextMenuTrigger's child div or be removed from the individual markers (since the tooltip info is already in the persistent labels). The simplest fix is to keep the Tooltip but restructure so it works:

```text
TooltipProvider
  ContextMenu
    Tooltip
      TooltipTrigger asChild
        ContextMenuTrigger asChild
          div.wrapper  <-- single DOM element, receives both refs
            div.marker
            div.label
      TooltipContent
    ContextMenuContent
```

This way both `asChild` props merge onto the same single `div`, and both the tooltip and context menu function correctly.

## Changes

### `src/components/InteractiveFloorPlan.tsx` (~lines 954-1048)

Replace the marker rendering block so that:
- `ContextMenu` is outermost
- `Tooltip` is inside `ContextMenu` 
- `TooltipTrigger asChild` > `ContextMenuTrigger asChild` > single `div` wrapper
- `ContextMenuContent` is a sibling of `Tooltip` (both inside `ContextMenu`)
- The wrapper `div` uses `position: absolute` and the same coordinate styles, containing both the marker circle and the label

No other files are changed. All existing drag, click, lock/unlock, and delete logic remains identical.
