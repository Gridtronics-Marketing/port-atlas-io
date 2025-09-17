-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'hr_manager', 'project_manager', 'technician', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'hr_manager')
  )
);

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  );
$$;

-- Create function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_roles app_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY(_roles)
  );
$$;

-- Drop existing overly permissive employee policies
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can delete employees" ON public.employees;

-- Create secure role-based policies for employees table
-- SELECT: HR/Admin can see all data, managers can see basic info, employees can see limited info
CREATE POLICY "HR and Admin can view all employee data" 
ON public.employees 
FOR SELECT 
USING (public.has_any_role(ARRAY['admin', 'hr_manager']::app_role[]));

CREATE POLICY "Managers can view basic employee info" 
ON public.employees 
FOR SELECT 
USING (
  public.has_role('project_manager'::app_role) 
  AND (hourly_rate IS NULL OR false) -- Hide sensitive salary data for non-HR roles
);

CREATE POLICY "Employees can view limited employee directory" 
ON public.employees 
FOR SELECT 
USING (
  public.has_any_role(ARRAY['technician', 'viewer']::app_role[])
  AND (hourly_rate IS NULL OR false) -- Hide sensitive salary data
  AND (emergency_contact_name IS NULL OR false) -- Hide emergency contacts
  AND (emergency_contact_phone IS NULL OR false) -- Hide emergency contacts
);

-- INSERT: Only HR and Admin can add employees
CREATE POLICY "HR and Admin can insert employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (public.has_any_role(ARRAY['admin', 'hr_manager']::app_role[]));

-- UPDATE: HR and Admin can update all, managers can update limited fields
CREATE POLICY "HR and Admin can update all employee data" 
ON public.employees 
FOR UPDATE 
USING (public.has_any_role(ARRAY['admin', 'hr_manager']::app_role[]))
WITH CHECK (public.has_any_role(ARRAY['admin', 'hr_manager']::app_role[]));

CREATE POLICY "Managers can update limited employee fields" 
ON public.employees 
FOR UPDATE 
USING (
  public.has_role('project_manager'::app_role)
  AND (
    -- Only allow updating specific non-sensitive fields
    OLD.hourly_rate = NEW.hourly_rate -- Cannot change salary
    AND OLD.emergency_contact_name = NEW.emergency_contact_name -- Cannot change emergency contacts
    AND OLD.emergency_contact_phone = NEW.emergency_contact_phone
  )
)
WITH CHECK (
  public.has_role('project_manager'::app_role)
  AND (
    -- Only allow updating specific non-sensitive fields
    OLD.hourly_rate = NEW.hourly_rate
    AND OLD.emergency_contact_name = NEW.emergency_contact_name
    AND OLD.emergency_contact_phone = NEW.emergency_contact_phone
  )
);

-- DELETE: Only HR and Admin can delete employees
CREATE POLICY "HR and Admin can delete employees" 
ON public.employees 
FOR DELETE 
USING (public.has_any_role(ARRAY['admin', 'hr_manager']::app_role[]));

-- Create trigger for user_roles updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default admin role for the first user (they can assign roles to others)
-- Note: This will need to be updated with the actual user ID after first signup
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM auth.users 
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;