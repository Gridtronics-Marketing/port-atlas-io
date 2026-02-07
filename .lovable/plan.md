

## Client Portal: View Drop Points and Room Views + Service Request for New Ones

### Current State

- **Drop Points**: Client portal users CAN see drop points via the `ClientDropPointList` and `ClientFloorPlanViewer` components on the `ClientLocationDetail` page. They have no ability to add/edit/delete them (read-only). This is correct.
- **Room Views**: There is NO Room Views tab on the `ClientLocationDetail` page. Room views exist in the system (`room_views` table, `useRoomViews` hook, `RoomViewModal` component) but are only available in the admin-side floor plan editor.
- **Service Requests**: The `useServiceRequests` hook and `CreateServiceRequestModal` already exist. Client portal users can create service requests from the dedicated Service Requests page, but there is no way to request a new drop point or room view directly from the location detail page.

### What Will Change

#### 1. Add "Room Views" Tab to Client Location Detail Page

Add a new tab alongside "Floor Plan", "Drop Points", and "Equipment" that displays room views for the location. This will be a new `ClientRoomViewList` component (similar pattern to `ClientDropPointList`) that:
- Fetches room views from the `room_views` table filtered by `location_id`
- Displays room name, floor, description, and thumbnail photo
- Allows clicking to view the full room view photo and details in a read-only modal
- Shows room view count in the stats cards section

#### 2. Show Room Views on the Client Floor Plan

Update `ClientFloorPlanViewer` to also display room view markers on the floor plan (as distinct icons from drop points), so clients can see where room views are located spatially.

#### 3. Add "Request New Drop Point" Button

Add a button on the Drop Points tab that opens a simplified service request form pre-filled with:
- `request_type`: "new_drop_point"
- `location_id`: current location
- Title auto-populated as "Request: New Drop Point"
- Description field for the client to explain what they need

This creates a service request in the `service_requests` table rather than directly adding a drop point.

#### 4. Add "Request New Room View" Button

Same pattern on the Room Views tab -- a button that creates a service request with `request_type`: "new_room_view".

---

### Technical Details

#### New File: `src/components/ClientRoomViewList.tsx`
- Fetches `room_views` where `location_id` matches
- Displays as a card list with room name, floor, thumbnail, ceiling height
- Click opens a read-only detail dialog showing the full photo and metadata

#### New File: `src/components/ClientServiceRequestButton.tsx`
- Reusable button + dialog component
- Props: `locationId`, `requestType` ("new_drop_point" | "new_room_view"), `buttonLabel`
- Dialog has: title (auto-filled), description (text area), priority (select)
- On submit, calls `useServiceRequests().createServiceRequest()`

#### Modified File: `src/pages/ClientLocationDetail.tsx`
- Import and add `ClientRoomViewList` component
- Add "Room Views" tab trigger and content
- Add room view count to stats cards
- Fetch room view count alongside drop point/equipment counts

#### Modified File: `src/components/ClientDropPointList.tsx`
- Add `ClientServiceRequestButton` at the top of the card header for "Request New Drop Point"

#### Modified File: `src/components/ClientFloorPlanViewer.tsx`
- Fetch room views for the location
- Render room view markers (camera icon style) on the floor plan alongside drop point dots

#### Database: RLS Policy for `room_views`
- Add a SELECT policy allowing client portal users to read room views for locations they have access to (via `has_location_access()` function)

| File | Action |
|------|--------|
| `src/components/ClientRoomViewList.tsx` | Create -- read-only room view list for client portal |
| `src/components/ClientServiceRequestButton.tsx` | Create -- reusable service request button + dialog |
| `src/pages/ClientLocationDetail.tsx` | Edit -- add Room Views tab, room view count stat, request buttons |
| `src/components/ClientDropPointList.tsx` | Edit -- add "Request New Drop Point" button |
| `src/components/ClientFloorPlanViewer.tsx` | Edit -- show room view markers on floor plan |
| New migration SQL | Add RLS SELECT policy on `room_views` for client portal users |

