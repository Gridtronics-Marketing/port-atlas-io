
CREATE TABLE public.service_request_drop_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  drop_point_id UUID NOT NULL REFERENCES public.drop_points(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_request_id, drop_point_id)
);

ALTER TABLE public.service_request_drop_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view linked drop points"
  ON public.service_request_drop_points FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = service_request_id
      AND (
        sr.requesting_organization_id IN (SELECT public.get_user_organizations())
        OR sr.parent_organization_id IN (SELECT public.get_user_organizations())
        OR public.is_super_admin()
      )
    )
  );

CREATE POLICY "Users can insert linked drop points"
  ON public.service_request_drop_points FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = service_request_id
      AND sr.requested_by = auth.uid()
      AND sr.status = 'pending'
    )
  );

CREATE POLICY "Users can delete linked drop points on pending requests"
  ON public.service_request_drop_points FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = service_request_id
      AND sr.requested_by = auth.uid()
      AND sr.status = 'pending'
    )
  );
