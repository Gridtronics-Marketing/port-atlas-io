-- Create room-views storage bucket for room view photos
INSERT INTO storage.buckets (id, name, public) VALUES ('room-views', 'room-views', true);

-- Create policies for room-views bucket
CREATE POLICY "Room view images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'room-views');

CREATE POLICY "Authenticated users can upload room view images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'room-views' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update room view images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'room-views' AND auth.uid() IS NOT NULL);