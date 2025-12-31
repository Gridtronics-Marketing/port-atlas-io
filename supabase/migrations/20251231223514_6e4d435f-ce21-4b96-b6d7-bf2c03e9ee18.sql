-- Fix function search path for the new function
CREATE OR REPLACE FUNCTION set_location_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT organization_id INTO NEW.location_organization_id
  FROM public.locations WHERE id = NEW.location_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;