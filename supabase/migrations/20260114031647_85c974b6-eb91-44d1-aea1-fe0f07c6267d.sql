-- Allow anyone to look up organizations by slug (for portal entry pages)
-- This is intentional for client portals - users need to see the portal name before logging in
CREATE POLICY "public_view_by_slug" ON public.organizations
  FOR SELECT
  USING (true);