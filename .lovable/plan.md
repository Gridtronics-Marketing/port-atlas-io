

# Merge Field Ops & Maintenance into Properties + Add Billing Overview to Sidebar

## Summary
1. Remove **Field Operations** and **Maintenance** from the sidebar and merge their functionality into each client's Property (Location) detail view as new tabs.
2. Add **Invoices**, **Quotes**, and **Expenses** as top-level sidebar items so users get a cross-client overview without drilling into each client.

## Changes

### 1. `src/components/AppSidebar.tsx` — Update navigation
- **Remove** "Field Operations" and "Maintenance" from the Operations group
- **Add** to the Business group: "Invoices" (`/invoices`), "Quotes" (`/quotes`), "Expenses" (`/expenses`)

### 2. `src/components/LocationDetailsModal.tsx` — Add Field Ops & Maintenance tabs
- Add two new tabs to the existing `TabsList` (expand grid from 6 to 8 columns):
  - **"Field Ops"** tab — embeds time tracking, photo capture, and safety checklists scoped to that location
  - **"Maintenance"** tab — embeds maintenance schedules filtered to that location, with add/view functionality
- Import `TimeTrackingCard`, `PhotoCaptureCard`, `SafetyChecklistModal` for Field Ops tab content
- Import `useMaintenanceScheduling` and render filtered schedules + `AddMaintenanceModal` for Maintenance tab content

### 3. New page: `src/pages/Invoices.tsx` — Cross-client invoice overview
- Query `client_invoices` joined with `clients.name` across all clients in the org
- Table: Invoice # | Client | Date | Total | Status | Actions
- Filter by status, search by client/invoice number
- Click opens invoice in context (navigates to client details billing tab or inline edit)

### 4. New page: `src/pages/Quotes.tsx` — Cross-client quotes overview
- Same pattern as Invoices page but querying `client_quotes`
- Table: Quote # | Client | Date | Total | Status | Actions

### 5. New page: `src/pages/Expenses.tsx` — Cross-client expenses overview
- Query `client_expenses` joined with `clients.name`
- Table: Date | Client | Category | Vendor | Amount | Status
- Summary cards at top: Total Pending, Total Approved, Total This Month

### 6. `src/App.tsx` — Add routes
- Add `/invoices`, `/quotes`, `/expenses` as protected routes with AppLayout

### 7. `src/components/ClientPortalSidebar.tsx` — No changes needed
(Client portal users don't see these admin-level pages)

## Technical Details

- **Field Ops in Location**: The existing `FieldOperations` page has employee/project/location selectors — when embedded in LocationDetailsModal, those selectors are pre-filled and hidden since the context (location) is already known
- **Maintenance in Location**: Filter `useMaintenanceScheduling` results by `location_id` matching the current property
- **Cross-client billing pages**: Use the existing `useClientBilling` hook pattern but query without a `client_id` filter (all org data), joining to `clients` for the client name column
- **No DB changes needed** — all tables already exist with org-scoped RLS

## File Summary
- **New**: `Invoices.tsx`, `Quotes.tsx`, `Expenses.tsx`
- **Modified**: `AppSidebar.tsx` (nav items), `LocationDetailsModal.tsx` (2 new tabs), `App.tsx` (3 new routes)

