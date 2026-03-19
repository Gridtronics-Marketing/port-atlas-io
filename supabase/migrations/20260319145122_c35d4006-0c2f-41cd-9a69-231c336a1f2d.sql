
-- API Keys table for external REST API authentication
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  name text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Org admins and project managers can manage API keys
CREATE POLICY "org_admins_manage_api_keys" ON public.api_keys
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin', 'project_manager')
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin', 'project_manager')
  );

-- Updated_at trigger
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
