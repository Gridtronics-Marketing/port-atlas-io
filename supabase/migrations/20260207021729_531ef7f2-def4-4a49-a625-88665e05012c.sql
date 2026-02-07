
-- Add SELECT RLS policy on room_views for client portal users
-- They can view room views for locations they have access to
CREATE POLICY "Client portal users can view room views"
ON public.room_views
FOR SELECT
USING (
  public.has_location_access(location_id)
);
