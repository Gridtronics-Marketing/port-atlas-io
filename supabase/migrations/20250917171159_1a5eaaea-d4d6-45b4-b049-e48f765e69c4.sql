-- Create a security definer function that returns employee directory info based on user role
CREATE OR REPLACE FUNCTION public.get_employee_directory()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  role text,
  department text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return directory info for technicians and viewers
  -- HR/Admin and Project Managers should use the main employees table
  SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.role,
    e.department,
    e.status,
    e.created_at,
    e.updated_at
  FROM public.employees e
  WHERE has_any_role(ARRAY['technician'::app_role, 'viewer'::app_role]);
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_employee_directory() TO authenticated;