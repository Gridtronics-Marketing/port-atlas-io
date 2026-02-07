
-- Step 1: Add granted_client_id column
ALTER TABLE public.location_access_grants 
ADD COLUMN granted_client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Step 2: Make granted_organization_id nullable (grants can be client-based)
ALTER TABLE public.location_access_grants ALTER COLUMN granted_organization_id DROP NOT NULL;

-- Step 3: Add portal user to org members
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4226f60e-4fbe-4adc-8f09-64332b116223', 'viewer')
ON CONFLICT DO NOTHING;

-- Step 4: Create location access grants for KH Dearborn
INSERT INTO public.location_access_grants (location_id, location_organization_id, granted_client_id, access_level)
VALUES 
  ('1d72c5bd-5a38-471e-ac50-7218916c887e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '247da766-8a82-4f98-b173-ab0ade9625c2', 'view'),
  ('91a6e977-5622-4c05-90b7-7cb762bf5ddf', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '247da766-8a82-4f98-b173-ab0ade9625c2', 'view');

-- Step 5: Update RLS on location_access_grants
DROP POLICY IF EXISTS "View location access grants" ON public.location_access_grants;
CREATE POLICY "View location access grants" ON public.location_access_grants
FOR SELECT USING (
  is_super_admin(auth.uid())
  OR location_organization_id IN (SELECT get_user_organizations(auth.uid()))
  OR granted_organization_id IN (SELECT get_user_organizations(auth.uid()))
  OR granted_client_id IN (
    SELECT client_id FROM public.client_portal_users WHERE user_id = auth.uid()
  )
);

-- Step 6: Update locations org_isolation policy
DROP POLICY IF EXISTS "org_isolation_locations" ON public.locations;
CREATE POLICY "org_isolation_locations" ON public.locations
FOR ALL USING (
  is_super_admin(auth.uid())
  OR organization_id IN (SELECT get_user_organizations(auth.uid()))
  OR id IN (
    SELECT location_id FROM public.location_access_grants
    WHERE granted_organization_id IN (SELECT get_user_organizations(auth.uid()))
       OR granted_client_id IN (SELECT client_id FROM public.client_portal_users WHERE user_id = auth.uid())
  )
);

-- Step 7: Update has_location_access function
CREATE OR REPLACE FUNCTION public.has_location_access(p_location_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = p_location_id
    AND (
      public.is_super_admin(auth.uid())
      OR l.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.location_access_grants lag
        WHERE lag.location_id = p_location_id
        AND (
          lag.granted_organization_id IN (SELECT public.get_user_organizations(auth.uid()))
          OR lag.granted_client_id IN (SELECT client_id FROM public.client_portal_users WHERE user_id = auth.uid())
        )
      )
    )
  );
END;
$$;
