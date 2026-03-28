
CREATE TABLE public.client_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'email',
  direction TEXT DEFAULT 'outgoing',
  to_email TEXT,
  cc_emails TEXT[],
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'sent',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage client communications"
  ON public.client_communications FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS reply_to_email TEXT;
