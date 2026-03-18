-- Make sensitive storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('floor-plans', 'room-views', 'tradetube-media');

-- Drop existing permissive public SELECT policies
DROP POLICY IF EXISTS "Anyone can view floor plans" ON storage.objects;
DROP POLICY IF EXISTS "Room view images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for tradetube media" ON storage.objects;

-- Create authenticated-only SELECT policies for floor-plans
CREATE POLICY "Authenticated users can view floor plans"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'floor-plans'
  AND auth.uid() IS NOT NULL
);

-- Create authenticated-only SELECT policies for room-views
CREATE POLICY "Authenticated users can view room views"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'room-views'
  AND auth.uid() IS NOT NULL
);

-- Create authenticated-only SELECT policies for tradetube-media
CREATE POLICY "Authenticated users can view tradetube media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tradetube-media'
  AND auth.uid() IS NOT NULL
);