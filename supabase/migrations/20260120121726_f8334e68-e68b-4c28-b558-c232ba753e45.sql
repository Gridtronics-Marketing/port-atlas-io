-- Part 2: Create functions and triggers for employee sync

-- Create function to sync employee data when user with employee role is created
CREATE OR REPLACE FUNCTION public.sync_employee_on_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_employee_id UUID;
BEGIN
  -- Only handle 'employee' role assignments
  IF NEW.role = 'employee' THEN
    -- Get user email
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
    
    -- Check if employee record exists for this user
    SELECT id INTO v_employee_id 
    FROM public.employees 
    WHERE user_id = NEW.user_id OR email = v_email;
    
    -- If no employee record exists, and we have an email, try to link by email
    IF v_employee_id IS NULL AND v_email IS NOT NULL THEN
      -- Try to find an unlinked employee by email and link them
      UPDATE public.employees 
      SET user_id = NEW.user_id
      WHERE email = v_email AND user_id IS NULL
      RETURNING id INTO v_employee_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role assignment sync
DROP TRIGGER IF EXISTS trigger_sync_employee_on_role ON public.user_roles;
CREATE TRIGGER trigger_sync_employee_on_role
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_employee_on_role_assignment();

-- Create function to handle employee status when employee role is removed
CREATE OR REPLACE FUNCTION public.handle_employee_role_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When employee role is removed, mark the employee as terminated (don't delete)
  IF OLD.role = 'employee' THEN
    UPDATE public.employees 
    SET status = 'Terminated'
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger for role removal
DROP TRIGGER IF EXISTS trigger_handle_employee_role_removal ON public.user_roles;
CREATE TRIGGER trigger_handle_employee_role_removal
  AFTER DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_employee_role_removal();

-- Create helper function to check if user is an employee
CREATE OR REPLACE FUNCTION public.is_employee(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'employee'
  )
$$;

-- Backfill: Link existing employees to users by matching email
UPDATE public.employees e
SET user_id = u.id
FROM auth.users u
WHERE e.email = u.email
  AND e.user_id IS NULL;