-- Create platform_settings table for super admin settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage platform settings
CREATE POLICY "Super admins can view platform settings"
ON public.platform_settings
FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert platform settings"
ON public.platform_settings
FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update platform settings"
ON public.platform_settings
FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete platform settings"
ON public.platform_settings
FOR DELETE
USING (public.is_super_admin(auth.uid()));

-- Insert default email branding settings
INSERT INTO public.platform_settings (setting_key, setting_value)
VALUES (
  'email_branding',
  '{"logo_url": null, "company_name": "Trade Atlas", "primary_color": "#1e3a5f"}'::jsonb
) ON CONFLICT (setting_key) DO NOTHING;

-- Create email-assets storage bucket for logo images
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for email-assets bucket
CREATE POLICY "Email assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');

CREATE POLICY "Super admins can upload email assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'email-assets' AND public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update email assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'email-assets' AND public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete email assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'email-assets' AND public.is_super_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();