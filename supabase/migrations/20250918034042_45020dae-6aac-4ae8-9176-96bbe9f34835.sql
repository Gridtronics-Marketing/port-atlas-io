-- Create employee schedules table
CREATE TABLE public.employee_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  project_id UUID,
  location_id UUID,
  work_order_id UUID,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'assignment', -- 'assignment', 'template', 'time_off'
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled'
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_schedule_type CHECK (schedule_type IN ('assignment', 'template', 'time_off')),
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'))
);

-- Create schedule templates table for recurring schedules
CREATE TABLE public.schedule_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  employee_id UUID,
  project_id UUID,
  location_id UUID,
  days_of_week INTEGER[] NOT NULL, -- Array of 0-6 (Sunday-Saturday)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  effective_start_date DATE NOT NULL,
  effective_end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_days_of_week CHECK (
    array_length(days_of_week, 1) > 0 AND 
    days_of_week <@ ARRAY[0,1,2,3,4,5,6]
  )
);

-- Create employee availability table for time-off and availability tracking
CREATE TABLE public.employee_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  availability_type TEXT NOT NULL DEFAULT 'time_off', -- 'time_off', 'available', 'unavailable'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  ),
  CONSTRAINT valid_availability_type CHECK (availability_type IN ('time_off', 'available', 'unavailable')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'denied'))
);

-- Enable Row Level Security
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employee_schedules
CREATE POLICY "Staff can view all schedules" 
ON public.employee_schedules 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Employees can view their own schedules" 
ON public.employee_schedules 
FOR SELECT 
USING (employee_id IN (SELECT id FROM employees WHERE email = get_current_user_email()));

CREATE POLICY "Staff can create schedules" 
ON public.employee_schedules 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can update schedules" 
ON public.employee_schedules 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can delete schedules" 
ON public.employee_schedules 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Create RLS policies for schedule_templates
CREATE POLICY "Staff can view all templates" 
ON public.schedule_templates 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can create templates" 
ON public.schedule_templates 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can update templates" 
ON public.schedule_templates 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can delete templates" 
ON public.schedule_templates 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Create RLS policies for employee_availability
CREATE POLICY "Staff can view all availability" 
ON public.employee_availability 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Employees can view their own availability" 
ON public.employee_availability 
FOR SELECT 
USING (employee_id IN (SELECT id FROM employees WHERE email = get_current_user_email()));

CREATE POLICY "Employees can create their own availability requests" 
ON public.employee_availability 
FOR INSERT 
WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE email = get_current_user_email()) OR
  has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role])
);

CREATE POLICY "Staff can update availability" 
ON public.employee_availability 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]))
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can delete availability" 
ON public.employee_availability 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Create triggers for updated_at columns
CREATE TRIGGER update_employee_schedules_updated_at
BEFORE UPDATE ON public.employee_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_templates_updated_at
BEFORE UPDATE ON public.schedule_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_availability_updated_at
BEFORE UPDATE ON public.employee_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_employee_schedules_employee_date ON public.employee_schedules(employee_id, schedule_date);
CREATE INDEX idx_employee_schedules_project ON public.employee_schedules(project_id);
CREATE INDEX idx_employee_schedules_location ON public.employee_schedules(location_id);
CREATE INDEX idx_employee_schedules_date_range ON public.employee_schedules(schedule_date, start_time, end_time);

CREATE INDEX idx_schedule_templates_employee ON public.schedule_templates(employee_id);
CREATE INDEX idx_schedule_templates_active ON public.schedule_templates(is_active);
CREATE INDEX idx_schedule_templates_dates ON public.schedule_templates(effective_start_date, effective_end_date);

CREATE INDEX idx_employee_availability_employee ON public.employee_availability(employee_id);
CREATE INDEX idx_employee_availability_dates ON public.employee_availability(start_date, end_date);
CREATE INDEX idx_employee_availability_status ON public.employee_availability(status);