-- Remove Aaron from platform_admins (he's org admin, not super admin)
DELETE FROM platform_admins WHERE user_id = 'b95b0a9c-bf2a-4d70-9b9e-52c88979bc15';

-- Make Jordan the super admin
INSERT INTO platform_admins (user_id, role) 
VALUES ('bc138910-12d1-4060-a759-37faee5d98ff', 'super_admin') 
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Update Aaron's org membership to 'admin' (not owner)
UPDATE organization_members 
SET role = 'admin' 
WHERE user_id = 'b95b0a9c-bf2a-4d70-9b9e-52c88979bc15' 
  AND organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';