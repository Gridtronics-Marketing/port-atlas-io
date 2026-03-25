

# Redesign Client Management UI

## Summary
Transform the Clients page from a card-based layout to a clean table-based layout inspired by the reference screenshot: simplified header, summary stat cards with trends, inline filter bar with status pills, and a proper data table.

## Changes

### Modify: `src/pages/Clients.tsx` — Full UI rewrite

**Header**
- Clean title "Clients" (no gradient, no subtitle)
- "New Client" primary button (green/primary) + "More Actions" outlined button with dropdown (export, bulk import, etc.)

**Summary Cards Row**
- 3 stat cards (no icons): "New leads" (past 30 days, pending clients), "New clients" (past 30 days, recently added active), "Total new clients" (year to date count)
- Each card shows count with a chevron arrow for navigation
- Subtitle "Past 30 days" / "Year to date"

**Filter Bar** (replaces the Filter & Search card)
- Inline row: Status filter pills ("All", "Active", "Pending", "Inactive") as toggle buttons
- Search input on the right side with search icon
- Result count label: "Filtered clients (X results)"

**Table View** (replaces card list)
- Use the existing `Table` component (`src/components/ui/table.tsx`)
- Columns: **Name** (client name + contact name subtitle), **Address**, **Status** (dot + label), **Last Activity** (relative time from `updated_at`)
- Clickable rows open the existing `ClientDetailsModal`
- Clean hover state, no card borders per row

**No new files or hooks needed** — all data comes from existing `useClients` hook.

