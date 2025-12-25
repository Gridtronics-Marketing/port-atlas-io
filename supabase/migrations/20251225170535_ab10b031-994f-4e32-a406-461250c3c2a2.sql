-- ============================================
-- PHASE 1: MULTI-TENANT DATABASE FOUNDATION
-- ============================================

-- 1.1 Create platform-level roles enum (super_admin is special)
CREATE TYPE public.platform_role AS ENUM ('super_admin', 'support');

-- 1.2 Create organization-level roles enum
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'project_manager', 'technician', 'viewer');

-- 1.3 Create organizations table (tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.4 Create organization membership table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.org_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 1.5 Create platform admins table (super admins like Jordan)
CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role public.platform_role NOT NULL DEFAULT 'support',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.6 Create super admin impersonation audit log
CREATE TABLE public.admin_impersonation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  impersonation_type TEXT NOT NULL CHECK (impersonation_type IN ('role', 'user')),
  target_role public.org_role,
  target_user_id UUID REFERENCES auth.users(id),
  target_organization_id UUID REFERENCES public.organizations(id),
  action TEXT NOT NULL CHECK (action IN ('start', 'end')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- 1.7 Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_impersonation_log ENABLE ROW LEVEL SECURITY;

-- 1.8 Create updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_admins_updated_at
  BEFORE UPDATE ON public.platform_admins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

-- 1.9 Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- 1.10 Check if user is any platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id
  )
$$;

-- 1.11 Get user's role in a specific organization
CREATE OR REPLACE FUNCTION public.get_user_org_role(_user_id UUID, _org_id UUID)
RETURNS public.org_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.organization_members
  WHERE user_id = _user_id AND organization_id = _org_id
$$;

-- 1.12 Get all organization IDs user belongs to
CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id UUID DEFAULT auth.uid())
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = _user_id
$$;

-- 1.13 Check if user has access to organization (member or super admin)
CREATE OR REPLACE FUNCTION public.has_org_access(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = _user_id AND organization_id = _org_id
    )
$$;

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Organizations: Super admins see all, members see their own orgs
CREATE POLICY "super_admins_all_access" ON public.organizations
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "members_view_own_org" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT public.get_user_organizations(auth.uid()))
  );

CREATE POLICY "owners_update_own_org" ON public.organizations
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR public.get_user_org_role(auth.uid(), id) = 'owner'
  );

-- Organization members: Super admins see all, org admins manage
CREATE POLICY "super_admins_all_members" ON public.organization_members
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "members_view_own_org_members" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );

CREATE POLICY "org_admins_manage_members" ON public.organization_members
  FOR ALL USING (
    public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
  );

-- Platform admins: Only super admins can see/manage
CREATE POLICY "super_admins_manage_platform_admins" ON public.platform_admins
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "self_view_platform_admin" ON public.platform_admins
  FOR SELECT USING (user_id = auth.uid());

-- Admin impersonation log: Only super admins can see
CREATE POLICY "super_admins_view_impersonation_log" ON public.admin_impersonation_log
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admins_insert_impersonation_log" ON public.admin_impersonation_log
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_organization_members_user ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_platform_admins_user ON public.platform_admins(user_id);
CREATE INDEX idx_admin_impersonation_log_admin ON public.admin_impersonation_log(admin_user_id);
CREATE INDEX idx_admin_impersonation_log_created ON public.admin_impersonation_log(created_at DESC);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);