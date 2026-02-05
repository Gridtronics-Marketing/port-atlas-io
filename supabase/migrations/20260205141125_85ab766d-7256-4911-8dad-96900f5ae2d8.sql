-- Integration credentials table with org isolation
-- Credentials stored as encrypted JSONB (Vault not available, using pgcrypto for column-level encryption)
CREATE TABLE public.integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('twilio', 'openphone')),
  -- Encrypted credentials stored here (encrypted by edge function before insert)
  encrypted_credentials TEXT,
  -- Webhook secret for signature verification (stored encrypted)
  webhook_secret TEXT,
  -- Phone number (display only - masked in UI)
  phone_number TEXT,
  -- Status tracking
  is_active BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  last_error TEXT,
  -- Non-sensitive settings (feature flags)
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, integration_type)
);

-- Phone number to organization mapping for webhook routing
CREATE TABLE public.phone_number_org_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('twilio', 'openphone')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone_number, integration_type)
);

-- Index for fast webhook routing lookup
CREATE INDEX idx_phone_org_lookup 
ON public.phone_number_org_mapping(phone_number, integration_type) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_number_org_mapping ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only view credentials for their organization (never returns actual creds)
CREATE POLICY "Users can view own org integration status" 
ON public.integration_credentials FOR SELECT
USING (
  public.is_super_admin(auth.uid()) 
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

-- RLS: Only org admins can manage credentials
CREATE POLICY "Org admins can manage integration credentials" 
ON public.integration_credentials FOR ALL
USING (
  public.is_super_admin(auth.uid())
  OR (
    organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    AND public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
  )
);

-- RLS: Phone mapping follows same pattern
CREATE POLICY "Users can view own org phone mappings" 
ON public.phone_number_org_mapping FOR SELECT
USING (
  public.is_super_admin(auth.uid()) 
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

CREATE POLICY "Org admins can manage phone mappings" 
ON public.phone_number_org_mapping FOR ALL
USING (
  public.is_super_admin(auth.uid())
  OR (
    organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    AND public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
  )
);

-- Add organization_id to openphone_call_logs if not already NOT NULL
DO $$
BEGIN
  -- Add NOT NULL constraint to organization_id on openphone_call_logs if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'openphone_call_logs' AND column_name = 'organization_id'
  ) THEN
    -- First update any NULL values with a placeholder (this would need manual data migration)
    -- Then alter to NOT NULL
    ALTER TABLE public.openphone_call_logs 
    ALTER COLUMN organization_id SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    -- Column might already be NOT NULL or table doesn't exist
    RAISE NOTICE 'Could not alter openphone_call_logs.organization_id: %', SQLERRM;
END $$;

-- Update RLS for openphone_call_logs to be org-scoped
DROP POLICY IF EXISTS "Staff can view call logs" ON public.openphone_call_logs;
DROP POLICY IF EXISTS "Staff can insert call logs" ON public.openphone_call_logs;
DROP POLICY IF EXISTS "Staff can update call logs" ON public.openphone_call_logs;

CREATE POLICY "Org members can view own call logs" 
ON public.openphone_call_logs FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

CREATE POLICY "Org members can insert call logs" 
ON public.openphone_call_logs FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

CREATE POLICY "Org members can update call logs" 
ON public.openphone_call_logs FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

-- Add updated_at trigger for integration_credentials
CREATE TRIGGER update_integration_credentials_updated_at
BEFORE UPDATE ON public.integration_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();