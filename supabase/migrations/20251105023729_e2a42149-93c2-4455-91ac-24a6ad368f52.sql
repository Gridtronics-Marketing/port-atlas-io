-- Simply drop the check constraint to allow all point types
ALTER TABLE drop_points DROP CONSTRAINT IF EXISTS drop_points_point_type_check;