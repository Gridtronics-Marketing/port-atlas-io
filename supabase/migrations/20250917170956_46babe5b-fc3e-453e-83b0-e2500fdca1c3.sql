-- Drop the overly permissive policy that allows full access to employees table
DROP POLICY IF EXISTS "Directory access for technicians and viewers" ON public.employees;

-- Create a secure employee directory view that only exposes basic information
CREATE OR REPLACE VIEW public.employee_directory AS 
SELECT 
  id,
  first_name,
  last_name,
  role,
  department,
  status,
  created_at,
  updated_at
FROM public.employees;

-- Enable RLS on the view
ALTER VIEW public.employee_directory SET (security_barrier = true);

-- Grant SELECT access to authenticated users for the directory view
GRANT SELECT ON public.employee_directory TO authenticated;

-- Create RLS policy for the directory view - technicians and viewers can only see directory info
CREATE POLICY "Technicians and viewers can access employee directory" 
ON public.employee_directory 
FOR SELECT 
TO authenticated
USING (has_any_role(ARRAY['technician'::app_role, 'viewer'::app_role]));

-- HR and Admin can still access directory through this view as well
CREATE POLICY "HR and Admin can access employee directory" 
ON public.employee_directory 
FOR SELECT 
TO authenticated
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Project Managers can access directory through this view
CREATE POLICY "Project Managers can access employee directory" 
ON public.employee_directory 
FOR SELECT 
TO authenticated
USING (has_role('project_manager'::app_role));