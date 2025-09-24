-- Create backbone_cables table for structured cabling
CREATE TABLE public.backbone_cables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  cable_type TEXT NOT NULL CHECK (cable_type IN ('fiber', 'copper', 'coax')),
  cable_subtype TEXT, -- singlemode, multimode, Cat5e, Cat6, Cat6A, etc.
  strand_count INTEGER,
  pair_count INTEGER,
  jacket_rating TEXT CHECK (jacket_rating IN ('plenum', 'riser', 'LSZH')),
  origin_floor INTEGER,
  destination_floor INTEGER,
  origin_equipment TEXT,
  destination_equipment TEXT,
  labeling_standard TEXT DEFAULT 'TIA-606',
  cable_label TEXT NOT NULL,
  unique_id TEXT UNIQUE,
  installation_date DATE,
  test_results JSONB DEFAULT '{}',
  capacity_total INTEGER,
  capacity_used INTEGER DEFAULT 0,
  capacity_spare INTEGER GENERATED ALWAYS AS (capacity_total - capacity_used) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create distribution_frames table (MDF/IDF equipment)
CREATE TABLE public.distribution_frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  frame_type TEXT NOT NULL CHECK (frame_type IN ('MDF', 'IDF')),
  floor INTEGER NOT NULL,
  room TEXT,
  rack_position INTEGER,
  equipment_details JSONB DEFAULT '{}',
  port_count INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 0,
  patch_panels JSONB DEFAULT '[]',
  x_coordinate NUMERIC,
  y_coordinate NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create riser_pathways table for cable routing
CREATE TABLE public.riser_pathways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  pathway_type TEXT NOT NULL CHECK (pathway_type IN ('riser_shaft', 'cable_tray', 'conduit', 'innerduct')),
  pathway_name TEXT NOT NULL,
  floors_served INTEGER[] DEFAULT '{}',
  fire_stops JSONB DEFAULT '[]',
  pathway_capacity INTEGER,
  utilization_percentage INTEGER DEFAULT 0,
  x_coordinate NUMERIC,
  y_coordinate NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cable_connections table for port mapping
CREATE TABLE public.cable_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backbone_cable_id UUID REFERENCES public.backbone_cables(id) ON DELETE CASCADE,
  from_frame_id UUID REFERENCES public.distribution_frames(id),
  to_frame_id UUID REFERENCES public.distribution_frames(id),
  from_port TEXT,
  to_port TEXT,
  connection_type TEXT DEFAULT 'patch',
  redundancy_group TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.backbone_cables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riser_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cable_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for backbone_cables
CREATE POLICY "Staff can view all backbone cables" 
ON public.backbone_cables FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create backbone cables" 
ON public.backbone_cables FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update backbone cables" 
ON public.backbone_cables FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete backbone cables" 
ON public.backbone_cables FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Create RLS policies for distribution_frames
CREATE POLICY "Staff can view all distribution frames" 
ON public.distribution_frames FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create distribution frames" 
ON public.distribution_frames FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update distribution frames" 
ON public.distribution_frames FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete distribution frames" 
ON public.distribution_frames FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Create RLS policies for riser_pathways
CREATE POLICY "Staff can view all riser pathways" 
ON public.riser_pathways FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create riser pathways" 
ON public.riser_pathways FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update riser pathways" 
ON public.riser_pathways FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete riser pathways" 
ON public.riser_pathways FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Create RLS policies for cable_connections
CREATE POLICY "Staff can view all cable connections" 
ON public.cable_connections FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create cable connections" 
ON public.cable_connections FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update cable connections" 
ON public.cable_connections FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete cable connections" 
ON public.cable_connections FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Create triggers for updated_at columns
CREATE TRIGGER update_backbone_cables_updated_at
  BEFORE UPDATE ON public.backbone_cables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_distribution_frames_updated_at
  BEFORE UPDATE ON public.distribution_frames
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_riser_pathways_updated_at
  BEFORE UPDATE ON public.riser_pathways
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cable_connections_updated_at
  BEFORE UPDATE ON public.cable_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create useful indexes
CREATE INDEX idx_backbone_cables_location_id ON public.backbone_cables(location_id);
CREATE INDEX idx_backbone_cables_cable_type ON public.backbone_cables(cable_type);
CREATE INDEX idx_distribution_frames_location_id ON public.distribution_frames(location_id);
CREATE INDEX idx_distribution_frames_frame_type ON public.distribution_frames(frame_type);
CREATE INDEX idx_riser_pathways_location_id ON public.riser_pathways(location_id);
CREATE INDEX idx_cable_connections_backbone_cable_id ON public.cable_connections(backbone_cable_id);