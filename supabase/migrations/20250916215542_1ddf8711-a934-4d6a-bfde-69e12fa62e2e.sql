-- Create storage bucket for floor plans
INSERT INTO storage.buckets (id, name, public) 
VALUES ('floor-plans', 'floor-plans', false);

-- Create policies for floor plan uploads
CREATE POLICY "Users can view floor plans they have access to" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'floor-plans' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload floor plans" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'floor-plans' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their floor plans" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'floor-plans' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their floor plans" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'floor-plans' AND auth.uid() IS NOT NULL);

-- Add floor_plan_files column to locations table to track uploaded files
ALTER TABLE public.locations 
ADD COLUMN floor_plan_files JSONB DEFAULT '{}';

-- Add comment explaining the structure
COMMENT ON COLUMN public.locations.floor_plan_files IS 'JSON object mapping floor numbers to file paths in storage, e.g. {"1": "location_id/floor_1.pdf", "2": "location_id/floor_2.jpg"}';