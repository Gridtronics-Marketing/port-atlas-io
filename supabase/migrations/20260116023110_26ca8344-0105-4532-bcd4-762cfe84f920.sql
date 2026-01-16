-- Create wire_paths table for cable routing visualization
CREATE TABLE public.wire_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  floor INTEGER NOT NULL DEFAULT 1,
  path_points JSONB NOT NULL DEFAULT '[]',
  cable_type TEXT NOT NULL DEFAULT 'copper',
  label TEXT,
  notes TEXT,
  color TEXT DEFAULT '#3b82f6',
  status TEXT DEFAULT 'planned',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wire_paths ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view wire paths in their organization"
ON public.wire_paths FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create wire paths in their organization"
ON public.wire_paths FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update wire paths in their organization"
ON public.wire_paths FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete wire paths in their organization"
ON public.wire_paths FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_wire_paths_updated_at
BEFORE UPDATE ON public.wire_paths
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();