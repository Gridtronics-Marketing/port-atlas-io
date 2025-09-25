-- Phase 2: Database Schema Extensions for Enhanced Riser Diagram

-- Network Devices Table
CREATE TABLE public.network_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('switch', 'router', 'server', 'access_point', 'voip_phone', 'camera', 'firewall', 'ups', 'patch_panel')),
  ip_address INET,
  mac_address TEXT,
  poe_status TEXT DEFAULT 'disabled' CHECK (poe_status IN ('enabled', 'disabled', 'auto')),
  port_count INTEGER DEFAULT 0,
  rack_id UUID REFERENCES public.racks(id) ON DELETE SET NULL,
  rack_position INTEGER,
  device_details JSONB DEFAULT '{}',
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  firmware_version TEXT,
  management_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'decommissioned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VLANs Management
CREATE TABLE public.vlans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  vlan_id INTEGER NOT NULL,
  vlan_name TEXT NOT NULL,
  description TEXT,
  subnet CIDR,
  security_zone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Port to VLAN assignments
CREATE TABLE public.port_vlan_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.network_devices(id) ON DELETE CASCADE,
  port_number INTEGER NOT NULL,
  vlan_id UUID REFERENCES public.vlans(id) ON DELETE CASCADE,
  assignment_type TEXT DEFAULT 'access' CHECK (assignment_type IN ('access', 'trunk', 'hybrid')),
  native_vlan BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change tracking for MACs (Move, Add, Change)
CREATE TABLE public.change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('move', 'add', 'change', 'remove')),
  component_type TEXT NOT NULL CHECK (component_type IN ('cable', 'device', 'port', 'frame', 'vlan', 'connection')),
  component_id UUID,
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  technician_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  change_description TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'))
);

-- Enhanced patch panel connections
CREATE TABLE public.patch_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_frame_id UUID REFERENCES public.distribution_frames(id) ON DELETE CASCADE,
  to_frame_id UUID REFERENCES public.distribution_frames(id) ON DELETE CASCADE,
  from_port INTEGER NOT NULL,
  to_port INTEGER NOT NULL,
  cable_type TEXT CHECK (cable_type IN ('fiber', 'copper', 'coax')),
  connection_status TEXT DEFAULT 'active' CHECK (connection_status IN ('active', 'inactive', 'testing', 'failed')),
  patch_cable_id TEXT,
  signal_strength NUMERIC,
  test_results JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capacity monitoring alerts
CREATE TABLE public.capacity_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL CHECK (component_type IN ('cable', 'rack', 'conduit', 'frame', 'device')),
  component_id UUID,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('approaching_capacity', 'over_capacity', 'utilization_warning', 'performance_degradation')),
  threshold_percentage INTEGER,
  current_utilization INTEGER,
  max_capacity INTEGER,
  alert_message TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Documentation files
CREATE TABLE public.documentation_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'dwg', 'cad', 'photo', 'doc', 'xls', 'txt')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  document_category TEXT CHECK (document_category IN ('as_built', 'compliance', 'manual', 'photo', 'specification', 'test_report', 'warranty')),
  standards_reference TEXT,
  description TEXT,
  tags TEXT[],
  version TEXT DEFAULT '1.0',
  created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device port details table for detailed port management
CREATE TABLE public.device_ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.network_devices(id) ON DELETE CASCADE,
  port_number INTEGER NOT NULL,
  port_name TEXT,
  port_type TEXT CHECK (port_type IN ('ethernet', 'fiber', 'serial', 'usb', 'power')),
  port_speed TEXT,
  port_status TEXT DEFAULT 'down' CHECK (port_status IN ('up', 'down', 'testing', 'dormant')),
  connected_device_id UUID REFERENCES public.network_devices(id) ON DELETE SET NULL,
  connected_port_number INTEGER,
  mac_address TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_network_devices_location_id ON public.network_devices(location_id);
