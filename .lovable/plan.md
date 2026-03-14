

# Simplify Client Portal User Creation

Based on the wish list: remove the "User Role" selector (clients get one role only) and add a "Name" field.

## Changes to `src/components/CreateClientPortalModal.tsx`

1. **Add a "Name" field** above Email — single text input for the client user's name
2. **Remove the Role selector** — hardcode role as `'admin'` (the only client role needed; they can create requests and view data)
3. **Remove** the `Select` import and role-related UI
4. **Pass name** in the edge function call body and show it in the credentials card after creation

## Changes to `supabase/functions/invite-client-user/index.ts`

- Accept optional `userName` field in the request body
- Pass it into `user_metadata` as `full_name` so the profile trigger populates the name

