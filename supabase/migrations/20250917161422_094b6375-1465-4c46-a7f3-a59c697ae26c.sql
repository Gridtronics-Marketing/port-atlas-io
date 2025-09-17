-- Fix security issue: Restrict clients table access to authorized staff only
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

-- Create secure role-based policies for clients table
-- Only admin, hr_manager, and project_manager can view all client data
CREATE POLICY "Staff can view all clients"
ON public.clients FOR SELECT
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Clients can view their own basic information (if they have client accounts)
CREATE POLICY "Clients can view their own information"
ON public.clients FOR SELECT
TO authenticated
USING (
  contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role])
);

-- Only admin and hr_manager can create new clients
CREATE POLICY "Admin and HR can insert clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Only admin, hr_manager, and project_manager can update client data
CREATE POLICY "Staff can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Only admin and hr_manager can delete clients
CREATE POLICY "Admin and HR can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));