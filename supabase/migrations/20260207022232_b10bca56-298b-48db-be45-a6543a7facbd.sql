
-- Create location_requests table
CREATE TABLE public.location_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  building_type TEXT,
  floors INTEGER DEFAULT 1,
  access_instructions TEXT,
  contact_onsite TEXT,
  contact_phone TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_requests ENABLE ROW LEVEL SECURITY;

-- Client portal users can insert their own location requests
CREATE POLICY "Clients can insert location requests"
ON public.location_requests
FOR INSERT
WITH CHECK (
  client_id IN (SELECT client_id FROM public.client_portal_users WHERE user_id = auth.uid())
);

-- Client portal users can view their own, parent org members can view theirs
CREATE POLICY "Clients can view own location requests"
ON public.location_requests
FOR SELECT
USING (
  client_id IN (SELECT client_id FROM public.client_portal_users WHERE user_id = auth.uid())
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

-- Parent org admins can update (approve/reject)
CREATE POLICY "Org admins can update location requests"
ON public.location_requests
FOR UPDATE
USING (
  organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_location_requests_updated_at
BEFORE UPDATE ON public.location_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
