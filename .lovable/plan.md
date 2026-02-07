

## Fix Client Portal: Simplified Views, Project Requests, Interactive Floor Plan Drop Points, and Service Requests Page

### Problems Identified

1. **Locations page (`/locations`)** shows the full admin layout (add location button, metrics, search/filter, LocationGrid) instead of a simplified client view showing only granted locations.

2. **Projects page (`/projects`)** shows the full admin project management interface (create/edit/delete projects, budgets, progress bars) instead of a read-only list with a "Request New Project" form.

3. **Floor Plan**: Drop points and room views are visible but not clickable to open details. Notes (walk-through notes, documentation) are not shown on the client location detail page.

4. **Service Requests page (`/service-requests`)** loads a blank page -- likely the `CreateServiceRequestModal` or the data fetch is failing silently.

5. **Clients cannot place drop points on the floor plan** -- they should be able to click on the floor plan to place a "proposed" drop point (shown as a grey icon) which creates a service request for parent org approval.

---

### Fix Plan

#### 1. Locations Page: Client Portal View

Modify `src/pages/Locations.tsx` to detect `isClientPortalUser` and render a simplified layout:
- Show only granted locations as clickable cards (using `useClientPortalData` or `useClientLocations`)
- Include the "Request New Service Location" button
- Remove admin metrics, search filters, and "Add Location" button
- Each location card navigates to `/client-locations/{id}`

#### 2. Projects Page: Client Portal View

Modify `src/pages/Projects.tsx` to detect `isClientPortalUser` and render:
- A read-only list of projects linked to the client (via `useClientPortalData().clientProjects`)
- A "Request New Project" button that opens a dialog (new `RequestProjectModal` component)
- The request creates a `service_request` with `request_type: 'new_project'` containing project details in the description
- Remove all admin capabilities (create/edit/delete projects, budget info, progress tracking)

#### 3. Floor Plan: Clickable Drop Points and Client Drop Point Placement

**Make markers clickable** in `ClientFloorPlanViewer.tsx`:
- Clicking a drop point opens the `ClientDropPointDetail` modal
- Clicking a room view opens the room view detail dialog

**Add client drop point placement mode**:
- Add a "Place New Drop Point" button on the floor plan
- When active, clicking on the floor plan captures x/y coordinates
- Opens a form dialog to describe the drop point (label, type, floor, description)
- Creates a service request with `request_type: 'new_drop_point'` AND creates a `drop_points` record with `status: 'Proposed'` and coordinates
- Proposed drop points render as grey circles on the floor plan
- Parent org approves by changing status from 'Proposed' to 'Planned' or 'Active'

**Add Notes/Documentation tab** to `ClientLocationDetail.tsx`:
- New "Notes" or "Documentation" tab showing walk-through notes (read-only via `WalkThroughNotesList` without add/delete) and documentation files

#### 4. Fix Service Requests Blank Page

Debug and fix the `ServiceRequests` page for client portal users. The likely issue is the `useServiceRequests` hook failing because `requesting_organization_id` does not match the client portal user's organization context. Will trace the data flow and fix the query.

#### 5. Database Changes

- Add `'Proposed'` as a valid drop point status rendered as grey in all color maps
- Potentially add RLS policy to allow client portal users to INSERT drop points with status `'Proposed'` only

---

### Technical Details

#### Files to Create

| File | Purpose |
|------|---------|
| `src/components/RequestProjectModal.tsx` | Dialog form for clients to request a new project via service request |

#### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Locations.tsx` | Add `isClientPortalUser` check, render simplified client location list |
| `src/pages/Projects.tsx` | Add `isClientPortalUser` check, render read-only project list with request button |
| `src/components/ClientFloorPlanViewer.tsx` | Make drop points/room views clickable (open detail modals), add drop point placement mode with grey "Proposed" markers |
| `src/pages/ClientLocationDetail.tsx` | Add "Notes" tab with read-only walk-through notes and documentation |
| `src/components/ClientDropPointList.tsx` | Add grey status badge for "Proposed" drop points |
| `src/pages/ServiceRequests.tsx` | Debug and fix blank page for client portal users |
| `src/hooks/useServiceRequests.ts` | Fix query for client portal context if needed |
| `src/components/ClientServiceRequestButton.tsx` | Extend to support `new_project` request type |

#### Database Migration

```text
-- Allow client portal users to insert proposed drop points
CREATE POLICY "Client portal users can insert proposed drop points"
ON public.drop_points FOR INSERT
WITH CHECK (
  status = 'Proposed'
  AND public.has_location_access(location_id)
);

-- Update status color maps to include 'Proposed' -> grey
```

#### Status Color Updates

All components that render drop point status colors will be updated to include:
- `Proposed` -> grey (`bg-gray-400`) -- indicates client-placed, awaiting approval

#### Floor Plan Interaction Flow

1. Client clicks "Place New Drop Point" button on floor plan
2. Floor plan enters placement mode (cursor changes to crosshair)
3. Client clicks on the floor plan image to set x/y coordinates
4. A form dialog opens asking for: label, point type, description
5. On submit: INSERT a `drop_points` row with `status: 'Proposed'` + coordinates, and CREATE a `service_request` with `request_type: 'new_drop_point'` linking to that drop point
6. The proposed point appears immediately as a grey dot on the floor plan
7. Parent org sees the service request, reviews the location on the plan, and approves (changes status to 'Planned')

