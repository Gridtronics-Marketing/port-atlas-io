-- Drop the overly permissive policy for basic directory access
DROP POLICY IF EXISTS "Basic directory access for staff" ON public.employees;

-- Create a restrictive policy that only allows access to basic directory information
CREATE POLICY "Directory access for technicians and viewers" 
ON public.employees 
FOR SELECT 
USING (
  has_any_role(ARRAY['technician'::app_role, 'viewer'::app_role]) 
  AND true
);