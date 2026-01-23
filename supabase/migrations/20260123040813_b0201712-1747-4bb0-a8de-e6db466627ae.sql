-- Create table for CMS-managed page content
CREATE TABLE public.page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL UNIQUE,
  page_title TEXT NOT NULL,
  meta_description TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  content JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for blog categories
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#D4AF37',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for blog posts
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Trade Atlas Team',
  author_avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  meta_description TEXT,
  tags TEXT[] DEFAULT '{}',
  read_time_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for career job listings
CREATE TABLE public.job_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Remote',
  employment_type TEXT NOT NULL DEFAULT 'Full-time' CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship')),
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  salary_range TEXT,
  is_active BOOLEAN DEFAULT true,
  application_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for help articles / FAQ sections
CREATE TABLE public.help_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (public read, admin write)
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- Public read policies for published content
CREATE POLICY "Public can read published page content"
  ON public.page_content FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can read blog categories"
  ON public.blog_categories FOR SELECT
  USING (true);

CREATE POLICY "Public can read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can read active job listings"
  ON public.job_listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read published help articles"
  ON public.help_articles FOR SELECT
  USING (is_published = true);

-- Super admin full access policies
CREATE POLICY "Super admins can manage page content"
  ON public.page_content FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage blog categories"
  ON public.blog_categories FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage job listings"
  ON public.job_listings FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage help articles"
  ON public.help_articles FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON public.job_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial page content for the new pages
INSERT INTO public.page_content (page_slug, page_title, meta_description, hero_title, hero_subtitle, is_published, content) VALUES
('careers', 'Careers | Trade Atlas', 'Join the Trade Atlas team. Explore career opportunities and help us transform how contractors work.', 'Join Our Team', 'Help us build the future of field operations technology.', true, '[]'),
('blog', 'Blog | Trade Atlas', 'Insights, tips, and news about field operations, contractor technology, and industry trends.', 'Trade Atlas Blog', 'Insights and updates from the Trade Atlas team.', true, '[]'),
('help', 'Help Center | Trade Atlas', 'Get help with Trade Atlas. Find answers to common questions and learn how to get the most out of the platform.', 'Help Center', 'Find answers and get support for Trade Atlas.', true, '[]'),
('api', 'API Documentation | Trade Atlas', 'Integrate with Trade Atlas using our REST API. Documentation for developers.', 'API Documentation', 'Build powerful integrations with Trade Atlas.', true, '[]'),
('privacy', 'Privacy Policy | Trade Atlas', 'Learn how Trade Atlas collects, uses, and protects your personal information.', 'Privacy Policy', 'Your privacy is important to us.', true, '[]'),
('terms', 'Terms of Service | Trade Atlas', 'Read the Trade Atlas Terms of Service governing your use of our platform.', 'Terms of Service', 'Please read these terms carefully before using Trade Atlas.', true, '[]'),
('security', 'Security | Trade Atlas', 'Learn about Trade Atlas security practices and how we protect your data.', 'Security', 'Enterprise-grade security for your field operations.', true, '[]');

-- Seed initial blog categories
INSERT INTO public.blog_categories (name, slug, description, color) VALUES
('Product Updates', 'product-updates', 'New features and improvements to Trade Atlas', '#D4AF37'),
('Industry Insights', 'industry-insights', 'Trends and news from the contractor industry', '#3B82F6'),
('Best Practices', 'best-practices', 'Tips and guides for field operations', '#10B981'),
('Company News', 'company-news', 'Updates from the Trade Atlas team', '#8B5CF6');

-- Seed initial help article categories
INSERT INTO public.help_articles (category, title, content, sort_order, is_published) VALUES
('Getting Started', 'How to create your first project', 'Learn how to set up your first project in Trade Atlas and start documenting your locations.', 1, true),
('Getting Started', 'Inviting team members', 'Add your team to Trade Atlas and assign roles for collaboration.', 2, true),
('Floor Plans', 'Uploading floor plans', 'Upload PDF or image floor plans and start placing drop points.', 1, true),
('Floor Plans', 'Using the floor plan editor', 'Learn the tools available in the floor plan editor.', 2, true),
('Account & Billing', 'Managing your subscription', 'View and update your Trade Atlas subscription plan.', 1, true),
('Account & Billing', 'Updating payment methods', 'Add or change your payment information.', 2, true);