-- Fix drop point status dropdown values to match database constraint
-- Option B: Roughed In -> installed, Terminated -> active

-- Update "Roughed In" dropdown option to map to 'installed' status
UPDATE dropdown_options 
SET option_value = 'installed',
    updated_at = now()
WHERE id = '53e986f1-6382-441c-943d-1115dc810614'
  AND category = 'drop_point_status' 
  AND option_key = 'roughed';

-- Update "Terminated" dropdown option to map to 'active' status
UPDATE dropdown_options 
SET option_value = 'active',
    updated_at = now()
WHERE id = '2099f15c-c2c1-4f69-9732-570a154a9bf1'
  AND category = 'drop_point_status' 
  AND option_key = 'terminated';

-- Safety measure: Migrate any existing drop points with old status values
-- (These shouldn't exist due to the constraint, but this ensures data consistency)
UPDATE drop_points 
SET status = 'installed', 
    updated_at = now() 
WHERE status = 'roughed';

UPDATE drop_points 
SET status = 'active', 
    updated_at = now() 
WHERE status = 'terminated';