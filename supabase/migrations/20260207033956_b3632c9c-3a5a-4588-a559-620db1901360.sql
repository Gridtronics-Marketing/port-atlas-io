CREATE POLICY "Client portal users can view drop point photos"
ON public.drop_point_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.drop_points dp
    WHERE dp.id = drop_point_photos.drop_point_id
    AND has_location_access(dp.location_id)
  )
);