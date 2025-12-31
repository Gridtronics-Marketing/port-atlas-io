-- Insert profile for user
INSERT INTO profiles (id, email, full_name) 
VALUES ('b95b0a9c-bf2a-4d70-9b9e-52c88979bc15', 'aholmes@aljsolutions.com', 'Aaron Holmes') 
ON CONFLICT (id) DO NOTHING;

-- Make user a super admin
INSERT INTO platform_admins (user_id, role) 
VALUES ('b95b0a9c-bf2a-4d70-9b9e-52c88979bc15', 'super_admin') 
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Link user to ALJ Solutions as owner
INSERT INTO organization_members (user_id, organization_id, role) 
VALUES ('b95b0a9c-bf2a-4d70-9b9e-52c88979bc15', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'owner') 
ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'owner';

-- Also add Jordan to Gridtronics as owner
INSERT INTO profiles (id, email, full_name) 
VALUES ('bc138910-12d1-4060-a759-37faee5d98ff', 'jordan@gridtronics.ca', 'Jordan') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO organization_members (user_id, organization_id, role) 
VALUES ('bc138910-12d1-4060-a759-37faee5d98ff', 'dec0029e-d775-4f56-9c87-d00330e15e68', 'owner') 
ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'owner';

-- Fix the handle_new_user trigger to auto-create profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();