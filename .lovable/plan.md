

# Fix: Client Portal Drop Point Photos Not Showing

## Problem
The `drop_point_photos` table has RLS policies that only allow staff roles (`admin`, `hr_manager`, `project_manager`, `technician`) to read photos. Client portal users don't have any of these roles, so the query returns empty results -- photos appear missing even though they exist in the database.

## Solution
Add a new RLS SELECT policy on `drop_point_photos` that grants read access to client portal users for photos belonging to drop points at locations they have been granted access to.

## Technical Details

### 1. Database Migration -- New RLS Policy
Add a policy that allows client portal users to view photos for drop points at their granted locations:

```sql
CREATE POLICY "Client portal users can view drop point photos"
ON public.drop_point_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.drop_points dp
    WHERE dp.id = drop_point_photos.drop_point_id
    AND has_location_access(dp.location_id)
  )
);
```

This reuses the existing `has_location_access()` function which already checks:
- Super admin access
- Organization membership
- Location access grants (used by client portal users)

### 2. No Code Changes Needed
The `ClientDropPointDetail` component already queries `drop_point_photos` correctly. The only blocker is the missing RLS policy.

### 3. Version Bump
Update `src/lib/version.ts` to `v1.10.2` with a changelog entry for this fix.

