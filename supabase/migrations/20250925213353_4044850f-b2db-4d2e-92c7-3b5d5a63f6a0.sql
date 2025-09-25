-- Insert default dropdown options for contracts and maintenance
INSERT INTO public.dropdown_options (category, option_key, option_value, display_name, sort_order, is_active) VALUES
-- Contract Types
('contract_type', 'maintenance', 'maintenance', 'Maintenance', 1, true),
('contract_type', 'installation', 'installation', 'Installation', 2, true),
('contract_type', 'support', 'support', 'Support', 3, true),
('contract_type', 'consulting', 'consulting', 'Consulting', 4, true),

-- Billing Frequencies
('billing_frequency', 'monthly', 'monthly', 'Monthly', 1, true),
('billing_frequency', 'quarterly', 'quarterly', 'Quarterly', 2, true),
('billing_frequency', 'annually', 'annually', 'Annually', 3, true),
('billing_frequency', 'one_time', 'one-time', 'One Time', 4, true),

-- Service Frequencies
('service_frequency', 'weekly', 'weekly', 'Weekly', 1, true),
('service_frequency', 'bi_weekly', 'bi-weekly', 'Bi-weekly', 2, true),
('service_frequency', 'monthly', 'monthly', 'Monthly', 3, true),
('service_frequency', 'quarterly', 'quarterly', 'Quarterly', 4, true),
('service_frequency', 'semi_annually', 'semi-annually', 'Semi-annually', 5, true),
('service_frequency', 'annually', 'annually', 'Annually', 6, true),

-- Maintenance Types
('maintenance_type', 'preventive', 'preventive', 'Preventive Maintenance', 1, true),
('maintenance_type', 'corrective', 'corrective', 'Corrective Maintenance', 2, true),
('maintenance_type', 'emergency', 'emergency', 'Emergency Maintenance', 3, true),
('maintenance_type', 'inspection', 'inspection', 'Inspection & Testing', 4, true),

-- Equipment Categories
('equipment_category', 'network_switches', 'network_switches', 'Network Switches', 1, true),
('equipment_category', 'patch_panels', 'patch_panels', 'Patch Panels', 2, true),
('equipment_category', 'servers', 'servers', 'Servers', 3, true),
('equipment_category', 'racks', 'racks', 'Racks & Cabinets', 4, true),
('equipment_category', 'ups', 'ups', 'UPS Systems', 5, true),
('equipment_category', 'cooling', 'cooling', 'Cooling Systems', 6, true);