

# Fix Client Portal Floor Plan Colors to Match Admin

## Problem
The client portal's `getStatusColor` in `ClientFloorPlanViewer.tsx` checks for **Title Case** statuses (`"Planned"`, `"Roughed In"`) but the database stores **lowercase with underscores** (`planned`, `roughed_in`). No cases match, so every marker falls through to `default: return "bg-blue-500"` — making them all blue.

## Fix

### File: `src/components/ClientFloorPlanViewer.tsx`

Replace the `getStatusColor` function (lines 120-133) to match the admin's `getDropPointColor` from `InteractiveFloorPlan.tsx`, using lowercase DB values and including border colors:

```typescript
const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case "planned": return "bg-red-500 border-red-600";
    case "roughed_in": return "bg-orange-500 border-orange-600";
    case "finished": return "bg-green-500 border-green-600";
    case "tested": return "bg-green-500 border-green-600";
    case "proposed": return "bg-gray-400 border-gray-500";
    case "active":
    case "installed": return "bg-green-500 border-green-600";
    case "inactive":
    case "issue": return "bg-red-500 border-red-600";
    case "pending": return "bg-yellow-500 border-yellow-600";
    default: return "bg-red-500 border-red-600";
  }
};
```

Also add the tested checkmark overlay to the drop point marker div (around line 225) to match admin behavior — show a `✓` when `dp.status === 'tested'`.

