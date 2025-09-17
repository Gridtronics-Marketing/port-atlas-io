-- Create a secure function that returns employee directory information based on user role
CREATE OR REPLACE FUNCTION public.get_employee_directory()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  role text,
  department text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return basic directory info for technicians and viewers
  SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.role,
    e.department,
    e.status,
    e.created_at,
    e.updated_at
  FROM employees e
  WHERE has_any_role(ARRAY['technician'::app_role, 'viewer'::app_role, 'project_manager'::app_role, 'admin'::app_role, 'hr_manager'::app_role]);
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_employee_directory() TO authenticated;