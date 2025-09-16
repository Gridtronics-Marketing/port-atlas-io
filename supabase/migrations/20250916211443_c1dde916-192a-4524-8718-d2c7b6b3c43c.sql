-- Secure all remaining database tables with proper RLS policies
-- Drop existing overly permissive policies

-- EMPLOYEES TABLE
DROP POLICY IF EXISTS "Allow all operations" ON public.employees;

CREATE POLICY "Authenticated users can view employees" 
ON public.employees 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert employees" 
ON public.employees 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees" 
ON public.employees 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete employees" 
ON public.employees 
FOR DELETE 
TO authenticated 
USING (true);

-- LOCATIONS TABLE
DROP POLICY IF EXISTS "Allow all operations" ON public.locations;

CREATE POLICY "Authenticated users can view locations" 
ON public.locations 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert locations" 
ON public.locations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update locations" 
ON public.locations 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete locations" 
ON public.locations 
FOR DELETE 
TO authenticated 
USING (true);

-- PROJECTS TABLE
DROP POLICY IF EXISTS "Allow all operations" ON public.projects;

CREATE POLICY "Authenticated users can view projects" 
ON public.projects 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert projects" 
ON public.projects 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects" 
ON public.projects 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects" 
ON public.projects 
FOR DELETE 
TO authenticated 
USING (true);

-- DROP_POINTS TABLE
DROP POLICY IF EXISTS "Allow all operations" ON public.drop_points;

CREATE POLICY "Authenticated users can view drop_points" 
ON public.drop_points 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert drop_points" 
ON public.drop_points 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update drop_points" 
ON public.drop_points 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete drop_points" 
ON public.drop_points 
FOR DELETE 
TO authenticated 
USING (true);

-- EQUIPMENT TABLE
DROP POLICY IF EXISTS "Allow all operations" ON public.equipment;

CREATE POLICY "Authenticated users can view equipment" 
ON public.equipment 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert equipment" 
ON public.equipment 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update equipment" 
ON public.equipment 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete equipment" 
ON public.equipment 
FOR DELETE 
TO authenticated 
USING (true);

-- RACKS TABLE
DROP POLICY IF EXISTS "Allow all operations" ON public.racks;

CREATE POLICY "Authenticated users can view racks" 
ON public.racks 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert racks" 
ON public.racks 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update racks" 
ON public.racks 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete racks" 
ON public.racks 
FOR DELETE 
TO authenticated 
USING (true);

-- WORK_ORDERS TABLE
DROP POLICY IF EXISTS "Allow all operations" ON public.work_orders;

CREATE POLICY "Authenticated users can view work_orders" 
ON public.work_orders 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert work_orders" 
ON public.work_orders 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update work_orders" 
ON public.work_orders 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete work_orders" 
ON public.work_orders 
FOR DELETE 
TO authenticated 
USING (true);

-- DAILY_LOGS TABLE
DROP POLICY IF EXISTS "Allow all operations" ON public.daily_logs;

CREATE POLICY "Authenticated users can view daily_logs" 
ON public.daily_logs 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert daily_logs" 
ON public.daily_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily_logs" 
ON public.daily_logs 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete daily_logs" 
ON public.daily_logs 
FOR DELETE 
TO authenticated 
USING (true);

-- SAFETY_INCIDENTS TABLE
DROP POLICY IF EXISTS "Allow all operations" ON public.safety_incidents;

CREATE POLICY "Authenticated users can view safety_incidents" 
ON public.safety_incidents 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert safety_incidents" 
ON public.safety_incidents 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update safety_incidents" 
ON public.safety_incidents 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete safety_incidents" 
ON public.safety_incidents 
FOR DELETE 
TO authenticated 
USING (true);