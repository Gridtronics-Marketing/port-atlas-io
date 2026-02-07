-- Drop the old policy that checks for capitalized 'Proposed'
DROP POLICY IF EXISTS "Client portal users can insert proposed drop points" ON public.drop_points;

-- Recreate with lowercase 'proposed' to match existing data conventions
CREATE POLICY "Client portal users can insert proposed drop points"
ON public.drop_points FOR INSERT
WITH CHECK (
  status = 'proposed'
  AND has_location_access(location_id)
);