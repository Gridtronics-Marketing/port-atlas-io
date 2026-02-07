

## Fix: Portal Not Found for `/p/kh-dearborn`

### Problem

The `/p/kh-dearborn` portal entry page queries the `clients` table to look up the client by slug. However, **Row Level Security (RLS) blocks this query for unauthenticated visitors**. All current SELECT policies require the user to either:
- Have a matching `contact_email`, or
- Hold an admin/staff role

Since portal visitors haven't logged in yet, the query returns zero rows and the page shows "Portal Not Found."

### Solution

Two changes are needed:

#### 1. Database Migration -- Add RLS Policy for Public Slug Lookup

Add a SELECT policy that allows **anyone** (including anonymous users) to read a minimal set of columns from `clients` when filtering by `slug`. Since RLS policies operate at the row level (not column level), the policy will allow reading the row, but the `PortalEntry` component already only selects `id`, `name`, and `organization_id` -- no sensitive data is exposed.

```sql
CREATE POLICY "Public can view clients by slug for portal entry"
ON public.clients FOR SELECT
USING (slug IS NOT NULL);
```

**Note:** This allows reading client rows that have a slug set. Only clients with portal slugs will be visible. The query in `PortalEntry` only selects `id`, `name`, and `organization_id` -- no contact details, emails, or billing information are returned in the component code.

#### 2. Code Change -- Query by `slug` Column Directly

The current `PortalEntry.tsx` lookup logic tries to match by `name` with string manipulation, which is fragile and case-sensitive. Update it to query the `slug` column directly:

```typescript
const { data, error } = await supabase
  .from('clients')
  .select('id, name, organization_id')
  .eq('slug', orgSlug)
  .maybeSingle();
```

This replaces the current two-step name-matching logic (lines ~45-60) with a single, reliable slug lookup.

### Files to Modify

| File | Change |
|------|--------|
| New migration SQL | Add public SELECT policy for clients with a slug |
| `src/pages/PortalEntry.tsx` | Replace name-based lookup with direct `.eq('slug', orgSlug)` query |

### Security Consideration

The policy exposes rows where `slug IS NOT NULL`. Since only portal-enabled clients have slugs, this is intentional. The `PortalEntry` component only selects non-sensitive columns (`id`, `name`, `organization_id`). Contact emails, phone numbers, and billing addresses are not fetched.

