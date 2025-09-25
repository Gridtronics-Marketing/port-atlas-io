-- Add missing dropdown options that were detected from form analysis
INSERT INTO public.dropdown_options (category, option_key, option_value, display_name, sort_order) VALUES
-- Work Order Types
('work_order_types', 'installation', 'Installation', 'Installation', 1),
('work_order_types', 'maintenance', 'Maintenance', 'Maintenance', 2),
('work_order_types', 'repair', 'Repair', 'Repair', 3),
('work_order_types', 'testing', 'Testing', 'Testing', 4),
('work_order_types', 'documentation', 'Documentation', 'Documentation', 5),

-- Client Statuses
('client_statuses', 'active', 'Active', 'Active', 1),
('client_statuses', 'pending', 'Pending', 'Pending', 2),
('client_statuses', 'inactive', 'Inactive', 'Inactive', 3),

-- Employee Departments (additional ones found in forms)
('employee_departments', 'installation', 'Installation', 'Installation', 1),
('employee_departments', 'maintenance', 'Maintenance', 'Maintenance', 2),
('employee_departments', 'engineering', 'Engineering', 'Engineering', 3),
('employee_departments', 'project_management', 'Project Management', 'Project Management', 4),
('employee_departments', 'quality_assurance', 'Quality Assurance', 'Quality Assurance', 5),

-- Employee Roles (additional ones found in forms)
('employee_roles', 'network_technician', 'Network Technician', 'Network Technician', 6),
('employee_roles', 'fiber_technician', 'Fiber Technician', 'Fiber Technician', 7),
('employee_roles', 'installation_technician', 'Installation Technician', 'Installation Technician', 8),
('employee_roles', 'site_supervisor', 'Site Supervisor', 'Site Supervisor', 9),
('employee_roles', 'network_engineer', 'Network Engineer', 'Network Engineer', 10),
('employee_roles', 'field_engineer', 'Field Engineer', 'Field Engineer', 11),

-- Employee Statuses (additional ones found in forms)
('employee_statuses', 'on_leave', 'On Leave', 'On Leave', 3),
('employee_statuses', 'terminated', 'Terminated', 'Terminated', 4),

-- Cable Types (found in backbone cable modal)
('cable_types', 'fiber', 'Fiber Optic', 'Fiber Optic', 7),
('cable_types', 'copper', 'Copper (UTP/STP)', 'Copper (UTP/STP)', 8),
('cable_types', 'coax', 'Coaxial', 'Coaxial', 9),

-- Jacket Ratings (found in backbone cable modal)
('jacket_ratings', 'plenum', 'Plenum (CMP)', 'Plenum (CMP)', 1),
('jacket_ratings', 'riser', 'Riser (CMR)', 'Riser (CMR)', 2),
('jacket_ratings', 'lszh', 'LSZH', 'LSZH', 3),

-- Cable Subtypes (found in drop point modal)
('cable_subtypes', 'cat5e', 'CAT5e', 'CAT5e', 1),
('cable_subtypes', 'cat6', 'CAT6', 'CAT6', 2),
('cable_subtypes', 'cat6a', 'CAT6A', 'CAT6A', 3),
('cable_subtypes', 'cat7', 'CAT7', 'CAT7', 4),
('cable_subtypes', 'fiber', 'Fiber Optic', 'Fiber Optic', 5),

-- Distribution Frame Types (found in distribution frame modal)
('distribution_frame_types', 'mdf', 'MDF', 'MDF (Main Distribution Frame)', 1),
('distribution_frame_types', 'idf', 'IDF', 'IDF (Intermediate Distribution Frame)', 2),

-- Junction Box Types (found in junction box modal) 
('junction_box_types', 'junction_box', 'Junction Box', 'Junction Box', 1),
('junction_box_types', 'splice', 'Splice', 'Splice', 2),
('junction_box_types', 'patch_panel', 'Patch Panel', 'Patch Panel', 3),

-- Location Statuses (found in location modal)
('location_statuses', 'active', 'Active', 'Active', 1),
('location_statuses', 'in_progress', 'In Progress', 'In Progress', 2),
('location_statuses', 'completed', 'Completed', 'Completed', 3),
('location_statuses', 'on_hold', 'On Hold', 'On Hold', 4)

ON CONFLICT (category, option_key) DO NOTHING;