

# Add Topology as a Direct Tab on Location Details Modal

## Overview

Move the Infrastructure Topology view from its current nested position (inside Riser Diagram Viewer sub-tabs) to a top-level tab in the Location Details Modal, making it directly accessible alongside Details, Floor Plans, Drop Points, Team & Notes, and Riser Diagrams.

## What Changes

### Location Details Modal (`src/components/LocationDetailsModal.tsx`)

- Expand the tab grid from 5 columns to 6
- Add a new **Topology** tab trigger with a network/share icon
- Add a new `TabsContent` for `"topology"` that renders the existing `InfrastructureTopologyView` component
- Import `InfrastructureTopologyView` and the icon

### Riser Diagram Viewer (`src/components/RiserDiagramViewer.tsx`)

- Remove the Topology sub-tab from the physical infrastructure section (since it now lives at the top level)

## Technical Details

### Files to Edit

| File | Change |
|------|--------|
| `src/components/LocationDetailsModal.tsx` | Add Topology tab (import component, add TabsTrigger + TabsContent) |
| `src/components/RiserDiagramViewer.tsx` | Remove the Topology sub-tab to avoid duplication |

### Tab Layout (After Change)

```text
Details | Floor Plans | Drop Points | Team & Notes | Riser Diagrams | Topology
```

The Topology tab will pass `location.id` and `location.name` directly to the `InfrastructureTopologyView` component, giving it the same data access it already has.

