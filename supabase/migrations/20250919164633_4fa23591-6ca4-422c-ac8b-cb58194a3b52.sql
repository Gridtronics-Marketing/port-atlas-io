-- Create room_views table for storing camera views on floor plans
CREATE TABLE public.room_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  floor INTEGER NOT NULL DEFAULT 1,
  x_coordinate DECIMAL NOT NULL,
  y_coordinate DECIMAL NOT NULL,
  room_name TEXT,
  description TEXT,
  photo_url TEXT NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.room_views ENABLE ROW LEVEL SECURITY;

-- Create policies for room_views
CREATE POLICY "Users can view all room views" 
ON public.room_views 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create room views" 
ON public.room_views 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update room views" 
ON public.room_views 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete room views" 
ON public.room_views 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_room_views_updated_at
BEFORE UPDATE ON public.room_views
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_room_views_location_floor ON public.room_views(location_id, floor);