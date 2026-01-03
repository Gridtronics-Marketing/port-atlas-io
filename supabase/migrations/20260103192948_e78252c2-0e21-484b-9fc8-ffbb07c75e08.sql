-- Convert ceiling_height from TEXT to NUMERIC
ALTER TABLE room_views 
ALTER COLUMN ceiling_height TYPE NUMERIC 
USING (
  CASE 
    WHEN ceiling_height ~ '^[0-9]+\.?[0-9]*' 
    THEN REGEXP_REPLACE(ceiling_height, '[^0-9.]', '', 'g')::NUMERIC
    ELSE NULL
  END
);

-- Add ceiling height unit field
ALTER TABLE room_views 
ADD COLUMN IF NOT EXISTS ceiling_height_unit TEXT DEFAULT 'ft';

-- Add comment for clarity
COMMENT ON COLUMN room_views.ceiling_height IS 'Ceiling height as numeric value';
COMMENT ON COLUMN room_views.ceiling_height_unit IS 'Unit for ceiling height (ft, m, in, cm)';