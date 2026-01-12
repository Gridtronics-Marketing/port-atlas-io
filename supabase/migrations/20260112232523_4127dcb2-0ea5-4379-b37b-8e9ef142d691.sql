-- Create service_requests table for client portal
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who submitted it
  requesting_organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  requested_by UUID NOT NULL,
  
  -- What it's for
  location_id UUID REFERENCES public.locations(id),
  drop_point_id UUID REFERENCES public.drop_points(id),
  
  -- Request details
  title TEXT NOT NULL,
  description TEXT,
  request_type TEXT NOT NULL DEFAULT 'service_addition',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  
  -- Parent org handling
  parent_organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Link to work order if created
  work_order_id UUID REFERENCES public.work_orders(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Client org can view their own requests
CREATE POLICY "Users can view requests from their organization"
  ON public.service_requests FOR SELECT
  USING (
    requesting_organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    OR parent_organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

-- Client org can create requests
CREATE POLICY "Users can create requests for their organization"
  ON public.service_requests FOR INSERT
  WITH CHECK (
    requesting_organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

-- Parent org and super admins can update requests
CREATE POLICY "Parent org can update requests"
  ON public.service_requests FOR UPDATE
  USING (
    parent_organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

-- Create trigger for updated_at
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_service_requests_requesting_org ON public.service_requests(requesting_organization_id);
CREATE INDEX idx_service_requests_parent_org ON public.service_requests(parent_organization_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);