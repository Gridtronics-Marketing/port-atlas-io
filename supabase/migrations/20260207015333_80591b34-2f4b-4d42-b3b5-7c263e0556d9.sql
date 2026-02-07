-- Allow super admins to view all client portal users
CREATE POLICY "Super admins can view all client portal users"
ON client_portal_users FOR SELECT
USING (public.is_super_admin(auth.uid()));