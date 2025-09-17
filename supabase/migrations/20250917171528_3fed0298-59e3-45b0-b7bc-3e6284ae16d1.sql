-- Create a security definer function to get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    ''
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO authenticated;

-- Fix clients policies
DROP POLICY IF EXISTS "Clients can view their own information" ON public.clients;
CREATE POLICY "Clients can view their own information" 
ON public.clients 
FOR SELECT 
USING (
  (contact_email = public.get_current_user_email()) OR 
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role])
);

-- Fix locations policies  
DROP POLICY IF EXISTS "Clients can view their own locations" ON public.locations;
CREATE POLICY "Clients can view their own locations" 
ON public.locations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM projects p
    JOIN clients c ON (c.id = p.client_id)
    WHERE p.id = locations.project_id 
    AND c.contact_email = public.get_current_user_email()
  )
);

-- Fix projects policies
DROP POLICY IF EXISTS "Clients can view their own projects" ON public.projects;
CREATE POLICY "Clients can view their own projects" 
ON public.projects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM clients c
    WHERE c.id = projects.client_id 
    AND c.contact_email = public.get_current_user_email()
  )
);

-- Fix work_orders policies
DROP POLICY IF EXISTS "Clients can view their work_orders" ON public.work_orders;
CREATE POLICY "Clients can view their work_orders" 
ON public.work_orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM projects p
    JOIN clients c ON (c.id = p.client_id)
    WHERE p.id = work_orders.project_id 
    AND c.contact_email = public.get_current_user_email()
  )
);