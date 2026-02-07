
DROP POLICY IF EXISTS "Clients can view room view photos for their locations" ON public.room_view_photos;

CREATE POLICY "Client portal users can view room view photos"
ON public.room_view_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_views rv
    WHERE rv.id = room_view_photos.room_view_id
    AND has_location_access(rv.location_id)
  )
);
