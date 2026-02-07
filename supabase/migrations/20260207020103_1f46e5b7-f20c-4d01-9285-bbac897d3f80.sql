CREATE POLICY "Public can view clients by slug for portal entry"
ON public.clients FOR SELECT
USING (slug IS NOT NULL);