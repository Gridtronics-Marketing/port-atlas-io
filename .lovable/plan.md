

# Fix: Client Portal Visibility for Location Changes

## Problem
When the parent organization updates location data (floor names, drop point labels, room view names, walk-through notes, documentation files, or customer notes), client portal users cannot see many of these changes because the underlying tables have RLS SELECT policies restricted to staff roles only.

## Tables Affected

| Table | Current SELECT Policy | Client Access? |
|---|---|---|
| `locations` | Has `org_isolation_locations` with `location_access_grants` check | Yes (already works) |
| `drop_points` | `org_isolation_drop_points` checks org membership | Yes (already works) |
| `room_views` | Has `Client portal users can view room views` policy | Yes (already works) |
| `walk_through_notes` | Staff roles only | **No -- needs fix** |
| `documentation_files` | Staff roles only | **No -- needs fix** |
| `customer_notes` | Staff roles only + org isolation | **No -- needs fix** |

## Solution
Add new RLS SELECT policies on the three blocked tables, using the existing `has_location_access()` function to grant read access to client portal users for their granted locations.

## Technical Details

### 1. Database Migration -- Three New RLS Policies

**Walk-Through Notes:**
```sql
CREATE POLICY "Client portal users can view walk through notes"
ON public.walk_through_notes FOR SELECT
USING (has_location_access(location_id));
```

**Documentation Files:**
```sql
CREATE POLICY "Client portal users can view documentation files"
ON public.documentation_files FOR SELECT
USING (has_location_access(location_id));
```

**Customer Notes:**
```sql
CREATE POLICY "Client portal users can view customer notes"
ON public.customer_notes FOR SELECT
USING (has_location_access(location_id));
```

All three policies leverage the `has_location_access()` function which already handles:
- Super admin access
- Organization membership
- Location access grants (including `granted_client_id` for portal users)

### 2. No Frontend Code Changes Needed
The client portal components (`ClientLocationNotesTab`, `ClientFloorPlanViewer`, etc.) already query these tables correctly. The data is simply being blocked by RLS.

### 3. Version Bump
Update `src/lib/version.ts` to `v1.10.3` with a changelog entry documenting the fix.

