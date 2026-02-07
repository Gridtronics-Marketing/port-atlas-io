

# Infrastructure Topology -- Per-Location Add-On (Updated)

## Clarification Applied

MDF and IDF nodes are sourced from the `distribution_frames` table (which has `frame_type: 'MDF' | 'IDF'`). Drop points connect to these frames via the `type_specific_data.mdf_idf_connections` array (each entry has `frame_id`, `port`, `notes`). Backbone cables provide frame-to-frame physical edges. No separate "MDF/IDF drop point types" are used as topology nodes.

## Data Sources (All Existing)

```text
distribution_frames  -->  MDF / IDF nodes (frame_type, floor, room, name)
backbone_cables      -->  Frame-to-frame physical edges (cable_type, origin/dest)
drop_points          -->  Endpoints, linked to frames via type_specific_data.mdf_idf_connections
```

## What Gets Built

### 1. Topology Normalizer Utility (`src/lib/topology-normalizer.ts`)

Pure functions that take raw data and produce the strict JSON output:

- **normalizeFrameName(frame)**: e.g. "2nd Floor IDF" becomes "IDF-F2", unnamed MDF on floor 1 becomes "MDF-F1"
- **classifyDropPoint(point_type)**: Maps existing types to topology classifications (wifi -> WiFi AP, camera -> Camera, av -> TV / Display, data -> Data, access_control -> IoT, other -> unknown)
- **buildTopology(location, frames, cables, dropPoints)**: Assembles the full JSON structure by:
  - Converting each `distribution_frame` into a topology node
  - Converting each `backbone_cable` into an edge (using origin/destination frame references)
  - For each drop point, reading `type_specific_data.mdf_idf_connections` to resolve which frame (node) it connects to
  - Flagging ambiguities (unknown types, missing connections) into an `ai_flags` array

### 2. Topology Hook (`src/hooks/useInfrastructureTopology.ts`)

- Takes `locationId`
- Calls existing hooks: `useDistributionFrames`, `useBackboneCables`, `useDropPoints`
- Passes data through `buildTopology()` from the normalizer
- Returns `{ topology, loading, flags }` -- no new database table needed initially

### 3. Topology View Component (`src/components/InfrastructureTopologyView.tsx`)

UI showing:
- **Summary cards**: Total MDFs, IDFs, drop points, connections, flagged items
- **Hierarchical tree**: Location -> MDF/IDF nodes -> connected drop points (grouped by frame via `mdf_idf_connections`)
- **Edge list**: Frame-to-frame backbone cable connections with media type
- **Flags panel**: Items marked "unknown" or missing connections, for human review
- **Export button**: Downloads the strict JSON format

### 4. Integration into Riser Diagram Viewer

Add a "Topology" sub-tab under the "Physical Infrastructure" tab in `RiserDiagramViewer.tsx` (alongside Interactive Diagram, Backbone Cables, Distribution Frames, Work Orders).

### 5. Version Bump

Update `src/lib/version.ts` to v1.10.6 with changelog entry.

## Files

| Action | File |
|--------|------|
| Create | `src/lib/topology-normalizer.ts` |
| Create | `src/hooks/useInfrastructureTopology.ts` |
| Create | `src/components/InfrastructureTopologyView.tsx` |
| Edit   | `src/components/RiserDiagramViewer.tsx` (add Topology tab) |
| Edit   | `src/lib/version.ts` (bump to v1.10.6) |

## Drop Point Classification Map

| DB point_type | Topology Classification |
|---------------|------------------------|
| wifi | WiFi AP |
| camera | Camera |
| av | TV / Display |
| data | Data |
| access_control | IoT |
| mdf | (skip -- these are represented as nodes via distribution_frames) |
| idf | (skip -- same as above) |
| other | unknown (flagged) |

## JSON Export Format

```text
{
  "location": { "id": "uuid", "name": "Building A" },
  "nodes": [
    { "id": "frame-uuid", "type": "MDF", "normalized_name": "MDF-F1", "floor": 1, "room": "TR-101" }
  ],
  "drop_points": [
    { "id": "dp-uuid", "label": "DP-101", "classification": "WiFi AP", "floor": 2, "room": "Lobby", "parent_node_id": "frame-uuid", "port": "Panel 1, Port 12" }
  ],
  "edges": [
    { "from": "frame-uuid-1", "to": "frame-uuid-2", "media": "fiber", "cable_label": "BC-001" }
  ]
}
```

No database migration needed -- this is a read-only aggregation layer over existing data.

