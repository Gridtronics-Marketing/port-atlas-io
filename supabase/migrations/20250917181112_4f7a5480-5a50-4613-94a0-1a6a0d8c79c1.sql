-- Add client association to employees for multi-tenant support
ALTER TABLE public.employees 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for better performance on client queries
CREATE INDEX idx_employees_client_id ON public.employees(client_id);

-- Update employees RLS policies for multi-tenant access
DROP POLICY IF EXISTS "Directory access for technicians and viewers" ON public.employees;
DROP POLICY IF EXISTS "HR and Admin can view all employee data" ON public.employees;
DROP POLICY IF EXISTS "Project Managers can view basic employee info" ON public.employees;
DROP POLICY IF EXISTS "HR and Admin can update all employee data" ON public.employees;
DROP POLICY IF EXISTS "HR and Admin can insert employees" ON public.employees;
DROP POLICY IF EXISTS "HR and Admin can delete employees" ON public.employees;

-- Create new multi-tenant RLS policies for employees
CREATE POLICY "Company admin and HR can view all employees" 
ON public.employees 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Client users can view their client employees" 
ON public.employees 
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id FROM public.clients c 
    WHERE c.contact_email = get_current_user_email()
  ) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role])
);

CREATE POLICY "Technicians and viewers can view directory info" 
ON public.employees 
FOR SELECT 
USING (has_any_role(ARRAY['technician'::app_role, 'viewer'::app_role, 'client_technician'::app_role]));

CREATE POLICY "Company admin and HR can insert employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Client admins can insert their client employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (
  (client_id IN (
    SELECT c.id FROM public.clients c 
    WHERE c.contact_email = get_current_user_email()
  ) AND has_role('client_admin'::app_role)) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

CREATE POLICY "Company admin and HR can update employees" 
ON public.employees 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Client admins can update their client employees" 
ON public.employees 
FOR UPDATE 
USING (
  (client_id IN (
    SELECT c.id FROM public.clients c 
    WHERE c.contact_email = get_current_user_email()
  ) AND has_role('client_admin'::app_role)) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role])
)
WITH CHECK (
  (client_id IN (
    SELECT c.id FROM public.clients c 
    WHERE c.contact_email = get_current_user_email()
  ) AND has_role('client_admin'::app_role)) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

CREATE POLICY "Company admin and HR can delete employees" 
ON public.employees 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Update projects RLS for multi-tenant access
DROP POLICY IF EXISTS "Clients can view their own projects" ON public.projects;
CREATE POLICY "Clients and their technicians can view their projects" 
ON public.projects 
FOR SELECT 
USING (
  (client_id IN (
    SELECT c.id FROM public.clients c 
    WHERE c.contact_email = get_current_user_email()
  )) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role])
);

-- Update work_orders RLS for multi-tenant access
DROP POLICY IF EXISTS "Clients can view their work_orders" ON public.work_orders;
CREATE POLICY "Clients and their technicians can view their work_orders" 
ON public.work_orders 
FOR SELECT 
USING (
  (project_id IN (
    SELECT p.id FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE c.contact_email = get_current_user_email()
  )) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role])
);

-- Update locations RLS for multi-tenant access
DROP POLICY IF EXISTS "Clients can view their own locations" ON public.locations;
CREATE POLICY "Clients and their technicians can view their locations" 
ON public.locations 
FOR SELECT 
USING (
  (project_id IN (
    SELECT p.id FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE c.contact_email = get_current_user_email()
  )) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role])
);

-- Create function to get current user's client
CREATE OR REPLACE FUNCTION public.get_current_user_client_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT c.id 
  FROM public.clients c 
  WHERE c.contact_email = get_current_user_email()
  LIMIT 1;
$function$;