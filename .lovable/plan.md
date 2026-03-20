

# Add "New Requests" Dashboard Card (Position 1)

## What
Add a new card as the **first item in the KPI metrics row** on the admin dashboard that shows incoming service requests from clients. It displays the count of pending requests, a breakdown by priority, and a quick link to the service requests page.

## Changes

### File: `src/pages/Index.tsx`

1. **Import** `useServiceRequests` and the `FileText` icon (already imported but unused — reuse it), plus `MessageSquarePlus` from lucide-react for the card icon.

2. **Add hook call** alongside existing hooks:
   ```typescript
   const { serviceRequests, loading: srLoading } = useServiceRequests();
   ```

3. **Compute metrics** after existing metric calculations:
   ```typescript
   const pendingRequests = serviceRequests.filter(sr => sr.status === 'pending').length;
   const newRequestsToday = serviceRequests.filter(sr => {
     const created = new Date(sr.created_at);
     const today = new Date();
     return created.toDateString() === today.toDateString();
   }).length;
   ```

4. **Insert a new MetricCard as the first item** in the `grid-metrics` div (before "Active Sites"), shifting existing cards right:
   ```tsx
   <MetricCard
     title="New Requests"
     value={pendingRequests}
     icon={FileText}
     subtitle={`${newRequestsToday} today`}
     variant={pendingRequests > 0 ? "warning" : "default"}
     onClick={() => navigate('/service-requests')}
   />
   ```

5. **Add a "Recent Requests" mini-list card** in the sidebar panels (after Quick Actions), showing the 3 most recent pending service requests with client name, title, priority badge, and time ago. Each row links to `/service-requests`:
   - Shows request title (truncated), requesting org name, priority badge, and relative timestamp
   - "View All Requests" button at bottom linking to `/service-requests`
   - Empty state: "No pending requests"

6. **Import** `useNavigate` from react-router-dom and add `const navigate = useNavigate()`.

### File: `src/components/ui/metric-card.tsx`
- Check if `onClick` prop is already supported. If not, add an optional `onClick` handler so the MetricCard becomes clickable with cursor-pointer styling.

