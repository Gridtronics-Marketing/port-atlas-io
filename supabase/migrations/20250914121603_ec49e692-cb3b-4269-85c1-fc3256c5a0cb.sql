-- Create comprehensive database schema for ALJ Solutions project management system

-- 1. Companies/Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  billing_address TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Projects/Jobs table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  description TEXT,
  project_type TEXT DEFAULT 'Network Installation',
  status TEXT DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  start_date DATE,
  end_date DATE,
  estimated_budget DECIMAL(10,2),
  actual_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Locations/Sites table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  building_type TEXT,
  floors INTEGER DEFAULT 1,
  total_square_feet INTEGER,
  access_instructions TEXT,
  contact_onsite TEXT,
  contact_phone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'In Progress', 'Completed', 'On Hold')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT NOT NULL,
  department TEXT,
  hire_date DATE,
  hourly_rate DECIMAL(8,2),
  skills TEXT[],
  certifications TEXT[],
  certification_expiry JSONB, -- Store cert name and expiry date pairs
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave', 'Terminated')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Drop Points/Network Points table
CREATE TABLE public.drop_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  room TEXT,
  floor INTEGER,
  point_type TEXT DEFAULT 'data' CHECK (point_type IN ('data', 'fiber', 'security', 'wireless', 'power')),
  x_coordinate DECIMAL(5,2), -- For interactive map positioning
  y_coordinate DECIMAL(5,2),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'installed', 'tested', 'active', 'inactive')),
  cable_id TEXT,
  patch_panel_port TEXT,
  switch_port TEXT,
  vlan TEXT,
  ip_address INET,
  mac_address TEXT,
  test_results JSONB,
  notes TEXT,
  installed_by UUID REFERENCES public.employees(id),
  installed_date TIMESTAMP WITH TIME ZONE,
  tested_by UUID REFERENCES public.employees(id),
  tested_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Equipment/Assets table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_tag TEXT UNIQUE,
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('Switch', 'Router', 'Server', 'Firewall', 'UPS', 'Patch Panel', 'Cable', 'Tool', 'Test Equipment')),
  make TEXT,
  model TEXT,
  serial_number TEXT,
  firmware_version TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  cost DECIMAL(10,2),
  location_id UUID REFERENCES public.locations(id),
  rack_id UUID, -- Will reference racks table
  rack_position INTEGER,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'In Use', 'Maintenance', 'Retired')),
  assigned_to UUID REFERENCES public.employees(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Racks table
CREATE TABLE public.racks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  rack_name TEXT NOT NULL,
  rack_units INTEGER DEFAULT 42,
  x_coordinate DECIMAL(5,2),
  y_coordinate DECIMAL(5,2),
  room TEXT,
  floor INTEGER,
  power_available INTEGER, -- Watts
  cooling_required BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Work Orders/Tasks table
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id),
  title TEXT NOT NULL,
  description TEXT,
  work_type TEXT DEFAULT 'Installation' CHECK (work_type IN ('Installation', 'Maintenance', 'Repair', 'Testing', 'Documentation')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Emergency')),
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled')),
  assigned_to UUID REFERENCES public.employees(id),
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Daily Logs table
CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  log_date DATE NOT NULL,
  hours_worked DECIMAL(4,2),
  work_description TEXT,
  weather_conditions TEXT,
  crew_members TEXT[],
  materials_used JSONB,
  photos TEXT[], -- URLs to photos
  issues_encountered TEXT,
  safety_incidents TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Safety Incidents table
CREATE TABLE public.safety_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id),
  location_id UUID REFERENCES public.locations(id),
  incident_type TEXT NOT NULL CHECK (incident_type IN ('Accident', 'Near Miss', 'Property Damage', 'Safety Violation')),
  severity TEXT DEFAULT 'Low' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  description TEXT NOT NULL,
  injured_person TEXT,
  witness_names TEXT[],
  corrective_actions TEXT,
  reported_by UUID REFERENCES public.employees(id) NOT NULL,
  incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
  investigation_required BOOLEAN DEFAULT false,
  investigation_notes TEXT,
  photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drop_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - can be refined later)
CREATE POLICY "Allow all operations" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.drop_points FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.racks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.daily_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.safety_incidents FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drop_points_updated_at BEFORE UPDATE ON public.drop_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_racks_updated_at BEFORE UPDATE ON public.racks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safety_incidents_updated_at BEFORE UPDATE ON public.safety_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_locations_project_id ON public.locations(project_id);
CREATE INDEX idx_drop_points_location_id ON public.drop_points(location_id);
CREATE INDEX idx_equipment_location_id ON public.equipment(location_id);
CREATE INDEX idx_racks_location_id ON public.racks(location_id);
CREATE INDEX idx_work_orders_project_id ON public.work_orders(project_id);
CREATE INDEX idx_work_orders_assigned_to ON public.work_orders(assigned_to);
CREATE INDEX idx_daily_logs_project_id ON public.daily_logs(project_id);
CREATE INDEX idx_daily_logs_employee_id ON public.daily_logs(employee_id);
CREATE INDEX idx_safety_incidents_project_id ON public.safety_incidents(project_id);