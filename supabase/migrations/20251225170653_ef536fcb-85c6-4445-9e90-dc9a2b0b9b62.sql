-- ============================================
-- PHASE 2B: CREATE ALJ SOLUTIONS & MIGRATE DATA
-- ============================================

-- 2.3 Create ALJ Solutions organization
INSERT INTO public.organizations (id, name, slug, owner_id, settings)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'ALJ Solutions',
  'alj-solutions',
  'b95b0a9c-bf2a-4d70-9b9e-52c88979bc15', -- Adam Holmes auth user id
  '{"industry": "telecommunications", "timezone": "America/New_York"}'::jsonb
);

-- 2.4 Add Jordan as Super Admin
INSERT INTO public.platform_admins (user_id, role)
VALUES ('bc138910-12d1-4060-a759-37faee5d98ff', 'super_admin');

-- 2.5 Add Adam Holmes as organization owner member
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'b95b0a9c-bf2a-4d70-9b9e-52c88979bc15',
  'owner'
);

-- 2.6 Migrate all existing data to ALJ Solutions
UPDATE public.clients SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE organization_id IS NULL;
UPDATE public.employees SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE organization_id IS NULL;
UPDATE public.projects SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE organization_id IS NULL;
UPDATE public.locations SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE organization_id IS NULL;
UPDATE public.work_orders SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE organization_id IS NULL;
UPDATE public.contracts SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE organization_id IS NULL;
UPDATE public.inventory_items SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE organization_id IS NULL;
UPDATE public.suppliers SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE organization_id IS NULL;
UPDATE public.equipment SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE organization_id IS NULL;
UPDATE public.purchase_orders SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE organization_id IS NULL;

-- 2.7 Add existing ALJ employees as organization members (map to auth users if they exist)
-- First, add users that have matching auth accounts
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT 
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  au.id,
  CASE 
    WHEN e.role = 'Admin' THEN 'admin'::public.org_role
    WHEN e.role = 'Project Manager' THEN 'project_manager'::public.org_role
    WHEN e.role = 'Lead Technician' THEN 'technician'::public.org_role
    WHEN e.role = 'Technician' THEN 'technician'::public.org_role
    ELSE 'viewer'::public.org_role
  END
FROM public.employees e
JOIN auth.users au ON LOWER(au.email) = LOWER(e.email)
WHERE e.email IS NOT NULL
  AND au.id != 'b95b0a9c-bf2a-4d70-9b9e-52c88979bc15' -- Exclude Adam (already added as owner)
ON CONFLICT (organization_id, user_id) DO NOTHING;