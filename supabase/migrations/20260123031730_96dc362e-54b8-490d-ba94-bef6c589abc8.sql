-- Lead Captures - Interested Party Submissions
CREATE TABLE public.lead_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  industry TEXT,
  company_size TEXT,
  message TEXT,
  source TEXT DEFAULT 'website',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Onboarding Responses - Multi-Step Wizard Data
CREATE TABLE public.onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.lead_captures(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  response_data JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing Plans - Dynamic Pricing Tiers
CREATE TABLE public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  is_popular BOOLEAN DEFAULT false,
  is_enterprise BOOLEAN DEFAULT false,
  max_locations INTEGER,
  max_users INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing Features - Plan Feature Configuration
CREATE TABLE public.pricing_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.pricing_plans(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_value TEXT,
  is_included BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Testimonials - Customer Testimonials
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_title TEXT,
  company_name TEXT,
  quote TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- FAQ Items - FAQ Content
CREATE TABLE public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Lead Captures Policies
-- Public can insert (form submissions)
CREATE POLICY "Anyone can submit leads" ON public.lead_captures
  FOR INSERT WITH CHECK (true);

-- Super admins have full access
CREATE POLICY "Super admins can view all leads" ON public.lead_captures
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update leads" ON public.lead_captures
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete leads" ON public.lead_captures
  FOR DELETE USING (public.is_super_admin(auth.uid()));

-- Onboarding Responses Policies
-- Public can insert their own responses
CREATE POLICY "Anyone can submit onboarding responses" ON public.onboarding_responses
  FOR INSERT WITH CHECK (true);

-- Super admins have full access
CREATE POLICY "Super admins can view all onboarding responses" ON public.onboarding_responses
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update onboarding responses" ON public.onboarding_responses
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete onboarding responses" ON public.onboarding_responses
  FOR DELETE USING (public.is_super_admin(auth.uid()));

-- Pricing Plans Policies
-- Public can view active plans
CREATE POLICY "Anyone can view active pricing plans" ON public.pricing_plans
  FOR SELECT USING (is_active = true);

-- Super admins have full access
CREATE POLICY "Super admins can manage pricing plans" ON public.pricing_plans
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Pricing Features Policies
-- Public can view features of active plans
CREATE POLICY "Anyone can view pricing features" ON public.pricing_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pricing_plans 
      WHERE id = plan_id AND is_active = true
    )
  );

-- Super admins have full access
CREATE POLICY "Super admins can manage pricing features" ON public.pricing_features
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Testimonials Policies
-- Public can view active testimonials
CREATE POLICY "Anyone can view active testimonials" ON public.testimonials
  FOR SELECT USING (is_active = true);

-- Super admins have full access
CREATE POLICY "Super admins can manage testimonials" ON public.testimonials
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- FAQ Items Policies
-- Public can view active FAQ items
CREATE POLICY "Anyone can view active FAQ items" ON public.faq_items
  FOR SELECT USING (is_active = true);

-- Super admins have full access
CREATE POLICY "Super admins can manage FAQ items" ON public.faq_items
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Create updated_at triggers
CREATE TRIGGER update_lead_captures_updated_at
  BEFORE UPDATE ON public.lead_captures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pricing plans
INSERT INTO public.pricing_plans (name, slug, description, price_monthly, price_yearly, max_locations, max_users, sort_order, is_popular) VALUES
  ('Starter', 'starter', 'Perfect for small teams getting started', 49.00, 470.00, 1, 3, 1, false),
  ('Professional', 'professional', 'For growing businesses with multiple locations', 149.00, 1430.00, 10, 15, 2, true),
  ('Business', 'business', 'Advanced features for larger operations', 349.00, 3350.00, NULL, 50, 3, false),
  ('Enterprise', 'enterprise', 'Custom solutions for large organizations', NULL, NULL, NULL, NULL, 4, false);

-- Insert default features for each plan
INSERT INTO public.pricing_features (plan_id, feature_name, feature_value, is_included, sort_order)
SELECT p.id, f.feature_name, f.feature_value, f.is_included, f.sort_order
FROM public.pricing_plans p
CROSS JOIN (VALUES
  ('Floor Plan Management', 'true', true, 1),
  ('Drop Point Tracking', 'true', true, 2),
  ('Work Order Management', 'true', true, 3),
  ('Mobile App Access', 'true', true, 4),
  ('Email Support', 'true', true, 5)
) AS f(feature_name, feature_value, is_included, sort_order)
WHERE p.slug = 'starter';

