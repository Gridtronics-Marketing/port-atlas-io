
# Plan: Replace Magic Link with Direct Password Creation for Client Portal

## Summary

Change the client portal invitation flow so admins directly create a user account with email + password (entered manually or auto-generated). No email verification required. The admin then shares the credentials with the client however they prefer (email, phone, in-person, etc.).

## What Changes

### 1. Update `CreateClientPortalModal.tsx`

- Add a **password field** with two modes:
  - "Enter password" -- admin types a password
  - "Generate password" -- button generates a random secure password (e.g., `Abc-1234-Xyz`)
- Add a **copy credentials** button that appears after successful creation, showing the email + password for the admin to copy/share
- Remove the "Send Invitation" language; button becomes **"Create Account"**
- Remove the magic-link-related preview text

### 2. Refactor `invite-client-user` Edge Function

- Remove the `generateLink({ type: 'magiclink' })` call entirely
- Replace with `auth.admin.createUser()` with `email_confirm: true` (skips verification)
- Accept a `password` field in the request body
- Still create the `client_portal_users` record and `client_invitations` record
- Remove the call to `send-client-invitation-email` (no email sent automatically)
- Return the created user ID on success

### 3. No Changes Needed

- **Auth page** -- no changes; clients will just use the standard email/password sign-in
- **`send-client-invitation-email`** -- kept for future use but no longer called from this flow
- **Database schema** -- no migration needed; existing tables work as-is

## Technical Details

### Edge Function Request Shape (updated)

```text
POST /invite-client-user
Body: {
  clientId: string,
  clientName: string,
  inviteEmail: string,
  password: string,        // NEW: admin-set or generated password
  userRole: 'admin' | 'member' | 'viewer',
  parentOrganizationId: string
}
```

### Edge Function Core Change

Replace lines 152-176 (magic link generation) with:

```typescript
const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email: inviteEmail,
  password: password,
  email_confirm: true,  // No verification needed
  user_metadata: {
    client_id: clientId,
    client_name: clientName,
    organization_id: parentOrganizationId,
    portal_role: userRole
  }
});
```

Remove lines 220-246 (branded email sending).

### Modal UI Changes

- Add password input + "Generate" button
- After successful creation, show a confirmation card with copyable credentials:
  ```
  Account Created!
  Email: client@example.com
  Password: Abc-1234-Xyz
  [Copy to Clipboard]
  ```
- Admin manually shares these credentials with the client

### Password Generation Logic

```typescript
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const segments = [4, 4, 4];
  return segments.map(len =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-');
};
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/invite-client-user/index.ts` | Replace magic link with `createUser()`, remove email sending |
| `src/components/CreateClientPortalModal.tsx` | Add password field, generate button, credential display after creation |
