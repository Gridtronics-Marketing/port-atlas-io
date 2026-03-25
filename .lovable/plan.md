

# Redesign Dashboard to Workflow-Centric Layout

## Summary
Transform the dashboard from a metrics-grid layout to a workflow pipeline view with a personalized greeting, a visual workflow funnel, and operational summaries — inspired by field service management UIs.

## Key UI Changes

### 1. Header: Date + Personalized Greeting
Replace the current "Dashboard / Overview of your operations" header with:
- Current date (e.g., "Wednesday, March 25")
- Time-based greeting ("Good morning/afternoon/evening, [First Name]")
- Move the action buttons (New Location, Work Orders) into a subtle row or remove them from the header

### 2. Workflow Pipeline Bar (NEW — hero section)
A horizontal, color-segmented progress bar with 4 stages, each as a card:

| Requests | Quotes | Jobs | Invoices |
|----------|--------|------|----------|

- **Requests**: Count of new/pending service requests, with "Assessments complete" and "Overdue" sub-stats
- **Quotes**: Count of approved contracts/quotes, with draft count and total value
- **Jobs**: Count of active jobs with total budget, sub-stats for active and action-required
- **Invoices**: Placeholder or contract-based financials (awaiting payment count, past due)

Each card shows a bold count, a dollar amount where applicable, a status label, and 2 sub-metrics. The top bar uses 4 colored segments (orange, yellow, green, blue) proportional to counts.

### 3. Today's Schedule Section
Replace the "Active Work Orders" panel with a "Today's Work Orders" summary:
- Financial row: Total, Active, Completed, Overdue, Remaining (from today's due work orders)
- "View Schedule" button linking to `/scheduling`
- List of overdue work orders below

### 4. Business Performance Sidebar
Replace the right sidebar panels (Job Progress, Quick Actions, Recent Requests) with:
- **Business Performance** card with key financial metrics (total contract value, active contracts)
- **Recent Requests** kept but restyled to match
- **Quick Actions** condensed or removed

## Files to Modify

### `src/pages/Index.tsx` — Full rewrite of the dashboard layout
- Add date formatting and greeting logic
- Build the 4-stage workflow pipeline component inline
- Restructure the grid to: greeting → workflow bar → today's schedule + business performance
- Use existing hooks: `useServiceRequests`, `useProjects`, `useWorkOrders`, `useContracts`, `useClients`

### `src/hooks/useAuth.ts` or `src/hooks/useProfiles.ts` — Read user's first name
- Check if profile data (first_name) is available for the greeting

## Technical Notes
- No new database tables or migrations needed
- All data comes from existing hooks
- The workflow bar is purely a UI component using existing counts
- Contracts hook provides quote/invoice-like data
- Keep the client portal redirect logic unchanged

