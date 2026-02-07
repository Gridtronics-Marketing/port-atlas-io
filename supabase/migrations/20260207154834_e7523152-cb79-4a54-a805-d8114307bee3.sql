
-- 1. Create trade_type enum
CREATE TYPE public.trade_type AS ENUM (
  'low_voltage',
  'electrical',
  'plumbing',
  'hvac',
  'fire_life_safety',
  'access_control',
  'security_surveillance',
  'intrusion_alarm',
  'building_automation',
  'lighting_controls',
  'energy_management',
  'gas',
  'medical_gas',
  'water_treatment',
  'elevator',
  'escalator',
  'av_pro',
  'paging_notification',
  'parking_systems',
  'irrigation',
  'refrigeration',
  'commercial_kitchen',
  'industrial_safety'
);

-- 2. Create organization_trades table
CREATE TABLE public.organization_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trade public.trade_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, trade)
);

ALTER TABLE public.organization_trades ENABLE ROW LEVEL SECURITY;

-- RLS: Members can read their org's trades
CREATE POLICY "Members can view organization trades"
  ON public.organization_trades FOR SELECT
  USING (public.has_org_access(auth.uid(), organization_id));

-- RLS: Owners/admins can manage trades
CREATE POLICY "Admins can manage organization trades"
  ON public.organization_trades FOR ALL
  USING (
    public.get_user_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- 3. Add trade column to drop_points
ALTER TABLE public.drop_points
  ADD COLUMN trade public.trade_type DEFAULT 'low_voltage';

-- Set existing rows to low_voltage
UPDATE public.drop_points SET trade = 'low_voltage' WHERE trade IS NULL;
