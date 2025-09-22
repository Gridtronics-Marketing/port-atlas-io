-- Create floor-plans storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('floor-plans', 'floor-plans', true, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for floor-plans bucket
CREATE POLICY "Anyone can view floor plans" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'floor-plans');

CREATE POLICY "Authenticated users can upload floor plans" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'floor-plans' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their floor plans" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'floor-plans' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete floor plans" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'floor-plans' AND auth.uid() IS NOT NULL);