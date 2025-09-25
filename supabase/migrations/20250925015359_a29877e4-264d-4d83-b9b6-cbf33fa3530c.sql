-- Create cable_segments table for multi-hop cable routing
CREATE TABLE public.cable_segments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cable_run_id UUID NOT NULL,
    segment_order INTEGER NOT NULL,
    origin_equipment TEXT NOT NULL,
    destination_equipment TEXT NOT NULL,
    origin_floor INTEGER,
    destination_floor INTEGER,
    segment_label TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Ensure segments are ordered properly within a cable run
    UNIQUE(cable_run_id, segment_order)
);

-- Add multi-segment support fields to backbone_cables
ALTER TABLE public.backbone_cables 
ADD COLUMN is_multi_segment BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN total_segments INTEGER DEFAULT 1;

-- Enable RLS on cable_segments
ALTER TABLE public.cable_segments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cable_segments
CREATE POLICY "Staff can view all cable segments" 
ON public.cable_segments 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create cable segments" 
ON public.cable_segments 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update cable segments" 
ON public.cable_segments 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete cable segments" 
ON public.cable_segments 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cable_segments_updated_at
BEFORE UPDATE ON public.cable_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on cable_run_id queries
CREATE INDEX idx_cable_segments_cable_run_id ON public.cable_segments(cable_run_id);
CREATE INDEX idx_cable_segments_order ON public.cable_segments(cable_run_id, segment_order);