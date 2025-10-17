-- Add client_id column to locations table for direct client-to-location relationship
ALTER TABLE public.locations 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_locations_client_id ON public.locations(client_id);

-- Add helpful comment
COMMENT ON COLUMN public.locations.client_id IS 'Direct reference to the client that owns this location. Independent of projects.';