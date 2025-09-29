-- Create canvas_drawings table for persistent floor plan drawings
CREATE TABLE public.canvas_drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  floor_number INTEGER NOT NULL,
  canvas_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(location_id, floor_number)
);

-- Enable RLS
ALTER TABLE public.canvas_drawings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can view canvas drawings" 
ON public.canvas_drawings 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create canvas drawings" 
ON public.canvas_drawings 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update canvas drawings" 
ON public.canvas_drawings 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete canvas drawings" 
ON public.canvas_drawings 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Add trigger for updated_at
CREATE TRIGGER update_canvas_drawings_updated_at
BEFORE UPDATE ON public.canvas_drawings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();