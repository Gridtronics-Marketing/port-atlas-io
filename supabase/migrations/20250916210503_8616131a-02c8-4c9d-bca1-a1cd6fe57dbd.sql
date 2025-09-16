-- Fix security vulnerability: Replace overly permissive RLS policies on clients table
-- Drop existing policies that allow public access
DROP POLICY IF EXISTS "Allow all operations" ON public.clients;

-- Create secure RLS policies that require authentication
CREATE POLICY "Authenticated users can view clients" 
ON public.clients 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert clients" 
ON public.clients 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients" 
ON public.clients 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients" 
ON public.clients 
FOR DELETE 
TO authenticated 
USING (true);