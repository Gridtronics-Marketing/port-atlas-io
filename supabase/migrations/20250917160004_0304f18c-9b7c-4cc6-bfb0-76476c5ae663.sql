-- First, create client-specific RLS policies for locations
DROP POLICY IF EXISTS "Authenticated users can view locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON public.locations;

-- Create new client-aware policies for locations
-- Admins and HR can see all locations
CREATE POLICY "Admins can view all locations"
ON public.locations FOR SELECT
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- Clients can only see locations for their own projects
CREATE POLICY "Clients can view their own locations"
ON public.locations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    INNER JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = locations.project_id
    AND c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Admin/HR/PM can insert locations
CREATE POLICY "Staff can insert locations"
ON public.locations FOR INSERT
TO authenticated
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Admin/HR/PM can update locations
CREATE POLICY "Staff can update locations"
ON public.locations FOR UPDATE
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Admin/HR can delete locations
CREATE POLICY "Admin can delete locations"
ON public.locations FOR DELETE
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Update projects RLS policies for client access
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

-- Staff can see all projects
CREATE POLICY "Staff can view all projects"
ON public.projects FOR SELECT
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- Clients can only see their own projects
CREATE POLICY "Clients can view their own projects"
ON public.projects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = projects.client_id
    AND c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Staff can manage projects
CREATE POLICY "Staff can insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Admin can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Update work_orders RLS for client access  
DROP POLICY IF EXISTS "Authenticated users can view work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Authenticated users can insert work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Authenticated users can update work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Authenticated users can delete work_orders" ON public.work_orders;

-- Staff can see all work orders
CREATE POLICY "Staff can view all work_orders"
ON public.work_orders FOR SELECT
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- Clients can see work orders for their projects
CREATE POLICY "Clients can view their work_orders"
ON public.work_orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    INNER JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = work_orders.project_id
    AND c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Staff can manage work orders
CREATE POLICY "Staff can insert work_orders"
ON public.work_orders FOR INSERT
TO authenticated
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update work_orders"
ON public.work_orders FOR UPDATE
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete work_orders"
ON public.work_orders FOR DELETE
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Add client role to app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'hr_manager', 'project_manager', 'technician', 'viewer', 'client');
    ELSE
        BEGIN
            ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
        EXCEPTION 
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;