

# Merge Locations into Client Details (Jobber-style)

## Summary
Two changes: (1) Show location count in the Clients table list instead of the raw address, and (2) restructure the Client Details modal to a Jobber-inspired two-column layout with "Properties" (locations) as a prominent section.

## Changes

### 1. `src/pages/Clients.tsx` — Table "Address" column → "Properties" count

Currently the table shows the client's address. In the Jobber reference, clients with multiple locations show "X properties" instead. Change:

- **Address column header** → keep as "Address" but show: if client has 1 address, show the address; the location count will come from the detail view
- Actually, since we don't have location counts on the list page without an extra query, keep the Address column as-is for now. The main change is the detail view.

### 2. `src/components/ClientDetailsModal.tsx` — Jobber-style two-column layout

Restructure the modal from a single-column stacked-cards layout to a **two-column layout** matching the Jobber screenshot:

**Left column (main content area, ~65% width):**
- **Client name** as a large heading with a building icon (no card wrapper)
- **Properties section** — rename "Managed Locations" to "Properties", show as a clean table with columns: Address, City, State, Zip. Include "+ New Property" button. Each row clickable to open LocationDetailsModal.
- **Contacts section** — show contact name, role, phone, email in a table format (currently inline fields)
- **Overview section** — placeholder for future Active Work/Requests/Quotes/Jobs/Invoices tabs

**Right column (sidebar, ~35% width):**
- **Contact info card** — Billing address, email(s), phone, Lead Source
- **Tags card** — placeholder with "+ New Tag" button
- **Client Portal card** — existing portal section, condensed

**Header actions** — Move Edit/Save buttons to top-right as "Email", "Edit", "More Actions" buttons matching Jobber style

### Specific code changes in `ClientDetailsModal.tsx`:
- Replace the single `<div className="space-y-6">` with a two-column grid: `grid grid-cols-1 lg:grid-cols-5 gap-6`
- Left column (`lg:col-span-3`): Client name heading, Properties table, Contacts table
- Right column (`lg:col-span-2`): Contact info, Tags placeholder, Portal section
- Rename "Managed Locations" → "Properties", "Add Location" → "+ New Property"
- Change location list from card-based to a simple table showing address parts
- Move delete button into a "More Actions" dropdown in the header

