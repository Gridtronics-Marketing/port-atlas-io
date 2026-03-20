

# Batch Drop Point Placement Session

## Problem
Currently, each drop point placement creates its own service request immediately. If a client needs 30 points, the contractor gets 30 separate requests.

## Solution
Convert the placement flow into a **session-based workflow**:
1. Client enters placement mode and clicks to add multiple points (stored in local state as a "draft" list)
2. Each click opens a quick dialog to set label/type — the point is added to the draft list and shown on the floor plan as grey markers
3. A persistent **session panel** at the bottom shows the count and a list of drafted points (with ability to remove individual ones)
4. Client clicks **"Submit Proposal"** once — this inserts all drop points to DB with `status: 'proposed'` and creates **one** service request with a summary description listing all points
5. Clients can edit/add/remove points on pending requests until the request is accepted (status changes from `pending`)

## Database Changes

**New table: `service_request_drop_points`** — links multiple drop points to one service request (replacing the single `drop_point_id` FK on `service_requests`):

```sql
CREATE TABLE public.service_request_drop_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  drop_point_id UUID NOT NULL REFERENCES drop_points(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_request_id, drop_point_id)
);

ALTER TABLE public.service_request_drop_points ENABLE ROW LEVEL SECURITY;

-- RLS: users who can see the service request can see the linked drop points
CREATE POLICY "Users can view linked drop points"
  ON public.service_request_drop_points FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = service_request_id
      AND (
        sr.requesting_organization_id IN (SELECT get_user_organizations())
        OR sr.parent_organization_id IN (SELECT get_user_organizations())
        OR is_super_admin()
      )
    )
  );

CREATE POLICY "Users can insert linked drop points"
  ON public.service_request_drop_points FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = service_request_id
      AND sr.requested_by = auth.uid()
      AND sr.status = 'pending'
    )
  );

CREATE POLICY "Users can delete linked drop points on pending requests"
  ON public.service_request_drop_points FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = service_request_id
      AND sr.requested_by = auth.uid()
      AND sr.status = 'pending'
    )
  );
```

## Files to Create/Modify

### 1. New: `src/components/ClientDropPointPlacementSession.tsx`
The main session component replacing the old single-point dialog. Contains:
- **Draft state**: array of `{ label, pointType, description, floor, x, y }` items
- **"Add Point" mini-dialog**: lightweight form (label + type + optional note) that adds to draft list instead of inserting to DB
- **Session panel**: bottom bar showing draft count, expandable list of points with remove buttons, and "Submit All" button
- **Floor plan ghost markers**: renders draft points as dashed-border grey circles on the floor plan

### 2. Modify: `src/components/ClientFloorPlanViewer.tsx`
- Replace `ClientDropPointPlacementDialog` with new `ClientDropPointPlacementSession`
- `placementMode` becomes a session toggle — stays on until the user submits or cancels
- Pass draft points to render as ghost markers on the floor plan
- Add "Submit Proposal" and "Cancel Session" buttons to the placement mode banner
- Show existing pending (editable) proposals with an "Edit" option

### 3. Modify: `src/hooks/useServiceRequests.ts`
- Add `createBatchDropPointRequest(data)` method that:
  1. Inserts all drop points to `drop_points` table with `status: 'proposed'`
  2. Creates one service request with `request_type: 'new_drop_points_batch'`
  3. Links all points via `service_request_drop_points`
  4. Returns the service request ID

### 4. New: `src/hooks/useEditableProposal.ts`
- Hook to fetch pending `new_drop_points_batch` requests for a location
- Methods: `addDropPoint`, `removeDropPoint`, `updateDropPoint` — only work while request status is `pending`
- On `removeDropPoint`: deletes from `service_request_drop_points` and `drop_points`, updates the service request description

## UX Flow

```text
┌─────────────────────────────────────┐
│  [Place New Drop Points]  button    │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Session banner:                    │
│  "Click floor plan to add points"  │
│  [Cancel]           [Submit All]   │
├─────────────────────────────────────┤
│  Floor plan with:                   │
│  - Existing markers (colored)       │
│  - Draft markers (grey, dashed)     │
├─────────────────────────────────────┤
│  Draft list: DP-101 (data) [×]     │
│              DP-102 (wifi) [×]     │
│              DP-103 (cam)  [×]     │
│  3 points drafted                   │
└─────────────────────────────────────┘
               ▼  Submit All
┌─────────────────────────────────────┐
│  ONE service request created with   │
│  summary of all points              │
│  All points inserted as "proposed"  │
└─────────────────────────────────────┘
```

## Editable Until Accepted
- Pending proposals show an "Edit" button on the floor plan view
- Clicking "Edit" re-enters session mode, loading existing proposed points
- Client can add/remove points, then re-submit (updates the same service request)
- Once status changes from `pending`, editing is locked

