-- First drop the old constraint
ALTER TABLE public.drop_points DROP CONSTRAINT IF EXISTS drop_points_point_type_check;

-- Normalize any uppercase values
UPDATE public.drop_points SET point_type = lower(point_type) WHERE point_type != lower(point_type);

-- Split mdf_idf into mdf or idf based on type_specific_data
UPDATE public.drop_points 
SET point_type = CASE 
  WHEN type_specific_data->>'mdf_idf_type' = 'mdf' THEN 'mdf'
  ELSE 'idf'
END
WHERE lower(point_type) = 'mdf_idf';

-- Add new constraint with separate mdf and idf
ALTER TABLE public.drop_points ADD CONSTRAINT drop_points_point_type_check 
  CHECK (point_type IN ('data', 'wifi', 'camera', 'mdf', 'idf', 'access_control', 'av', 'other', 'proposed'));