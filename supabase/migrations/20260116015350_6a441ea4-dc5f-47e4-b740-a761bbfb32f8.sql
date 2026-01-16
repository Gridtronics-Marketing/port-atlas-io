-- Fix the org_isolation_locations policy by adding proper WITH CHECK clause
DROP POLICY IF EXISTS "org_isolation_locations" ON public.locations;

CREATE POLICY "org_isolation_locations" ON public.locations
FOR ALL
USING (
  public.is_super_admin(auth.uid()) OR 
  organization_id IN (SELECT public.get_user_organizations(auth.uid())) OR
  id IN (SELECT location_id FROM public.location_access_grants 
         WHERE granted_organization_id IN (SELECT public.get_user_organizations(auth.uid())))
)
WITH CHECK (
  public.is_super_admin(auth.uid()) OR 
  organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);