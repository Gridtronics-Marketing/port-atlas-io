-- Create drop_point_photos table for better photo organization
CREATE TABLE public.drop_point_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_point_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  description TEXT,
  employee_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drop_point_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can view drop point photos" 
ON public.drop_point_photos 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create drop point photos" 
ON public.drop_point_photos 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update drop point photos" 
ON public.drop_point_photos 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete drop point photos" 
ON public.drop_point_photos 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Add trigger for updated_at
CREATE TRIGGER update_drop_point_photos_updated_at
BEFORE UPDATE ON public.drop_point_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();