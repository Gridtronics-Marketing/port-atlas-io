-- Create storage bucket for floor plans
INSERT INTO storage.buckets (id, name, public) 
VALUES ('floor-plans', 'floor-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for floor plans storage
CREATE POLICY "Floor plans are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'floor-plans');

CREATE POLICY "Authenticated users can upload floor plans" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'floor-plans' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update floor plans" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'floor-plans' AND auth.role() = 'authenticated');