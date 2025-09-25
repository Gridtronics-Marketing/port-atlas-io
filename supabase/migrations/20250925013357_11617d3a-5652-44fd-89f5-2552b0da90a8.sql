-- Add missing pathway types for riser pathways
INSERT INTO public.dropdown_options (category, option_key, option_value, display_name, sort_order) VALUES
-- Pathway Types (for riser pathways)
('pathway_types', 'riser_shaft', 'riser_shaft', 'Riser Shaft', 1),
('pathway_types', 'cable_tray', 'cable_tray', 'Cable Tray', 2),
('pathway_types', 'conduit', 'conduit', 'Conduit', 3),
('pathway_types', 'plenum', 'plenum', 'Plenum Space', 4),
('pathway_types', 'other', 'other', 'Other', 5)

ON CONFLICT (category, option_key) DO NOTHING;