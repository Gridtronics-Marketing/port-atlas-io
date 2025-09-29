-- Add foreign key constraint to link drop_point_photos to drop_points
ALTER TABLE public.drop_point_photos 
ADD CONSTRAINT fk_drop_point_photos_drop_point 
FOREIGN KEY (drop_point_id) REFERENCES public.drop_points(id) ON DELETE CASCADE;

-- Add foreign key constraint to link drop_point_photos to employees
ALTER TABLE public.drop_point_photos 
ADD CONSTRAINT fk_drop_point_photos_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;