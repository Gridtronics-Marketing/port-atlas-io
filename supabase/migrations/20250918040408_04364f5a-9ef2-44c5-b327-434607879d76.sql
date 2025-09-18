-- Add admin role for the current authenticated user
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    -- Only proceed if user is authenticated
    IF current_user_id IS NOT NULL THEN
        -- Insert admin role for current user
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (current_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;