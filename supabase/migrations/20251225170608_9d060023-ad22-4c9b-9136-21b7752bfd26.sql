-- ============================================
-- PHASE 2: ADD ORGANIZATION_ID TO CORE TABLES
-- ============================================

-- 2.1 Add organization_id columns (nullable initially for migration)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2.2 Create indexes for organization_id columns
CREATE INDEX IF NOT EXISTS idx_clients_organization ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_organization ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_organization ON public.locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_organization ON public.work_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_organization ON public.contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_organization ON public.inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_organization ON public.suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_organization ON public.equipment(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization ON public.purchase_orders(organization_id);