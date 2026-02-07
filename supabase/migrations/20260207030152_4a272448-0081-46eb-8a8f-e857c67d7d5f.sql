-- Drop the old status check constraint and add 'proposed' as a valid status
ALTER TABLE public.drop_points DROP CONSTRAINT drop_points_status_check;
ALTER TABLE public.drop_points ADD CONSTRAINT drop_points_status_check 
  CHECK (status = ANY (ARRAY['planned'::text, 'roughed_in'::text, 'finished'::text, 'tested'::text, 'proposed'::text]));