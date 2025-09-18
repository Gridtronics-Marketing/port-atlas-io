-- Fix critical security vulnerability in equipment table
-- Drop the overly permissive policies that allow any user to modify equipment
DROP POLICY "Authenticated users can delete equipment" ON public.equipment;
DROP POLICY "Authenticated users can insert equipment" ON public.equipment;
DROP POLICY "Authenticated users can update equipment" ON public.equipment;
DROP POLICY "Authenticated users can view equipment" ON public.equipment;

-- Create secure role-based policies for equipment management
-- Allow all authenticated users to view equipment (needed for operations)
CREATE POLICY "All authenticated users can view equipment" 
ON public.equipment FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Restrict equipment creation to authorized staff only
CREATE POLICY "Staff can create equipment" 
ON public.equipment FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Restrict equipment updates to authorized staff only
CREATE POLICY "Staff can update equipment" 
ON public.equipment FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- Restrict equipment deletion to admin and HR manager only
CREATE POLICY "Admin and HR can delete equipment" 
ON public.equipment FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));