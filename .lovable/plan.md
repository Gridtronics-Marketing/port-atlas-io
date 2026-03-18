

# Fix "New Request" Modal and Add Dual-Mode Request Flow

## Problem
The "New Request" button opens a blank white page instead of the modal dialog. Additionally, the request form needs to support two modes: a simple callback request and a detailed location-based request with drop point placement.

## Root Cause Investigation
The `CreateServiceRequestModal` uses `useClientPortalData` to get `accessibleLocations`. If the hook errors silently or the Dialog content fails to render, it could show blank. The modal code itself looks correct structurally, so the blank page may be a rendering/state issue.

## Plan

### 1. Fix the blank modal (`CreateServiceRequestModal.tsx`)
- Add error boundary / fallback handling around `useClientPortalData`
- Ensure the dialog content renders even if locations fail to load
- Add a loading state inside the modal while locations fetch

### 2. Redesign as a two-mode request form (`CreateServiceRequestModal.tsx`)
Replace the current single form with a step-based flow:

**Step 1 - Choose request type:**
- **Quick Request** - "Request a callback or send a quick message" (just title + description + priority)
- **Detailed Request** - "Select a location and specify exactly what you need" (location dropdown, request type, priority, description, optional floor plan placement)

**Step 2a - Quick Request form:**
- Title (auto-filled as "Callback Request" or custom)
- Description / message
- Priority
- Submit

**Step 2b - Detailed Request form:**
- Location dropdown (from `accessibleLocations`)
- Request type (Service Addition, Support, Change Request, Maintenance)
- Priority
- Description
- Optional: "Add drop points on map" button that opens the existing `ClientFloorPlanViewer` in placement mode for the selected location
- Submit

### 3. Files to change

**`src/components/CreateServiceRequestModal.tsx`** - Complete rewrite:
- Add `requestMode` state: `null | 'quick' | 'detailed'`
- Mode selection cards as first view
- Quick mode: minimal form (title, description, priority)
- Detailed mode: full form with location picker; when location selected, show a compact floor plan preview with placement capability
- Use existing `ClientDropPointPlacementDialog` for drop point placement
- Reset mode on close

### 4. Technical details
- Reuse `useClientPortalData` for location list
- Reuse `useServiceRequests.createServiceRequest` for submission
- For the floor plan integration: when a location is selected in detailed mode, show a "Place Drop Points" button that opens the existing placement flow
- The modal will be wider (`sm:max-w-[600px]`) to accommodate the two-column mode selection cards
- Keep the `request_type` as `"callback"` for quick requests to distinguish them on the admin side

