
# Refactoring Plan: OpenPhone & Twilio Integration Architecture

## Current State Analysis

### Critical Security & Architecture Issues Identified

| Issue | Severity | Location |
|-------|----------|----------|
| **Credentials stored in client-side code** | CRITICAL | `useTwilioSettings.ts` still references `account_sid`, `auth_token` in interface |
| **Credentials passed from frontend** | CRITICAL | `testConnection()` sends credentials in request body |
| **No organization_id enforcement** | HIGH | Hooks don't filter by org; webhooks don't route by org |
| **OpenPhone settings in generic JSONB** | MEDIUM | `procurement_settings.setting_value` stores API key unencrypted |
| **Webhook has no signature verification** | HIGH | `openphone-webhook` accepts any POST request |
| **RLS policies lack org isolation** | HIGH | Policies check roles but not `organization_id` consistently |
| **Anon key used in webhook** | MEDIUM | Should use service role for admin operations |

---

## Proposed Architecture

### 1. New Credential Storage Model

Create a dedicated `integration_credentials` table using Supabase Vault for encryption:

```
integration_credentials
├── id (uuid)
├── organization_id (uuid, NOT NULL, FK → organizations)
├── integration_type ('twilio' | 'openphone')
├── encrypted_credentials (vault encrypted)
├── webhook_secret (for signature verification)
├── is_active (boolean)
├── last_verified_at (timestamp)
├── created_at / updated_at
```

**Key principle**: Credentials NEVER leave the edge function. The frontend only knows if credentials are configured, never the values.

---

### 2. Database Schema Changes

```sql
-- Create integration credentials table with vault encryption
CREATE TABLE public.integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('twilio', 'openphone')),
  -- Vault encrypted: stores {account_sid, auth_token, phone_number} or {api_key}
  credentials_secret_id UUID REFERENCES vault.secrets(id),
  webhook_secret TEXT, -- For signature verification
  phone_number TEXT,   -- Display only (masked for UI)
  is_active BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  last_error TEXT,
  settings JSONB DEFAULT '{}',  -- Non-sensitive config flags
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, integration_type)
);

-- Add organization_id enforcement to existing tables
ALTER TABLE public.twilio_settings 
  ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.openphone_call_logs 
  ALTER COLUMN organization_id SET NOT NULL;
```

---

### 3. Updated RLS Policies

```sql
-- Integration credentials: strict org isolation
CREATE POLICY "Users can view own org credentials" 
ON public.integration_credentials FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR organization_id IN (SELECT get_user_organizations(auth.uid()))
);

CREATE POLICY "Admins can manage own org credentials" 
ON public.integration_credentials FOR ALL
USING (
  is_super_admin(auth.uid())
  OR (
    organization_id IN (SELECT get_user_organizations(auth.uid()))
    AND get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
  )
);

-- OpenPhone call logs: org-scoped
DROP POLICY IF EXISTS "Staff can view call logs" ON public.openphone_call_logs;
CREATE POLICY "Org members can view own call logs" 
ON public.openphone_call_logs FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR organization_id IN (SELECT get_user_organizations(auth.uid()))
);
```

---

### 4. Edge Function Architecture

#### A. Credential Management Edge Function (NEW)
`supabase/functions/manage-integration-credentials/index.ts`

**Responsibilities**:
- Store credentials in Supabase Vault (never returns decrypted values)
- Test connection by reading from Vault
- Generate and store webhook secrets
- Return only masked/status info to frontend

```text
POST /manage-integration-credentials
Body: { 
  action: 'configure' | 'test' | 'deactivate',
  integration_type: 'twilio' | 'openphone',
  organization_id: string,
  credentials?: { ... }  // Only for 'configure' action
}

Response: {
  configured: boolean,
  phone_number_masked: '+1***5678',
  last_verified_at: timestamp,
  webhook_url: 'https://...'  // For user to configure in provider
}
```

#### B. Twilio Notification Function (REFACTORED)
`supabase/functions/send-twilio-notification/index.ts`

**Changes**:
- Require `organization_id` in request
- Fetch credentials from Vault using org context
- Never accept credentials in request body

#### C. OpenPhone Webhook (REFACTORED)
`supabase/functions/openphone-webhook/index.ts`

**Changes**:
- Add signature verification using stored webhook secret
- Lookup organization from phone number mapping
- Use service role key for DB operations
- Route data to correct organization

```text
Webhook Flow:
1. Receive webhook → Verify signature
2. Extract phone number → Lookup org from phone_number_to_org mapping
3. Create call log with correct organization_id
4. Match contacts within that organization only
```

---

### 5. Frontend Hook Refactoring

#### `useTwilioSettings.ts` Changes:

```typescript
interface TwilioSettings {
  organization_id: string;
  enabled: boolean;
  push_notifications_enabled: boolean;
  credentials_configured: boolean;  // Boolean only, never actual creds
  phone_number_masked?: string;     // "+1***5678" format
  last_verified_at?: string;
}

// Remove: account_sid, auth_token from interface
// Remove: sending credentials to edge function
// Add: call edge function for credential management
```

#### `useOpenPhone.ts` Changes:

```typescript
// Add organization_id filtering
const { organizationId } = useOrganizationData();

const fetchCallLogs = async () => {
  const { data } = await supabase
    .from('openphone_call_logs')
    .select('*')
    .eq('organization_id', organizationId)  // NEW: Org filter
    .order('started_at', { ascending: false });
};
```

---

### 6. Webhook Routing Architecture

```text
                     ┌──────────────────┐
                     │  Twilio/OpenPhone │
                     │     Provider      │
                     └────────┬─────────┘
                              │ Webhook POST
                              ▼
                     ┌──────────────────┐
                     │  Edge Function   │
                     │ (verify signature)│
                     └────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │  Org A  │    │  Org B  │    │  Org C  │
        │ +1-555- │    │ +1-888- │    │ +1-777- │
        └─────────┘    └─────────┘    └─────────┘

Phone number → Organization mapping stored in integration_credentials
```

---

### 7. Phone Number to Organization Mapping

```sql
-- New table for routing webhooks
CREATE TABLE public.phone_number_org_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  integration_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone_number, integration_type)
);

-- Index for fast lookup
CREATE INDEX idx_phone_org_lookup 
ON phone_number_org_mapping(phone_number, integration_type) 
WHERE is_active = true;
```

---

## Implementation Summary

| Step | Action | Complexity |
|------|--------|------------|
| 1 | Create `integration_credentials` and `phone_number_org_mapping` tables | Medium |
| 2 | Create `manage-integration-credentials` edge function | High |
| 3 | Refactor `send-twilio-notification` to use Vault | Medium |
| 4 | Refactor `openphone-webhook` with signature verification + org routing | High |
| 5 | Update `useTwilioSettings.ts` to remove credential handling | Low |
| 6 | Update `useOpenPhone.ts` with org filtering | Low |
| 7 | Update RLS policies for org isolation | Medium |
| 8 | Migrate existing settings to new schema | Medium |
| 9 | Update UI to show webhook URLs for configuration | Low |

---

## Security Improvements Summary

| Before | After |
|--------|-------|
| Credentials stored in DB as plaintext | Credentials in Supabase Vault (encrypted at rest) |
| Frontend sends credentials to edge functions | Credentials never leave edge functions |
| No webhook signature verification | HMAC signature verification on all webhooks |
| No org isolation in webhooks | Phone number → org routing |
| RLS checks roles only | RLS checks roles + organization_id |
| Global settings | Per-organization isolated settings |
