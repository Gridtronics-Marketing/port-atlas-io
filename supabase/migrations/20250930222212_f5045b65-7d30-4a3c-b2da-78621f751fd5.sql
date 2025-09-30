-- Add cable_count column to drop_points table
ALTER TABLE public.drop_points 
ADD COLUMN IF NOT EXISTS cable_count INTEGER DEFAULT 1;

-- Create test_results_files table for storing test result PDFs
CREATE TABLE IF NOT EXISTS public.test_results_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_point_id UUID NOT NULL REFERENCES public.drop_points(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.employees(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  test_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on test_results_files
ALTER TABLE public.test_results_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for test_results_files
CREATE POLICY "Staff can view test results files"
  ON public.test_results_files
  FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create test results files"
  ON public.test_results_files
  FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update test results files"
  ON public.test_results_files
  FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can delete test results files"
  ON public.test_results_files
  FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

-- Add trigger for updated_at
CREATE TRIGGER update_test_results_files_updated_at
  BEFORE UPDATE ON public.test_results_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_test_results_files_drop_point_id 
  ON public.test_results_files(drop_point_id);