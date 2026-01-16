-- Create TradeTube folders table
CREATE TABLE public.tradetube_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.tradetube_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create TradeTube content table
CREATE TABLE public.tradetube_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.tradetube_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'audio', 'document', 'image', 'voice_note')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create TradeTube views tracking table
CREATE TABLE public.tradetube_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.tradetube_content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_tradetube_folders_org ON public.tradetube_folders(organization_id);
CREATE INDEX idx_tradetube_folders_parent ON public.tradetube_folders(parent_id);
CREATE INDEX idx_tradetube_content_org ON public.tradetube_content(organization_id);
CREATE INDEX idx_tradetube_content_folder ON public.tradetube_content(folder_id);
CREATE INDEX idx_tradetube_content_media_type ON public.tradetube_content(media_type);
CREATE INDEX idx_tradetube_content_tags ON public.tradetube_content USING GIN(tags);
CREATE INDEX idx_tradetube_views_content ON public.tradetube_views(content_id);

-- Enable RLS
ALTER TABLE public.tradetube_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradetube_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradetube_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tradetube_folders

-- Read: All org members can view folders
CREATE POLICY "Users can view folders in their organization"
ON public.tradetube_folders FOR SELECT
USING (
  public.is_super_admin(auth.uid()) OR
  organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

-- Insert: Admin, project_manager, owner can create folders
CREATE POLICY "Admins can create folders"
ON public.tradetube_folders FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid()) OR
  (
    organization_id IN (SELECT public.get_user_organizations(auth.uid())) AND
    (
      public.has_any_role(ARRAY['admin'::app_role, 'project_manager'::app_role]) OR
      public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin', 'project_manager')
    )
  )
);

-- Update: Admin, project_manager, owner can update folders
CREATE POLICY "Admins can update folders"
ON public.tradetube_folders FOR UPDATE
USING (
  public.is_super_admin(auth.uid()) OR
  (
    organization_id IN (SELECT public.get_user_organizations(auth.uid())) AND
    (
      public.has_any_role(ARRAY['admin'::app_role, 'project_manager'::app_role]) OR
      public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin', 'project_manager')
    )
  )
);

-- Delete: Only admin and owner can delete folders
CREATE POLICY "Admins can delete folders"
ON public.tradetube_folders FOR DELETE
USING (
  public.is_super_admin(auth.uid()) OR
  (
    organization_id IN (SELECT public.get_user_organizations(auth.uid())) AND
    (
      public.has_role('admin'::app_role) OR
      public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
    )
  )
);

-- RLS Policies for tradetube_content

-- Read: All org members can view content
CREATE POLICY "Users can view content in their organization"
ON public.tradetube_content FOR SELECT
USING (
  public.is_super_admin(auth.uid()) OR
  organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

-- Insert: Admin, project_manager can upload content
CREATE POLICY "Managers can create content"
ON public.tradetube_content FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid()) OR
  (
    organization_id IN (SELECT public.get_user_organizations(auth.uid())) AND
    (
      public.has_any_role(ARRAY['admin'::app_role, 'project_manager'::app_role]) OR
      public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin', 'project_manager')
    )
  )
);

-- Update: Creator or admin can update content
CREATE POLICY "Creators and admins can update content"
ON public.tradetube_content FOR UPDATE
USING (
  public.is_super_admin(auth.uid()) OR
  (
    organization_id IN (SELECT public.get_user_organizations(auth.uid())) AND
    (
      created_by = auth.uid() OR
      public.has_role('admin'::app_role) OR
      public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
    )
  )
);

-- Delete: Creator or admin can delete content
CREATE POLICY "Creators and admins can delete content"
ON public.tradetube_content FOR DELETE
USING (
  public.is_super_admin(auth.uid()) OR
  (
    organization_id IN (SELECT public.get_user_organizations(auth.uid())) AND
    (
      created_by = auth.uid() OR
      public.has_role('admin'::app_role) OR
      public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
    )
  )
);

-- RLS Policies for tradetube_views

-- Read: Users can see view stats for their org
CREATE POLICY "Users can view stats in their organization"
ON public.tradetube_views FOR SELECT
USING (
  public.is_super_admin(auth.uid()) OR
  organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

-- Insert: Any org member can record a view
CREATE POLICY "Users can record views"
ON public.tradetube_views FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid()) OR
  organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

-- Create storage bucket for TradeTube media
INSERT INTO storage.buckets (id, name, public)
VALUES ('tradetube-media', 'tradetube-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tradetube-media bucket

-- Read: Anyone can read (public bucket for streaming)
CREATE POLICY "Public read access for tradetube media"
ON storage.objects FOR SELECT
USING (bucket_id = 'tradetube-media');

-- Insert: Org members with upload permission can upload
CREATE POLICY "Managers can upload tradetube media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tradetube-media' AND
  (
    public.is_super_admin(auth.uid()) OR
    public.has_any_role(ARRAY['admin'::app_role, 'project_manager'::app_role])
  )
);

-- Update: Org members with upload permission can update
CREATE POLICY "Managers can update tradetube media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tradetube-media' AND
  (
    public.is_super_admin(auth.uid()) OR
    public.has_any_role(ARRAY['admin'::app_role, 'project_manager'::app_role])
  )
);

-- Delete: Admins can delete
CREATE POLICY "Admins can delete tradetube media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tradetube-media' AND
  (
    public.is_super_admin(auth.uid()) OR
    public.has_role('admin'::app_role)
  )
);

-- Create updated_at trigger for folders
CREATE TRIGGER update_tradetube_folders_updated_at
BEFORE UPDATE ON public.tradetube_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for content
CREATE TRIGGER update_tradetube_content_updated_at
BEFORE UPDATE ON public.tradetube_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();