INSERT INTO public.pricing_features (plan_id, feature_name, feature_value, is_included, sort_order)
SELECT p.id, f.feature_name, f.feature_value, f.is_included, f.sort_order
FROM public.pricing_plans p
CROSS JOIN (VALUES
  ('Floor Plan Management', 'true', true, 1),
  ('Drop Point Tracking', 'true', true, 2),
  ('Work Order Management', 'true', true, 3),
  ('Mobile App Access', 'true', true, 4),
  ('Priority Email Support', 'true', true, 5),
  ('Client Portal', 'true', true, 6),
  ('Scheduling & Calendar', 'true', true, 7),
  ('Reporting Dashboard', 'true', true, 8),
  ('API Access', 'true', true, 9)
) AS f(feature_name, feature_value, is_included, sort_order)
WHERE p.slug = 'professional';

INSERT INTO public.pricing_features (plan_id, feature_name, feature_value, is_included, sort_order)
SELECT p.id, f.feature_name, f.feature_value, f.is_included, f.sort_order
FROM public.pricing_plans p
CROSS JOIN (VALUES
  ('Everything in Professional', 'true', true, 1),
  ('Unlimited Locations', 'true', true, 2),
  ('Advanced Analytics', 'true', true, 3),
  ('Custom Integrations', 'true', true, 4),
  ('Phone Support', 'true', true, 5),
  ('Dedicated Account Manager', 'true', true, 6),
  ('Custom Workflows', 'true', true, 7),
  ('Audit Trail', 'true', true, 8)
) AS f(feature_name, feature_value, is_included, sort_order)
WHERE p.slug = 'business';

INSERT INTO public.pricing_features (plan_id, feature_name, feature_value, is_included, sort_order)
SELECT p.id, f.feature_name, f.feature_value, f.is_included, f.sort_order
FROM public.pricing_plans p
CROSS JOIN (VALUES
  ('Everything in Business', 'true', true, 1),
  ('White Label Options', 'true', true, 2),
  ('Custom Development', 'true', true, 3),
  ('SLA Guarantee', 'true', true, 4),
  ('24/7 Support', 'true', true, 5),
  ('On-site Training', 'true', true, 6),
  ('Custom Contracts', 'true', true, 7)
) AS f(feature_name, feature_value, is_included, sort_order)
WHERE p.slug = 'enterprise';

-- Insert sample testimonials
INSERT INTO public.testimonials (author_name, author_title, company_name, quote, rating, is_featured, sort_order) VALUES
  ('Mike Johnson', 'Operations Manager', 'Metro Cabling Solutions', 'Trade Atlas transformed how we manage our field operations. We''ve cut documentation time by 60% and our clients love the transparency.', 5, true, 1),
  ('Sarah Chen', 'Project Director', 'Pacific Network Services', 'The floor plan integration is a game-changer. Our technicians can see exactly what they need before arriving on site.', 5, true, 2),
  ('David Martinez', 'Owner', 'Martinez Electrical', 'Finally, a tool built for contractors by people who understand the trade. The client portal alone has helped us win more bids.', 5, false, 3);

-- Insert sample FAQ items
INSERT INTO public.faq_items (question, answer, category, sort_order) VALUES
  ('How does the free trial work?', 'You get 14 days of full access to all Professional plan features. No credit card required to start. At the end of your trial, choose the plan that fits your needs.', 'billing', 1),
  ('Can I change plans later?', 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle, and we''ll prorate any differences.', 'billing', 2),
  ('Is my data secure?', 'Yes. We use industry-standard encryption, secure cloud infrastructure, and regular security audits. Your data is backed up daily and you maintain full ownership.', 'security', 3),
  ('Do you offer training?', 'Yes! All plans include access to our knowledge base and video tutorials. Professional plans and above include live onboarding sessions, and Enterprise customers get dedicated training.', 'general', 4),
  ('Can I import my existing data?', 'We offer data migration services for all plans. Our team will help you transfer your existing locations, clients, and project data into Trade Atlas.', 'general', 5),
  ('What integrations do you support?', 'We integrate with popular tools like QuickBooks, Google Workspace, Microsoft 365, and more. API access is available on Professional plans and above for custom integrations.', 'features', 6);