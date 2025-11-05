-- Clean up existing drop point status options and insert the 4 new statuses
-- This migration simplifies the status system to: Planned, Roughed In, Finished, Tested

-- Step 1: Drop the existing check constraint on status
ALTER TABLE drop_points DROP CONSTRAINT IF EXISTS drop_points_status_check;

-- Step 2: Update any existing drop points with old statuses to map to the new system
UPDATE drop_points
SET status = CASE
  WHEN status IN ('active', 'terminated', 'installed') THEN 'finished'
  WHEN status = 'inactive' THEN 'planned'
  WHEN status IS NULL THEN 'planned'
  ELSE status
END;

-- Step 3: Add a new check constraint for the 4 allowed statuses
ALTER TABLE drop_points ADD CONSTRAINT drop_points_status_check 
  CHECK (status IN ('planned', 'roughed_in', 'finished', 'tested'));

-- Step 4: Delete all existing drop_point_status entries
DELETE FROM dropdown_options WHERE category = 'drop_point_status';

-- Step 5: Insert the 4 new status options with proper metadata and ordering
INSERT INTO dropdown_options (category, option_key, option_value, display_name, sort_order, metadata, is_active)
VALUES
  ('drop_point_status', 'planned', 'planned', 'Planned', 1, '{"color": "red"}'::jsonb, true),
  ('drop_point_status', 'roughed_in', 'roughed_in', 'Roughed In', 2, '{"color": "yellow"}'::jsonb, true),
  ('drop_point_status', 'finished', 'finished', 'Finished', 3, '{"color": "green"}'::jsonb, true),
  ('drop_point_status', 'tested', 'tested', 'Tested', 4, '{"color": "green", "showCheckmark": true}'::jsonb, true);