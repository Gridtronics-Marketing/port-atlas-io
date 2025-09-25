-- Create configuration tables for the comprehensive settings system

-- System configurations table for general settings
CREATE TABLE public.system_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  data_type text NOT NULL DEFAULT 'string',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

-- Dropdown options table for all configurable dropdown values
CREATE TABLE public.dropdown_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  option_key text NOT NULL,
  option_value text NOT NULL,
  display_name text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category, option_key)
);

-- Business rules table for configurable business logic
CREATE TABLE public.business_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name text NOT NULL UNIQUE,
  rule_type text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  priority integer DEFAULT 0,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Notification templates table for customizable notifications
CREATE TABLE public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name text NOT NULL UNIQUE,
  template_type text NOT NULL,
  subject_template text,
  body_template text NOT NULL,
  variables jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Workflow configurations table for process-specific settings
CREATE TABLE public.workflow_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name text NOT NULL UNIQUE,
  workflow_type text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  approval_rules jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for configuration tables (admin only for modify, staff for view)
CREATE POLICY "Admins can manage system configurations" ON public.system_configurations
FOR ALL USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Staff can view system configurations" ON public.system_configurations
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can manage dropdown options" ON public.dropdown_options
FOR ALL USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Staff can view dropdown options" ON public.dropdown_options
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can manage business rules" ON public.business_rules
FOR ALL USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Staff can view business rules" ON public.business_rules
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can manage notification templates" ON public.notification_templates
FOR ALL USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Staff can view notification templates" ON public.notification_templates
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can manage workflow configurations" ON public.workflow_configurations
FOR ALL USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Staff can view workflow configurations" ON public.workflow_configurations
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- Create triggers for updated_at
CREATE TRIGGER update_system_configurations_updated_at
BEFORE UPDATE ON public.system_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dropdown_options_updated_at
BEFORE UPDATE ON public.dropdown_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_rules_updated_at
BEFORE UPDATE ON public.business_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_configurations_updated_at
BEFORE UPDATE ON public.workflow_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial dropdown options for commonly used values
INSERT INTO public.dropdown_options (category, option_key, option_value, display_name, sort_order) VALUES
-- Cable types
('cable_types', 'fiber_singlemode', 'fiber_singlemode', 'Fiber - Single Mode', 1),
('cable_types', 'fiber_multimode', 'fiber_multimode', 'Fiber - Multi Mode', 2),
('cable_types', 'copper_cat6', 'copper_cat6', 'Copper - Cat6', 3),
('cable_types', 'copper_cat6a', 'copper_cat6a', 'Copper - Cat6A', 4),
('cable_types', 'copper_cat5e', 'copper_cat5e', 'Copper - Cat5E', 5),
('cable_types', 'coax_rg6', 'coax_rg6', 'Coax - RG6', 6),

-- Employee roles
('employee_roles', 'admin', 'admin', 'Administrator', 1),
('employee_roles', 'hr_manager', 'hr_manager', 'HR Manager', 2),
('employee_roles', 'project_manager', 'project_manager', 'Project Manager', 3),
('employee_roles', 'technician', 'technician', 'Technician', 4),
('employee_roles', 'viewer', 'viewer', 'Viewer', 5),

-- Project statuses
('project_statuses', 'planning', 'Planning', 'Planning', 1),
('project_statuses', 'in_progress', 'In Progress', 'In Progress', 2),
('project_statuses', 'on_hold', 'On Hold', 'On Hold', 3),
('project_statuses', 'completed', 'Completed', 'Completed', 4),
('project_statuses', 'cancelled', 'Cancelled', 'Cancelled', 5),

-- Project priorities
('project_priorities', 'low', 'Low', 'Low', 1),
('project_priorities', 'medium', 'Medium', 'Medium', 2),
('project_priorities', 'high', 'High', 'High', 3),
('project_priorities', 'urgent', 'Urgent', 'Urgent', 4),

-- Equipment statuses
('equipment_statuses', 'available', 'Available', 'Available', 1),
('equipment_statuses', 'in_use', 'In Use', 'In Use', 2),
('equipment_statuses', 'maintenance', 'Maintenance', 'Maintenance', 3),
('equipment_statuses', 'retired', 'Retired', 'Retired', 4),

-- Drop point types
('drop_point_types', 'data', 'data', 'Data', 1),
('drop_point_types', 'voice', 'voice', 'Voice', 2),
('drop_point_types', 'video', 'video', 'Video', 3),
('drop_point_types', 'wireless_ap', 'wireless_ap', 'Wireless AP', 4),
('drop_point_types', 'security_camera', 'security_camera', 'Security Camera', 5);