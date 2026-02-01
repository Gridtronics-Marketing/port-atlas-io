
# Fix: Add Missing `slug` Column to Clients Table

## Problem Identified
The "Client Not Found" error occurs because the `invite-client-user` Edge Function tries to query the `slug` column from the `clients` table, but this column doesn't exist in the database.

When the query fails, the edge function catches the error and returns "Client not found" (misleading error message).

---

## Solution

### Step 1: Add the `slug` column to the `clients` table

Create a database migration to add the missing column:

```sql
-- Add slug column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_clients_slug ON public.clients(slug);
```

---

## Technical Details

### Why the Error is Misleading
The edge function at lines 84-98:
```typescript
const { data: client, error: clientError } = await supabaseAdmin
  .from('clients')
  .select('id, name, slug, organization_id')  // ← slug doesn't exist
  .eq('id', clientId)
  .single();

if (clientError || !client) {
  // Both DB errors and missing clients trigger this
  results.push({ error: 'Client not found', status: 'failed' });
}
```

The actual PostgreSQL error is:
> `column "slug" does not exist`

But the code treats any query error as "Client not found".

### Affected Components
- `invite-client-user` Edge Function — needs `slug` to generate portal URLs
- `useClients` hook — defines `slug` in the Client interface
- `CreateClientPortalModal` — displays the portal URL with slug
- `ClientDetailsModal` — uses slug for portal URLs

---

## Implementation Summary

| Step | Action |
|------|--------|
| 1 | Run migration to add `slug` column |
| 2 | Types will auto-update from schema |
| 3 | Test client portal creation again |

After this fix, when you create a client portal, the edge function will be able to query the client and generate a unique slug for the portal URL (e.g., `/p/acme-corp`).
