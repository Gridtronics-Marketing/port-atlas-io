-- Make floor-plans bucket public for easier access to floor plan files
UPDATE storage.buckets 
SET public = true 
WHERE id = 'floor-plans';

-- Update the allowed MIME types to include common floor plan formats
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/webp', 
  'image/svg+xml',
  'application/pdf',
  'image/tiff',
  'image/bmp'
] 
WHERE id = 'floor-plans';