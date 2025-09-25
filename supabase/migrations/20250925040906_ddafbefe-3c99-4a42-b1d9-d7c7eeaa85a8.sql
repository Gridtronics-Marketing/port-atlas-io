-- Add default system configurations for Phase 4 Enhanced Settings Management

-- Riser Diagram Settings
INSERT INTO public.system_configurations (category, key, value, data_type, description, is_active) VALUES
('riser_diagram', 'refresh_interval_seconds', '30', 'integer', 'Auto-refresh interval for riser diagrams in seconds', true),
('riser_diagram', 'show_capacity_indicators', 'true', 'boolean', 'Display capacity utilization indicators on diagrams', true),
('riser_diagram', 'default_labeling_standard', 'TIA-606', 'string', 'Default cable labeling standard (TIA-606, BICSI, Custom)', true),
('riser_diagram', 'enable_layer_filtering', 'true', 'boolean', 'Allow users to filter diagram layers by cable type', true),
('riser_diagram', 'show_equipment_status', 'true', 'boolean', 'Display real-time equipment status indicators', true),
('riser_diagram', 'auto_save_changes', 'true', 'boolean', 'Automatically save diagram changes', true);

-- Network Infrastructure Settings
INSERT INTO public.system_configurations (category, key, value, data_type, description, is_active) VALUES
('network_infrastructure', 'device_discovery_interval_minutes', '15', 'integer', 'Interval for automatic device discovery in minutes', true),
('network_infrastructure', 'enable_snmp_monitoring', 'true', 'boolean', 'Enable SNMP monitoring for network devices', true),
('network_infrastructure', 'poe_monitoring_enabled', 'true', 'boolean', 'Monitor Power over Ethernet status and usage', true),
('network_infrastructure', 'default_device_timeout_seconds', '10', 'integer', 'Default timeout for device communication attempts', true),
('network_infrastructure', 'enable_port_scanning', 'false', 'boolean', 'Enable automatic port scanning for device discovery', true),
('network_infrastructure', 'monitoring_threshold_cpu', '80', 'integer', 'CPU utilization threshold percentage for alerts', true),
('network_infrastructure', 'monitoring_threshold_memory', '85', 'integer', 'Memory utilization threshold percentage for alerts', true);

-- Capacity Management Settings
INSERT INTO public.system_configurations (category, key, value, data_type, description, is_active) VALUES
('capacity_management', 'warning_threshold_percentage', '75', 'integer', 'Capacity warning threshold percentage', true),
('capacity_management', 'critical_threshold_percentage', '90', 'integer', 'Capacity critical threshold percentage', true),
('capacity_management', 'enable_proactive_alerts', 'true', 'boolean', 'Send proactive capacity alerts before reaching thresholds', true),
('capacity_management', 'alert_frequency_hours', '24', 'integer', 'Frequency of capacity alert notifications in hours', true),
('capacity_management', 'track_port_utilization', 'true', 'boolean', 'Monitor individual port utilization', true),
('capacity_management', 'track_cable_utilization', 'true', 'boolean', 'Monitor cable strand/pair utilization', true),
('capacity_management', 'forecast_growth_months', '6', 'integer', 'Number of months to forecast capacity growth', true);

-- Compliance Standards Settings
INSERT INTO public.system_configurations (category, key, value, data_type, description, is_active) VALUES
('compliance_standards', 'default_standard', 'TIA-568', 'string', 'Default telecommunications standard (TIA-568, BICSI, ISO-11801)', true),
('compliance_standards', 'require_documentation_approval', 'true', 'boolean', 'Require approval for documentation changes', true),
('compliance_standards', 'enforce_labeling_standards', 'true', 'boolean', 'Enforce consistent labeling standards', true),
('compliance_standards', 'enable_audit_trail', 'true', 'boolean', 'Maintain detailed audit trail for compliance', true),
('compliance_standards', 'documentation_retention_years', '7', 'integer', 'Number of years to retain documentation', true),
('compliance_standards', 'require_testing_verification', 'true', 'boolean', 'Require testing verification for installations', true),
('compliance_standards', 'enable_iso_compliance', 'false', 'boolean', 'Enable ISO 11801 compliance features', true);

-- Work Order Integration Settings
INSERT INTO public.system_configurations (category, key, value, data_type, description, is_active) VALUES
('work_order_integration', 'enable_qr_codes', 'true', 'boolean', 'Enable QR code generation for components', true),
('work_order_integration', 'qr_code_size_pixels', '200', 'integer', 'QR code image size in pixels', true),
('work_order_integration', 'auto_link_mac_addresses', 'true', 'boolean', 'Automatically link MAC addresses to work orders', true),
('work_order_integration', 'enable_mobile_updates', 'true', 'boolean', 'Allow work order updates from mobile devices', true),
('work_order_integration', 'require_photo_verification', 'false', 'boolean', 'Require photo verification for work completion', true),
('work_order_integration', 'auto_generate_as_built', 'true', 'boolean', 'Automatically generate as-built documentation', true),
('work_order_integration', 'track_technician_location', 'false', 'boolean', 'Track technician location during work orders', true);