CREATE INDEX idx_network_devices_device_type ON public.network_devices(device_type);
CREATE INDEX idx_vlans_location_id ON public.vlans(location_id);
CREATE INDEX idx_vlans_vlan_id ON public.vlans(vlan_id);
CREATE INDEX idx_port_vlan_assignments_device_id ON public.port_vlan_assignments(device_id);
CREATE INDEX idx_change_logs_location_id ON public.change_logs(location_id);
CREATE INDEX idx_change_logs_timestamp ON public.change_logs(timestamp);
CREATE INDEX idx_change_logs_component_type ON public.change_logs(component_type);
CREATE INDEX idx_patch_connections_from_frame_id ON public.patch_connections(from_frame_id);
CREATE INDEX idx_patch_connections_to_frame_id ON public.patch_connections(to_frame_id);
CREATE INDEX idx_capacity_alerts_location_id ON public.capacity_alerts(location_id);
CREATE INDEX idx_capacity_alerts_component_type ON public.capacity_alerts(component_type);
CREATE INDEX idx_capacity_alerts_is_resolved ON public.capacity_alerts(is_resolved);
CREATE INDEX idx_documentation_files_location_id ON public.documentation_files(location_id);
CREATE INDEX idx_device_ports_device_id ON public.device_ports(device_id);

-- Add unique constraints
ALTER TABLE public.vlans ADD CONSTRAINT unique_vlan_per_location UNIQUE (location_id, vlan_id);
ALTER TABLE public.port_vlan_assignments ADD CONSTRAINT unique_port_assignment UNIQUE (device_id, port_number, vlan_id);
ALTER TABLE public.patch_connections ADD CONSTRAINT unique_patch_connection UNIQUE (from_frame_id, from_port, to_frame_id, to_port);
ALTER TABLE public.device_ports ADD CONSTRAINT unique_device_port UNIQUE (device_id, port_number);

-- Add update triggers for updated_at timestamps
CREATE TRIGGER update_network_devices_updated_at
  BEFORE UPDATE ON public.network_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vlans_updated_at
  BEFORE UPDATE ON public.vlans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_port_vlan_assignments_updated_at
  BEFORE UPDATE ON public.port_vlan_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patch_connections_updated_at
  BEFORE UPDATE ON public.patch_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentation_files_updated_at
  BEFORE UPDATE ON public.documentation_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_device_ports_updated_at
  BEFORE UPDATE ON public.device_ports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for Network Devices
ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all network devices"
  ON public.network_devices FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create network devices"
  ON public.network_devices FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update network devices"
  ON public.network_devices FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete network devices"
  ON public.network_devices FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- RLS Policies for VLANs
ALTER TABLE public.vlans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all vlans"
  ON public.vlans FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create vlans"
  ON public.vlans FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update vlans"
  ON public.vlans FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete vlans"
  ON public.vlans FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- RLS Policies for Port VLAN Assignments
ALTER TABLE public.port_vlan_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all port vlan assignments"
  ON public.port_vlan_assignments FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create port vlan assignments"
  ON public.port_vlan_assignments FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update port vlan assignments"
  ON public.port_vlan_assignments FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete port vlan assignments"
  ON public.port_vlan_assignments FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- RLS Policies for Change Logs
ALTER TABLE public.change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view change logs"
  ON public.change_logs FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create change logs"
  ON public.change_logs FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update change logs"
  ON public.change_logs FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can delete change logs"
  ON public.change_logs FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- RLS Policies for Patch Connections
ALTER TABLE public.patch_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all patch connections"
  ON public.patch_connections FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create patch connections"
  ON public.patch_connections FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update patch connections"
  ON public.patch_connections FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete patch connections"
  ON public.patch_connections FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- RLS Policies for Capacity Alerts
ALTER TABLE public.capacity_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view capacity alerts"
  ON public.capacity_alerts FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create capacity alerts"
  ON public.capacity_alerts FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update capacity alerts"
  ON public.capacity_alerts FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can delete capacity alerts"
  ON public.capacity_alerts FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- RLS Policies for Documentation Files
ALTER TABLE public.documentation_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view documentation files"
  ON public.documentation_files FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create documentation files"
  ON public.documentation_files FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update documentation files"
  ON public.documentation_files FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete documentation files"
  ON public.documentation_files FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- RLS Policies for Device Ports
ALTER TABLE public.device_ports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view device ports"
  ON public.device_ports FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create device ports"
  ON public.device_ports FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update device ports"
  ON public.device_ports FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete device ports"
  ON public.device_ports FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));