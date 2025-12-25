-- ============================================
-- PHASE 3: UPDATE RLS POLICIES WITH ORG ISOLATION + SUPER ADMIN BYPASS
-- ============================================

-- 3.1 CLIENTS TABLE
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to create clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON public.clients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.clients;

CREATE POLICY "org_isolation_clients" ON public.clients
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );

-- 3.2 EMPLOYEES TABLE
DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to create employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON public.employees;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.employees;
DROP POLICY IF EXISTS "HR and Admin can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view employee directory" ON public.employees;

CREATE POLICY "org_isolation_employees" ON public.employees
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );

-- 3.3 PROJECTS TABLE
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to read projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to create projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to update projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to delete projects" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.projects;

CREATE POLICY "org_isolation_projects" ON public.projects
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );

-- 3.4 LOCATIONS TABLE
DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_update_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_delete_policy" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated users to create locations" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated users to update locations" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated users to delete locations" ON public.locations;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.locations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.locations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.locations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.locations;

CREATE POLICY "org_isolation_locations" ON public.locations
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );

-- 3.5 WORK_ORDERS TABLE
DROP POLICY IF EXISTS "work_orders_select_policy" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_insert_policy" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_update_policy" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_delete_policy" ON public.work_orders;
DROP POLICY IF EXISTS "Allow authenticated users to read work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Allow authenticated users to create work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Allow authenticated users to update work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Allow authenticated users to delete work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.work_orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.work_orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.work_orders;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.work_orders;

CREATE POLICY "org_isolation_work_orders" ON public.work_orders
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );

-- 3.6 CONTRACTS TABLE
DROP POLICY IF EXISTS "contracts_select_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_insert_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_update_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_delete_policy" ON public.contracts;
DROP POLICY IF EXISTS "Allow authenticated users to read contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow authenticated users to create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow authenticated users to update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow authenticated users to delete contracts" ON public.contracts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.contracts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.contracts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.contracts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.contracts;

CREATE POLICY "org_isolation_contracts" ON public.contracts
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );

-- 3.7 INVENTORY_ITEMS TABLE
DROP POLICY IF EXISTS "inventory_items_select_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_update_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_delete_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow authenticated users to read inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.inventory_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.inventory_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.inventory_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.inventory_items;

CREATE POLICY "org_isolation_inventory" ON public.inventory_items
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );

-- 3.8 SUPPLIERS TABLE
DROP POLICY IF EXISTS "suppliers_select_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete_policy" ON public.suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.suppliers;

CREATE POLICY "org_isolation_suppliers" ON public.suppliers
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );

-- 3.9 EQUIPMENT TABLE
DROP POLICY IF EXISTS "equipment_select_policy" ON public.equipment;
DROP POLICY IF EXISTS "equipment_insert_policy" ON public.equipment;
DROP POLICY IF EXISTS "equipment_update_policy" ON public.equipment;
DROP POLICY IF EXISTS "equipment_delete_policy" ON public.equipment;
DROP POLICY IF EXISTS "Allow authenticated users to read equipment" ON public.equipment;
DROP POLICY IF EXISTS "Allow authenticated users to manage equipment" ON public.equipment;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.equipment;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.equipment;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.equipment;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.equipment;

CREATE POLICY "org_isolation_equipment" ON public.equipment
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );

-- 3.10 PURCHASE_ORDERS TABLE
DROP POLICY IF EXISTS "purchase_orders_select_policy" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_policy" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_policy" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete_policy" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated users to read purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated users to manage purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.purchase_orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.purchase_orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.purchase_orders;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.purchase_orders;

CREATE POLICY "org_isolation_purchase_orders" ON public.purchase_orders
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
  );