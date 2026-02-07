

## Fix: Client Portal Dashboard Shows Empty/Loading State

### Root Cause Analysis

After investigating the database and code, I found **four interconnected problems**:

#### 1. Loading State Bug (Code)
`useClientPortalData.ts` initializes `loading = true` but the `fetchAllData` function returns early (without setting `loading = false`) when `isClientPortalUser` or `linkedClientId` aren't ready yet. This causes the skeleton loading screen to display forever.

#### 2. Missing `granted_client_id` Column (Database)
The `location_access_grants` table does NOT have a `granted_client_id` column, but the hook queries `.or('granted_client_id.eq.${linkedClientId}')`. This query silently fails, returning zero results.

#### 3. Client Portal User Not in Organization Members (Database)
The KH Dearborn portal user (`4226f60e-...`) has NO entry in `organization_members`. Per the architecture, client portal users should remain members of the parent organization with a restricted role. Without this, every RLS policy that checks `get_user_organizations(auth.uid())` blocks them from reading locations, projects, and drop points.

#### 4. No Location Access Grants Exist (Database)
The `location_access_grants` table is completely empty. Even after fixing the column and RLS, the client would see zero locations without grants being created.

---

### Fix Plan

#### Step 1: Database Migration

A single migration that:

1. **Adds `granted_client_id` column** to `location_access_grants` with a foreign key to `clients(id)`
2. **Adds the KH Dearborn portal user** to `organization_members` with role `'viewer'` in the parent org (`a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
3. **Creates a location access grant** linking the "KH Dearborn" location (`1d72c5bd-...`) to client `247da766-...` via the new `granted_client_id` column
4. **Updates the RLS policy** on `location_access_grants` to also allow access when `granted_client_id` matches the user's linked client (via `client_portal_users`)
5. **Updates the RLS policy** on `locations` to allow client portal users to see locations they've been granted access to via `granted_client_id`

#### Step 2: Fix Loading State in `useClientPortalData.ts`

- Always set `loading = false` after the effect runs, even when `isClientPortalUser` or `linkedClientId` are not yet available
- This prevents the infinite skeleton screen

#### Step 3: Fix the Query in `useClientPortalData.ts`

- Update the `location_access_grants` query to properly use the now-existing `granted_client_id` column

---

### Technical Details

**Migration SQL overview:**

```text
-- Add column
ALTER TABLE location_access_grants ADD COLUMN granted_client_id UUID REFERENCES clients(id);

-- Add portal user to org members (viewer role)
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('a1b2c3d4-...', '4226f60e-...', 'viewer');

-- Create location grant for KH Dearborn location -> KH Dearborn client
INSERT INTO location_access_grants (location_id, location_organization_id, granted_client_id, access_level)
VALUES ('1d72c5bd-...', 'a1b2c3d4-...', '247da766-...', 'view');

-- Update RLS: allow client portal users to see their grants
DROP POLICY "View location access grants" ON location_access_grants;
CREATE POLICY "View location access grants" ON location_access_grants FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR location_organization_id IN (SELECT get_user_organizations(auth.uid()))
  OR granted_organization_id IN (SELECT get_user_organizations(auth.uid()))
  OR granted_client_id IN (
    SELECT client_id FROM client_portal_users WHERE user_id = auth.uid()
  )
);
```

**Code fix in `useClientPortalData.ts`:**
- Move `setLoading(false)` into a `finally` block
- Handle the case where `isClientPortalUser`/`linkedClientId` are falsy by setting loading to false immediately

### Files to Modify

| File | Change |
|------|--------|
| New migration SQL | Add column, org member, grant, update RLS policies |
| `src/hooks/useClientPortalData.ts` | Fix loading state, ensure query works with new column |

