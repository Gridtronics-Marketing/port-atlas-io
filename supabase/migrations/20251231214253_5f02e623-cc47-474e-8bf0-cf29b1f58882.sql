-- Add linked_organization_id to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS linked_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_clients_linked_organization_id ON public.clients(linked_organization_id);

-- Create client_invitations table for tracking invitations
CREATE TABLE IF NOT EXISTS public.client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invitation_token TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  organization_id_scope UUID REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_invitations
CREATE POLICY "Users can view invitations in their organization" 
ON public.client_invitations FOR SELECT 
USING (
  organization_id_scope IN (SELECT public.get_user_organizations(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can create invitations in their organization" 
ON public.client_invitations FOR INSERT 
WITH CHECK (
  organization_id_scope IN (SELECT public.get_user_organizations(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can update invitations in their organization" 
ON public.client_invitations FOR UPDATE 
USING (
  organization_id_scope IN (SELECT public.get_user_organizations(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Users can delete invitations in their organization" 
ON public.client_invitations FOR DELETE 
USING (
  organization_id_scope IN (SELECT public.get_user_organizations(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_client_invitations_updated_at
BEFORE UPDATE ON public.client_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create organization-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for organization-logos
CREATE POLICY "Organization logos are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'organization-logos');

CREATE POLICY "Authenticated users can upload organization logos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'organization-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update organization logos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'organization-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete organization logos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'organization-logos' AND auth.role() = 'authenticated');