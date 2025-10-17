-- Add photo_type column to room_view_photos
ALTER TABLE room_view_photos 
ADD COLUMN IF NOT EXISTS photo_type TEXT DEFAULT 'standard';

-- Add check constraint for valid photo types
ALTER TABLE room_view_photos 
ADD CONSTRAINT valid_photo_type 
CHECK (photo_type IN ('standard', 'panoramic'));

-- Ensure employee_id can be null in daily_logs (for admin captures)
ALTER TABLE daily_logs 
ALTER COLUMN employee_id DROP NOT NULL;