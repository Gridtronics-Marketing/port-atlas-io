-- Backfill location_access_grants for existing locations assigned to clients with portals
-- This ensures clients can see their assigned locations in the client portal

INSERT INTO public.location_access_grants (
  location_id, 
  granted_organization_id, 
  location_organization_id, 
  access_level,
  notes
)
SELECT DISTINCT
  l.id as location_id,
  c.linked_organization_id as granted_organization_id,
  l.organization_id as location_organization_id,
  'view' as access_level,
  'Auto-granted: Location assigned to client with portal' as notes
FROM public.locations l
INNER JOIN public.clients c ON l.client_id = c.id
WHERE c.linked_organization_id IS NOT NULL
  AND l.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.location_access_grants lag 
    WHERE lag.location_id = l.id 
    AND lag.granted_organization_id = c.linked_organization_id
  );