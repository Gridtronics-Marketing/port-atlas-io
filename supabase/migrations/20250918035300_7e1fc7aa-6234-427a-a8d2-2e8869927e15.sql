-- Create safety checklists table
CREATE TABLE public.safety_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'general', 'pre_job', 'post_job', 'hazmat', 'electrical'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_category CHECK (category IN ('general', 'pre_job', 'post_job', 'hazmat', 'electrical'))
);

-- Create safety checklist items table
CREATE TABLE public.safety_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.safety_checklists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'safety', -- 'safety', 'equipment', 'environment', 'procedures'
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_item_category CHECK (category IN ('safety', 'equipment', 'environment', 'procedures'))
);

-- Create quality checklists table
CREATE TABLE public.quality_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'general', 'installation', 'testing', 'documentation', 'handover'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_quality_category CHECK (category IN ('general', 'installation', 'testing', 'documentation', 'handover'))
);

-- Create quality checklist items table
CREATE TABLE public.quality_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.quality_checklists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'quality', -- 'quality', 'performance', 'documentation', 'compliance'
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_quality_item_category CHECK (category IN ('quality', 'performance', 'documentation', 'compliance'))
);

-- Create safety checklist submissions table
CREATE TABLE public.safety_checklist_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.safety_checklists(id),
  employee_id UUID NOT NULL,
  project_id UUID,
  location_id UUID,
  work_order_id UUID,
  overall_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'pass', 'fail', 'partial'
  responses JSONB NOT NULL DEFAULT '{}', -- Store item responses as JSON
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_safety_status CHECK (overall_status IN ('pending', 'pass', 'fail', 'partial'))
);

-- Create quality checklist submissions table
CREATE TABLE public.quality_checklist_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.quality_checklists(id),
  employee_id UUID NOT NULL,
  project_id UUID,
  location_id UUID,
  work_order_id UUID,
  overall_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'pass', 'fail', 'partial'
  responses JSONB NOT NULL DEFAULT '{}', -- Store item responses as JSON
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_quality_submission_status CHECK (overall_status IN ('pending', 'pass', 'fail', 'partial'))
);

-- Enable Row Level Security
ALTER TABLE public.safety_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_checklist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_checklist_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for safety checklists
CREATE POLICY "Staff can view all safety checklists" 
ON public.safety_checklists 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can create safety checklists" 
ON public.safety_checklists 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Admins can update safety checklists" 
ON public.safety_checklists 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Admins can delete safety checklists" 
ON public.safety_checklists 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Create RLS policies for safety checklist items
CREATE POLICY "Staff can view all safety checklist items" 
ON public.safety_checklist_items 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can manage safety checklist items" 
ON public.safety_checklist_items 
FOR ALL 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Create RLS policies for quality checklists
CREATE POLICY "Staff can view all quality checklists" 
ON public.quality_checklists 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can create quality checklists" 
ON public.quality_checklists 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Admins can update quality checklists" 
ON public.quality_checklists 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Admins can delete quality checklists" 
ON public.quality_checklists 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Create RLS policies for quality checklist items
CREATE POLICY "Staff can view all quality checklist items" 
ON public.quality_checklist_items 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can manage quality checklist items" 
ON public.quality_checklist_items 
FOR ALL 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Create RLS policies for safety submissions
CREATE POLICY "Staff can view safety submissions" 
ON public.safety_checklist_submissions 
FOR SELECT 
USING (
  employee_id IN (SELECT id FROM employees WHERE email = get_current_user_email()) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role])
);

CREATE POLICY "Staff can create safety submissions" 
ON public.safety_checklist_submissions 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update safety submissions" 
ON public.safety_checklist_submissions 
FOR UPDATE 
USING (
  employee_id IN (SELECT id FROM employees WHERE email = get_current_user_email()) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role])
);

-- Create RLS policies for quality submissions
CREATE POLICY "Staff can view quality submissions" 
ON public.quality_checklist_submissions 
FOR SELECT 
USING (
  employee_id IN (SELECT id FROM employees WHERE email = get_current_user_email()) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role])
);

CREATE POLICY "Staff can create quality submissions" 
ON public.quality_checklist_submissions 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update quality submissions" 
ON public.quality_checklist_submissions 
FOR UPDATE 
USING (
  employee_id IN (SELECT id FROM employees WHERE email = get_current_user_email()) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role])
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_safety_checklists_updated_at
BEFORE UPDATE ON public.safety_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safety_checklist_items_updated_at
BEFORE UPDATE ON public.safety_checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quality_checklists_updated_at
BEFORE UPDATE ON public.quality_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quality_checklist_items_updated_at
BEFORE UPDATE ON public.quality_checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safety_checklist_submissions_updated_at
BEFORE UPDATE ON public.safety_checklist_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quality_checklist_submissions_updated_at
BEFORE UPDATE ON public.quality_checklist_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_safety_checklists_active ON public.safety_checklists(is_active);
CREATE INDEX idx_safety_checklists_category ON public.safety_checklists(category);
CREATE INDEX idx_safety_checklist_items_checklist ON public.safety_checklist_items(checklist_id);
CREATE INDEX idx_safety_checklist_items_order ON public.safety_checklist_items(checklist_id, sort_order);

CREATE INDEX idx_quality_checklists_active ON public.quality_checklists(is_active);
CREATE INDEX idx_quality_checklists_category ON public.quality_checklists(category);
CREATE INDEX idx_quality_checklist_items_checklist ON public.quality_checklist_items(checklist_id);
CREATE INDEX idx_quality_checklist_items_order ON public.quality_checklist_items(checklist_id, sort_order);

CREATE INDEX idx_safety_submissions_employee ON public.safety_checklist_submissions(employee_id);
CREATE INDEX idx_safety_submissions_checklist ON public.safety_checklist_submissions(checklist_id);
CREATE INDEX idx_safety_submissions_date ON public.safety_checklist_submissions(submitted_at);

CREATE INDEX idx_quality_submissions_employee ON public.quality_checklist_submissions(employee_id);
CREATE INDEX idx_quality_submissions_checklist ON public.quality_checklist_submissions(checklist_id);
CREATE INDEX idx_quality_submissions_date ON public.quality_checklist_submissions(submitted_at);