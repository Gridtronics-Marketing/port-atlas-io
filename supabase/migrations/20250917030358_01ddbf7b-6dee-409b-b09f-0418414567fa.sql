-- Fix infinite recursion in user_roles RLS policies
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create new policies using security definer functions to prevent recursion
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (public.has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (public.has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Also create a policy to allow users to see basic role information for the user directory
CREATE POLICY "Authenticated users can view role assignments for directory" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (true);