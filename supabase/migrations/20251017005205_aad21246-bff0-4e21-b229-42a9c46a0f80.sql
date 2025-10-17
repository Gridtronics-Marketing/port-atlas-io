-- Add photo_type column to drop_point_photos table for panoramic support
ALTER TABLE drop_point_photos 
ADD COLUMN IF NOT EXISTS photo_type TEXT DEFAULT 'standard';

-- Add constraint to validate photo_type values
ALTER TABLE drop_point_photos 
ADD CONSTRAINT drop_point_photos_valid_photo_type 
CHECK (photo_type IN ('standard', 'panoramic'));