

## Add "Request New Service Location" to Client Portal

### Overview

Client portal users will be able to request a new service location via a form that mirrors the admin "Add Location" modal. The request is saved as a service request with type `new_location` and all location details stored as JSON metadata. When the parent organization approves it, the system creates a real location record, assigns it to the client, creates the access grant, and the client can then use the full interactive floor plan with drop point requests.

### What Changes

#### 1. New Database Table: `location_requests`

A dedicated table to store the full location details submitted by the client, linked to a `service_request` for the approval workflow.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| service_request_id | uuid FK | Links to `service_requests` |
| client_id | uuid FK | The requesting client |
| name | text | Location name |
| address | text | Full address |
| building_type | text | Building type |
| floors | integer | Number of floors |
| access_instructions | text | Access notes |
| contact_onsite | text | Onsite contact name |
| contact_phone | text | Onsite contact phone |
| latitude | numeric | Geocoded lat |
| longitude | numeric | Geocoded lng |
| status | text | `pending`, `approved`, `rejected` |
| organization_id | uuid | Parent org who will own it |
| created_at / updated_at | timestamptz | |

RLS: Client portal users can INSERT and SELECT their own rows. Parent org admins can SELECT and UPDATE.

#### 2. New Component: `AddServiceLocationModal.tsx`

A dialog form with the same fields as the admin `AddLocationModal` (name, address with autocomplete, building type, floors, access instructions, onsite contact) but WITHOUT client selection (auto-filled from the logged-in portal user's linked client). On submit:
- Creates a `service_request` with `request_type: 'new_location'`
- Creates a `location_requests` row with the full details
- Shows success toast

#### 3. UI Integration Points

- **Client Portal Dashboard** (`ClientPortalDashboard.tsx`): Add an "Add New Service Location" button in the Quick Actions card and optionally in the hero section
- **Client Portal Sidebar** (`ClientPortalSidebar.tsx`): No changes needed (locations page already listed)
- **My Locations page**: Add the button at the top of the locations list for portal users

#### 4. Admin Approval Flow (ServiceRequestsManager)

When an admin views a `new_location` type service request:
- Show a "Review Location Request" action that displays the submitted location details
- Provide "Approve & Create Location" button that:
  1. Creates the real `locations` record with `status: 'Pending'` (walk-through not yet done)
  2. Creates a `location_access_grant` for the client
  3. Updates the `location_requests` status to `approved`
  4. Updates the `service_request` status to `approved`
  5. Optionally creates a work order for the walk-through scheduling
- Provide "Reject" button with notes

#### 5. Post-Approval: Location Becomes Fully Functional

Once approved, the location appears in the client's "My Locations" with a "Pending" status badge. After the parent org completes the walk-through and updates the status to "Active", the client gets full access including the interactive floor plan and "Request New Drop Point" functionality (already implemented).

---

### Technical Details

**Database Migration:**

```text
-- Create location_requests table
CREATE TABLE public.location_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  building_type TEXT,
  floors INTEGER DEFAULT 1,
  access_instructions TEXT,
  contact_onsite TEXT,
  contact_phone TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.location_requests ENABLE ROW LEVEL SECURITY;

-- Client portal users can insert and view their own requests
CREATE POLICY "Clients can insert location requests" ON location_requests
  FOR INSERT WITH CHECK (
    client_id IN (SELECT client_id FROM client_portal_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can view own location requests" ON location_requests
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM client_portal_users WHERE user_id = auth.uid())
    OR organization_id IN (SELECT get_user_organizations(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- Parent org can update (approve/reject)
CREATE POLICY "Org admins can update location requests" ON location_requests
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_organizations(auth.uid()))
    OR is_super_admin(auth.uid())
  );
```

**New Files:**

| File | Purpose |
|------|---------|
| `src/components/AddServiceLocationModal.tsx` | Client-facing form dialog with address, building type, floors, contacts |
| `src/components/LocationRequestReviewModal.tsx` | Admin-facing review dialog showing submitted details with Approve/Reject actions |

**Modified Files:**

| File | Change |
|------|--------|
| `src/pages/ClientPortalDashboard.tsx` | Add "Request New Location" button to Quick Actions and hero |
| `src/components/ServiceRequestsManager.tsx` | Add handling for `new_location` request type with review/approve flow |
| `src/hooks/useServiceRequests.ts` | Add `createLocationRequest()` helper that creates both the service request and location_request row |
| `src/components/ClientServiceRequestButton.tsx` | Add `new_location` to the request type union |

**Approval Flow (in `LocationRequestReviewModal`):**

1. Admin clicks "Approve & Create Location"
2. INSERT into `locations` table with submitted details + `status: 'Pending'` + client_id + organization_id
3. INSERT into `location_access_grants` with `granted_client_id`
4. UPDATE `location_requests` set `status = 'approved'`
5. UPDATE `service_requests` set `status = 'approved'`
6. Optionally prompt to create a walk-through work order

