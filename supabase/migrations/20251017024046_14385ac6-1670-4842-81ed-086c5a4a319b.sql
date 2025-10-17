-- Backfill client_id for existing locations based on their project's client
UPDATE locations 
SET client_id = projects.client_id
FROM projects
WHERE locations.project_id = projects.id
  AND locations.client_id IS NULL
  AND projects.client_id IS NOT NULL;

-- Fix the daily_logs foreign key to allow SET NULL on location deletion
ALTER TABLE daily_logs 
DROP CONSTRAINT IF EXISTS daily_logs_location_id_fkey;

ALTER TABLE daily_logs
ADD CONSTRAINT daily_logs_location_id_fkey 
FOREIGN KEY (location_id) 
REFERENCES locations(id) 
ON DELETE SET NULL;