-- First, get the primary organization ID (ALJ Solutions or first available)
-- Then backfill all records with NULL organization_id

-- Backfill locations with NULL organization_id
-- Assign to the first organization that has members (most likely the main org)
UPDATE public.locations 
SET organization_id = (
  SELECT o.id FROM public.organizations o 
  INNER JOIN public.organization_members om ON o.id = om.organization_id
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Backfill drop_points - inherit from parent location
UPDATE public.drop_points dp
SET organization_id = l.organization_id
FROM public.locations l
WHERE dp.location_id = l.id
AND dp.organization_id IS NULL;

-- Backfill room_views - inherit from parent location
UPDATE public.room_views rv
SET organization_id = l.organization_id
FROM public.locations l
WHERE rv.location_id = l.id
AND rv.organization_id IS NULL;

-- Backfill backbone_cables - inherit from parent location
UPDATE public.backbone_cables bc
SET organization_id = l.organization_id
FROM public.locations l
WHERE bc.location_id = l.id
AND bc.organization_id IS NULL;

-- Backfill distribution_frames - inherit from parent location
UPDATE public.distribution_frames df
SET organization_id = l.organization_id
FROM public.locations l
WHERE df.location_id = l.id
AND df.organization_id IS NULL;

-- Backfill clients with NULL organization_id
UPDATE public.clients 
SET organization_id = (
  SELECT o.id FROM public.organizations o 
  INNER JOIN public.organization_members om ON o.id = om.organization_id
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Backfill contracts with NULL organization_id
UPDATE public.contracts 
SET organization_id = (
  SELECT o.id FROM public.organizations o 
  INNER JOIN public.organization_members om ON o.id = om.organization_id
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Backfill projects with NULL organization_id
UPDATE public.projects 
SET organization_id = (
  SELECT o.id FROM public.organizations o 
  INNER JOIN public.organization_members om ON o.id = om.organization_id
  LIMIT 1
)
WHERE organization_id IS NULL;