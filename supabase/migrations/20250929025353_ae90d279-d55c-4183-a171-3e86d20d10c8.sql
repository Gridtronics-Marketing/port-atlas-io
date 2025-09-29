-- Create dropdown options for drop point statuses
INSERT INTO public.dropdown_options (category, option_key, option_value, display_name, sort_order, is_active) VALUES
('drop_point_status', 'planned', 'planned', 'Planned', 10, true),
('drop_point_status', 'roughed', 'roughed', 'Roughed', 20, true),
('drop_point_status', 'terminated', 'terminated', 'Terminated', 30, true),
('drop_point_status', 'tested', 'tested', 'Tested', 40, true),
('drop_point_status', 'active', 'active', 'Active', 50, true),
('drop_point_status', 'inactive', 'inactive', 'Inactive', 60, true)
ON CONFLICT (category, option_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;