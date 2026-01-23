-- Drop duplicate/old insert policies
DROP POLICY IF EXISTS "Anyone can create leads via public forms" ON public.lead_captures;
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.lead_captures;

-- Create a single clean insert policy for anonymous users
CREATE POLICY "Public can submit leads" 
ON public.lead_captures 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);