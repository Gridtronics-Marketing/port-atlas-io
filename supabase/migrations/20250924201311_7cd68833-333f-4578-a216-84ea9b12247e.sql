-- Create junction boxes table for cable path management
CREATE TABLE public.cable_junction_boxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id),
  backbone_cable_id UUID REFERENCES public.backbone_cables(id),
  junction_type TEXT NOT NULL DEFAULT 'junction_box',
  floor INTEGER NOT NULL,
  x_coordinate NUMERIC,
  y_coordinate NUMERIC,
  label TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cable_junction_boxes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can view all junction boxes" 
ON public.cable_junction_boxes 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create junction boxes" 
ON public.cable_junction_boxes 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update junction boxes" 
ON public.cable_junction_boxes 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete junction boxes" 
ON public.cable_junction_boxes 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_junction_boxes_updated_at
BEFORE UPDATE ON public.cable_junction_boxes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();