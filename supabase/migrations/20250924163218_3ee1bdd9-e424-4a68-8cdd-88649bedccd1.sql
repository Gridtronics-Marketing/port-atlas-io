-- Create room_view_photos table for multiple photos per room view
CREATE TABLE public.room_view_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_view_id uuid NOT NULL REFERENCES public.room_views(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  description text,
  employee_id uuid REFERENCES public.employees(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_view_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for room_view_photos
CREATE POLICY "Staff can view all room view photos" 
ON public.room_view_photos 
FOR SELECT 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Clients can view room view photos for their locations" 
ON public.room_view_photos 
FOR SELECT 
USING (room_view_id IN (
  SELECT rv.id 
  FROM public.room_views rv
  JOIN public.locations l ON rv.location_id = l.id
  JOIN public.projects p ON l.project_id = p.id
  JOIN public.clients c ON p.client_id = c.id
  WHERE c.contact_email = get_current_user_email()
));

CREATE POLICY "Staff and client technicians can create room view photos" 
ON public.room_view_photos 
FOR INSERT 
WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role, 'client_technician'::app_role]));

CREATE POLICY "Staff can update room view photos" 
ON public.room_view_photos 
FOR UPDATE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can delete room view photos" 
ON public.room_view_photos 
FOR DELETE 
USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_room_view_photos_updated_at
BEFORE UPDATE ON public.room_view_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();