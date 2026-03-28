
-- Client billing settings
CREATE TABLE public.client_billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  logo_url TEXT,
  default_payment_terms INTEGER DEFAULT 30,
  default_tax_rate NUMERIC(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  invoice_prefix TEXT DEFAULT 'INV',
  quote_prefix TEXT DEFAULT 'QTE',
  invoice_notes TEXT,
  quote_notes TEXT,
  quickbooks_customer_id TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.client_billing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage billing settings" ON public.client_billing_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Client invoices
CREATE TABLE public.client_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  quickbooks_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage invoices" ON public.client_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Client quotes
CREATE TABLE public.client_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  issue_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.client_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage quotes" ON public.client_quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Billing line items (shared between invoices and quotes)
CREATE TABLE public.billing_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.client_invoices(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.client_quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT line_item_parent CHECK (
    (invoice_id IS NOT NULL AND quote_id IS NULL) OR
    (invoice_id IS NULL AND quote_id IS NOT NULL)
  )
);
ALTER TABLE public.billing_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage line items" ON public.billing_line_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Client expenses
CREATE TABLE public.client_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  expense_date DATE DEFAULT CURRENT_DATE,
  vendor TEXT,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.client_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage expenses" ON public.client_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Storage bucket for billing assets (logos, receipts)
INSERT INTO storage.buckets (id, name, public) VALUES ('billing-assets', 'billing-assets', true);
CREATE POLICY "Authenticated users can upload billing assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'billing-assets');
CREATE POLICY "Authenticated users can view billing assets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'billing-assets');
CREATE POLICY "Authenticated users can update billing assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'billing-assets');
CREATE POLICY "Public can view billing assets" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'billing-assets');
