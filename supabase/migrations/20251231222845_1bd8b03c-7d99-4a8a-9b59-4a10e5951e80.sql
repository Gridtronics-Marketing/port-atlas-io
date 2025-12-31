-- Create location_access_grants table for shared access between organizations
CREATE TABLE public.location_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  granted_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'full')),
  granted_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(location_id, granted_organization_id)
);

-- Enable RLS
ALTER TABLE public.location_access_grants ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user has access to a location (owned or granted)
CREATE OR REPLACE FUNCTION public.has_location_access(p_location_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = p_location_id
    AND (
      -- Super admin has access to all
      public.is_super_admin(auth.uid())
      -- User's org owns the location
      OR l.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
      -- User's org has been granted access
      OR EXISTS (
        SELECT 1 FROM public.location_access_grants lag
        WHERE lag.location_id = p_location_id
        AND lag.granted_organization_id IN (SELECT public.get_user_organizations(auth.uid()))
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS policies for location_access_grants
-- Super admins and location owners can view grants
CREATE POLICY "View location access grants"
ON public.location_access_grants
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR location_id IN (
    SELECT id FROM public.locations 
    WHERE organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  )
  OR granted_organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

-- Only location owners and super admins can create grants
CREATE POLICY "Create location access grants"
ON public.location_access_grants
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR location_id IN (
    SELECT id FROM public.locations 
    WHERE organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  )
);

-- Only location owners and super admins can update grants
CREATE POLICY "Update location access grants"
ON public.location_access_grants
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR location_id IN (
    SELECT id FROM public.locations 
    WHERE organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  )
);

-- Only location owners and super admins can delete grants
CREATE POLICY "Delete location access grants"
ON public.location_access_grants
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR location_id IN (
    SELECT id FROM public.locations 
    WHERE organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  )
);

-- Update the locations RLS policy to include granted access
DROP POLICY IF EXISTS "org_isolation_locations" ON public.locations;

CREATE POLICY "org_isolation_locations"
ON public.locations
FOR ALL
USING (
  public.is_super_admin(auth.uid())
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  OR id IN (
    SELECT location_id FROM public.location_access_grants
    WHERE granted_organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_location_access_grants_updated_at
BEFORE UPDATE ON public.location_access_grants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grant the two locations to Calo & Sons Construction
INSERT INTO public.location_access_grants (location_id, granted_organization_id, access_level, notes)
SELECT l.id, '685c2899-3035-4627-a55c-f9397155df36', 'edit', 'Client project location'
FROM public.locations l
WHERE l.name IN ('Greenfield', 'Main Office')
AND l.organization_id = '58f06f60-f151-4287-88cf-f7c22d758445'
ON CONFLICT (location_id, granted_organization_id) DO NOTHING;