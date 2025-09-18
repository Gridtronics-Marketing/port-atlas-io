-- Create test_results table for proper test result management
CREATE TABLE public.test_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_point_id uuid REFERENCES public.drop_points(id) ON DELETE CASCADE,
  test_type text NOT NULL,
  test_date timestamp with time zone NOT NULL DEFAULT now(),
  tested_by uuid REFERENCES public.employees(id),
  results jsonb,
  pass_fail text CHECK (pass_fail IN ('pass', 'fail', 'pending')) DEFAULT 'pending',
  test_values jsonb, -- Store specific test measurements
  equipment_used text,
  notes text,
  photos text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view test_results" 
ON public.test_results 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert test_results" 
ON public.test_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update test_results" 
ON public.test_results 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete test_results" 
ON public.test_results 
FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_test_results_updated_at
BEFORE UPDATE ON public.test_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();