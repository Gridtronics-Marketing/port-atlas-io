
-- Add RLS policy allowing client portal users to insert proposed drop points
CREATE POLICY "Client portal users can insert proposed drop points"
ON public.drop_points FOR INSERT
WITH CHECK (
  status = 'Proposed'
  AND public.has_location_access(location_id)
);
