-- Fix security vulnerability in room_views table
-- Current policy allows public access to sensitive facility photos and coordinates

-- Drop the insecure public SELECT policy
DROP POLICY IF EXISTS "Users can view all room views" ON public.room_views;

-- Create secure RLS policies for room_views table
-- Staff can view all room views
CREATE POLICY "Staff can view all room views" 
ON public.room_views 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- Clients can only view room views for their own project locations
CREATE POLICY "Clients can view room views for their locations" 
ON public.room_views 
FOR SELECT 
USING (
  location_id IN (
    SELECT l.id 
    FROM locations l
    JOIN projects p ON l.project_id = p.id
    JOIN clients c ON p.client_id = c.id
    WHERE c.contact_email = get_current_user_email()
  )
);

-- Update INSERT policy to be more restrictive - only staff and client technicians
DROP POLICY IF EXISTS "Users can create room views" ON public.room_views;
CREATE POLICY "Staff and client technicians can create room views" 
ON public.room_views 
FOR INSERT 
WITH CHECK (
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role, 'client_technician'::app_role])
);

-- Update UPDATE policy to be role-based
DROP POLICY IF EXISTS "Users can update room views" ON public.room_views;
CREATE POLICY "Staff can update room views" 
ON public.room_views 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- Update DELETE policy to be role-based  
DROP POLICY IF EXISTS "Users can delete room views" ON public.room_views;
CREATE POLICY "Staff can delete room views" 
ON public.room_views 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));