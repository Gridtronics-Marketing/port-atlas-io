

# Client Email Dialog & Communication Log

## Summary
Add a Jobber-style "Send Email" dialog triggered by the Email button in Client Details, backed by a new `client_communications` table to log all outbound emails and internal notes. Emails sent via Resend from `outbound@runwithatlas.com`. Each client gets a configurable reply-to address. The right sidebar gains a "Recent Communication" section showing the log.

## Changes

### 1. New Migration: `client_communications` table

```sql
CREATE TABLE public.client_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'email', -- 'email' | 'note'
  direction TEXT DEFAULT 'outgoing',  -- 'outgoing' | 'incoming'
  to_email TEXT,
  cc_emails TEXT[],
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'sent', -- 'sent' | 'delivered' | 'failed'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.client_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage client communications"
  ON public.client_communications FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

Also add a `reply_to_email` column to `clients`:
```sql
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS reply_to_email TEXT;
```

### 2. New Edge Function: `send-client-email`
- Accepts: `to`, `cc`, `subject`, `body`, `clientId`, `clientName`
- Sends via Resend using existing `RESEND_API_KEY`
- From: `outbound@runwithatlas.com`
- Reply-To: client's `reply_to_email` or the sending user's email
- Logs to `client_communications` table
- Returns success/failure

### 3. New Component: `src/components/SendClientEmailModal.tsx`
Jobber-style dialog matching the screenshots:
- **To** field: pre-populated with primary contact email, removable chip, "..." menu with "Add CC Email"
- **Subject** input
- **Message** textarea
- **"Send me a copy"** checkbox
- **Cancel** / **Send Email** (green) buttons
- On send: invokes `send-client-email` edge function

### 4. New Component: `src/components/ClientCommunicationLog.tsx`
Renders in the right sidebar of Client Details:
- Header: "Recent communication" with "View All" link
- Each entry shows: icon (green dot for email, yellow for note), type label, subject/preview, timestamp
- "New Communication" / "Log Note" buttons at top

### 5. New Hook: `src/hooks/useClientCommunications.ts`
- `fetchCommunications(clientId)` — recent 5 for sidebar, all for full view
- `addCommunication(...)` — insert log entry
- Real-time subscription for updates

### 6. Modify: `src/components/ClientDetailsModal.tsx`
- **Email button**: Opens `SendClientEmailModal` instead of `mailto:` link
- **Right sidebar**: Add `ClientCommunicationLog` section below Tags card
- **Edit mode**: Add `reply_to_email` field in Contact Info card

### 7. Modify: `src/hooks/useClients.ts` (if needed)
- Ensure `reply_to_email` is included in client queries/types

## File Summary
- **New**: migration, `send-client-email` edge function, `SendClientEmailModal.tsx`, `ClientCommunicationLog.tsx`, `useClientCommunications.ts`
- **Modified**: `ClientDetailsModal.tsx`, `types.ts` (auto-updated by migration)

