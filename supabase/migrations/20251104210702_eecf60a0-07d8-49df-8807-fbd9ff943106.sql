-- Phase 2 & 3: Add new columns to drop_points table
ALTER TABLE drop_points ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE drop_points ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id);
ALTER TABLE drop_points ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE drop_points ADD COLUMN IF NOT EXISTS type_specific_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE drop_points ADD COLUMN IF NOT EXISTS locking_mechanism TEXT;
ALTER TABLE drop_points ADD COLUMN IF NOT EXISTS rex_devices TEXT[];
ALTER TABLE drop_points ADD COLUMN IF NOT EXISTS patch_panel_config JSONB DEFAULT '{}'::jsonb;

-- Phase 4: Create walk_through_notes table
CREATE TABLE IF NOT EXISTS walk_through_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  floor INTEGER NOT NULL,
  note_text TEXT,
  voice_recording_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on walk_through_notes
ALTER TABLE walk_through_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for walk_through_notes
CREATE POLICY "Users can view walk through notes for their locations"
  ON walk_through_notes FOR SELECT
  USING (
    has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role])
  );

CREATE POLICY "Users can create walk through notes"
  ON walk_through_notes FOR INSERT
  WITH CHECK (
    has_any_role(ARRAY['admin'::app_role, 'project_manager'::app_role, 'technician'::app_role])
  );

CREATE POLICY "Users can update their own walk through notes"
  ON walk_through_notes FOR UPDATE
  USING (
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own walk through notes"
  ON walk_through_notes FOR DELETE
  USING (
    created_by = auth.uid()
  );

-- Add trigger for updated_at
CREATE TRIGGER update_walk_through_notes_updated_at
  BEFORE UPDATE ON walk_through_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Phase 1: Update dropdown_options for new statuses (if not exists)
INSERT INTO dropdown_options (category, option_key, option_value, display_name)
VALUES 
  ('drop_point_status', 'planned', 'planned', 'Planned'),
  ('drop_point_status', 'roughed_in', 'roughed_in', 'Roughed In'),
  ('drop_point_status', 'finished', 'finished', 'Finished'),
  ('drop_point_status', 'tested', 'tested', 'Tested')
ON CONFLICT (category, option_key) DO NOTHING;

-- Add new drop point types
INSERT INTO dropdown_options (category, option_key, option_value, display_name)
VALUES 
  ('drop_point_type', 'data', 'data', 'Data'),
  ('drop_point_type', 'wifi', 'wifi', 'WiFi'),
  ('drop_point_type', 'camera', 'camera', 'Camera'),
  ('drop_point_type', 'mdf_idf', 'mdf_idf', 'MDF/IDF'),
  ('drop_point_type', 'access_control', 'access_control', 'Access Control'),
  ('drop_point_type', 'av', 'av', 'A/V'),
  ('drop_point_type', 'other', 'other', 'Other')
ON CONFLICT (category, option_key) DO NOTHING;

-- Add cable types
INSERT INTO dropdown_options (category, option_key, option_value, display_name)
VALUES 
  ('cable_type', 'cat6', 'cat6', 'Cat6'),
  ('cable_type', 'cat6a', 'cat6a', 'Cat6A'),
  ('cable_type', 'fiber_sm', 'fiber_sm', 'Fiber SM'),
  ('cable_type', 'fiber_om4', 'fiber_om4', 'Fiber OM4'),
  ('cable_type', 'other', 'other', 'Other')
ON CONFLICT (category, option_key) DO NOTHING;