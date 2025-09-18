-- Create storage bucket for floor plans
INSERT INTO storage.buckets (id, name, public) 
VALUES ('floor-plans', 'floor-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for floor plans storage
CREATE POLICY IF NOT EXISTS "Floor plans are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'floor-plans');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload floor plans" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'floor-plans' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can update floor plans" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'floor-plans' AND auth.role() = 'authenticated');