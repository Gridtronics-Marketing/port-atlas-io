

# Trade Registry and Multi-Trade Layer System

## Overview

Introduce a **Trade Registry** that tags organizations with the trades they perform, assigns each drop point to a single trade, and enables trade-based filtering on both floor plans and the topology diagram. This allows multiple organizations (e.g., Low Voltage + HVAC contractors) to share the same location map while seeing only the layers relevant to them.

## Database Changes

### 1. New `trade_type` enum

A Postgres enum with 23 immutable trade values as specified (low_voltage, electrical, plumbing, hvac, fire_life_safety, access_control, security_surveillance, intrusion_alarm, building_automation, lighting_controls, energy_management, gas, medical_gas, water_treatment, elevator, escalator, av_pro, paging_notification, parking_systems, irrigation, refrigeration, commercial_kitchen, industrial_safety).

### 2. New `organization_trades` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| organization_id | uuid (FK -> organizations) | |
| trade | trade_type | |
| created_at | timestamptz | |
| **unique** | (organization_id, trade) | One row per org-trade pair |

RLS: Users can read trades for organizations they belong to. Admins/owners can insert/delete.

### 3. New `trade` column on `drop_points`

| Column | Type | Notes |
|--------|------|-------|
| trade | trade_type | Nullable initially, defaults to `low_voltage` for existing data |

Each drop point belongs to exactly one trade. This is the filter key for layers.

### 4. Trade grouping reference table (optional, static)

Rather than a DB table, trade groupings (Core Building Systems, Security and Controls, etc.) will be defined as a static TypeScript constant for UI grouping only -- no schema needed.

## Frontend Changes

### New Files

| File | Purpose |
|------|---------|
| `src/lib/trade-registry.ts` | Static trade enum, display names, category groupings, color/icon mappings |
| `src/hooks/useOrganizationTrades.ts` | CRUD hook for `organization_trades` table |
| `src/components/OrganizationTradesManager.tsx` | UI for assigning trades to an organization (used in Org Settings) |

### Modified Files

| File | Change |
|------|--------|
| `src/components/AddDropPointModal.tsx` | Add trade selector dropdown (defaults to org's primary trade) |
| `src/components/DropPointDetailsModal.tsx` | Show/edit trade field |
| `src/components/FloorPlanFilterDialog.tsx` | Add "Trades" filter section with checkboxes grouped by category |
| `src/components/InteractiveFloorPlan.tsx` | Filter rendered drop points by selected trades |
| `src/components/TopologyDiagram.tsx` | Accept trade filter prop; dim/hide nodes not matching selected trades |
| `src/components/InfrastructureTopologyView.tsx` | Add trade filter controls above diagram |
| `src/components/DiagramLayerControls.tsx` | Add trade toggles section |
| `src/components/OrganizationSettings.tsx` | Add "Trades" section using OrganizationTradesManager |
| `src/hooks/useDropPoints.ts` | Include `trade` field in DropPoint interface and queries |

## Trade Registry Constants (src/lib/trade-registry.ts)

```text
TRADE_CATEGORIES:
  Core Building Systems:     low_voltage, electrical, plumbing, hvac, fire_life_safety
  Security & Controls:       access_control, security_surveillance, intrusion_alarm
  Automation & Smart:        building_automation, lighting_controls, energy_management
  Utilities & Specialty:     gas, medical_gas, water_treatment, refrigeration, commercial_kitchen, industrial_safety
  Vertical & Site Systems:   elevator, escalator, parking_systems, irrigation, paging_notification, av_pro
```

Each trade gets a display name, a color, and an icon for consistent rendering across floor plans, topology diagrams, and filters.

## How Filtering Works

- **Floor Plan**: The existing `FloorPlanFilters` interface gains a `trades: string[]` array. Drop points are filtered client-side by matching `dropPoint.trade` against selected trades.
- **Topology Diagram**: A trade filter bar above the SVG lets users toggle trades on/off. Nodes and edges for hidden trades are either removed or rendered at low opacity.
- **Layer Controls**: The `DiagramLayerControls` component gets a new "Trades" section below the existing cable/equipment/visual sections.

## Hard Rules Enforced

1. **Trades are immutable** -- the enum is defined in Postgres; no custom trades per customer.
2. **Drop points belong to exactly one trade** -- single `trade` column, not an array.
3. **Trades do not define geometry** -- all trades share the same spatial map; filtering is purely visual.
4. **Future expansion inside trades** -- new device types are new `point_type` values, not new trades.

## Migration Strategy

- Existing drop points default to `low_voltage` (matching ALJ Solutions' primary trade).
- Organizations with no trades assigned will be prompted to configure trades in Org Settings.
- The trade field on drop points is nullable initially to avoid breaking existing workflows, but the UI will encourage setting it.

