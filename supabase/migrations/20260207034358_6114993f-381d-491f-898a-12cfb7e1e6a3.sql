
-- Allow client portal users to view walk-through notes for their granted locations
CREATE POLICY "Client portal users can view walk through notes"
ON public.walk_through_notes FOR SELECT
USING (has_location_access(location_id));

-- Allow client portal users to view documentation files for their granted locations
CREATE POLICY "Client portal users can view documentation files"
ON public.documentation_files FOR SELECT
USING (has_location_access(location_id));

-- Allow client portal users to view customer notes for their granted locations
CREATE POLICY "Client portal users can view customer notes"
ON public.customer_notes FOR SELECT
USING (has_location_access(location_id));
