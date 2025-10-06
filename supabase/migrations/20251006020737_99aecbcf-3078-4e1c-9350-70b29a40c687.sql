-- Seed drop point status options for ConfigurableSelect
INSERT INTO dropdown_options (category, option_key, option_value, display_name, sort_order, is_active, metadata)
VALUES
  ('drop_point_status', 'planned', 'planned', 'Planned', 1, true, '{"icon": "clock", "color": "blue"}'::jsonb),
  ('drop_point_status', 'roughed', 'roughed', 'Roughed In', 2, true, '{"icon": "wrench", "color": "orange"}'::jsonb),
  ('drop_point_status', 'terminated', 'terminated', 'Terminated', 3, true, '{"icon": "check", "color": "green"}'::jsonb),
  ('drop_point_status', 'tested', 'tested', 'Tested', 4, true, '{"icon": "test-tube", "color": "purple"}'::jsonb),
  ('drop_point_status', 'active', 'active', 'Active', 5, true, '{"icon": "zap", "color": "green"}'::jsonb),
  ('drop_point_status', 'inactive', 'inactive', 'Inactive', 6, true, '{"icon": "x-circle", "color": "gray"}'::jsonb)
ON CONFLICT (category, option_key) DO UPDATE
SET 
  display_name = EXCLUDED.display_name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = now();