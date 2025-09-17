-- First, let's check if the user already has admin role and add it if not
-- This will find the user by email and ensure they have admin role

DO $$ 
DECLARE
    user_uuid uuid;
BEGIN
    -- Get the user ID for Jordan@gridtronics.ca
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'jordan@gridtronics.ca';
    
    -- If user exists and doesn't already have admin role, add it
    IF user_uuid IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        SELECT user_uuid, 'admin'::app_role
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = user_uuid AND role = 'admin'::app_role
        );
        
        RAISE NOTICE 'Admin role processed for user: %', user_uuid;
    ELSE
        RAISE NOTICE 'User with email jordan@gridtronics.ca not found';
    END IF;
END $$;