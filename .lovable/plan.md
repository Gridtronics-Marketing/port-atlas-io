

# Add Multiple Contacts per Client

## Summary
Create a `client_contacts` table and update the Client Details modal to support multiple contacts with Name, Phone, Email, Role columns and Edit/Add functionality.

## Changes

### 1. New Migration: `client_contacts` table
```sql
CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage client contacts"
  ON public.client_contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

### 2. New Hook: `src/hooks/useClientContacts.ts`
- CRUD operations for `client_contacts` table filtered by `client_id`
- `fetchContacts(clientId)`, `addContact(...)`, `updateContact(...)`, `deleteContact(...)`

### 3. New Component: `src/components/AddClientContactModal.tsx`
- Simple dialog with fields: Name, Email, Phone, Role
- Reused for both Add and Edit (pass existing contact data for edit mode)

### 4. Modify: `src/components/ClientDetailsModal.tsx`
- **Contacts section header**: Add "+ Add Contact" button next to the "Contacts" heading
- **Table columns**: Name | Phone | Email | Role | Edit (pencil icon button)
- Load contacts from `useClientContacts` hook instead of the single `client.contact_name/email/phone` fields
- Each row has an Edit button that opens the `AddClientContactModal` in edit mode
- Migrate the existing single contact display: if `client.contact_name` exists and no `client_contacts` rows, show the legacy data as a row with an option to migrate it

