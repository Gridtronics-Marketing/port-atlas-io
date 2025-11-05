-- Update any remaining old point types to new standardized types
UPDATE drop_points 
SET point_type = 'wifi'
WHERE point_type = 'wireless';

UPDATE drop_points 
SET point_type = 'camera'
WHERE point_type = 'security';

UPDATE drop_points 
SET point_type = 'data'
WHERE point_type IS NULL OR point_type = 'fiber';

-- Add the check constraint with all supported drop point types
ALTER TABLE drop_points ADD CONSTRAINT drop_points_point_type_check 
  CHECK (point_type IN ('data', 'wifi', 'camera', 'mdf_idf', 'access_control', 'av', 'other'));