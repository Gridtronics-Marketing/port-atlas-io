-- Fix infinite recursion: location_access_grants policies reference locations, which references location_access_grants

-- First, add location_organization_id column to grants table for direct org check (avoiding join to locations)
ALTER TABLE location_access_grants ADD COLUMN IF NOT EXISTS location_organization_id UUID REFERENCES organizations(id);

-- Update existing grants with the location's organization_id
UPDATE location_access_grants lag
SET location_organization_id = l.organization_id
FROM locations l
WHERE lag.location_id = l.id AND lag.location_organization_id IS NULL;

-- Drop the problematic policies on location_access_grants
DROP POLICY IF EXISTS "View location access grants" ON location_access_grants;
DROP POLICY IF EXISTS "Create location access grants" ON location_access_grants;
DROP POLICY IF EXISTS "Update location access grants" ON location_access_grants;
DROP POLICY IF EXISTS "Delete location access grants" ON location_access_grants;

-- Recreate policies using direct organization_id check (no reference to locations table)
CREATE POLICY "View location access grants" ON location_access_grants
  FOR SELECT USING (
    is_super_admin(auth.uid()) 
    OR location_organization_id IN (SELECT get_user_organizations(auth.uid()))
    OR granted_organization_id IN (SELECT get_user_organizations(auth.uid()))
  );

CREATE POLICY "Create location access grants" ON location_access_grants
  FOR INSERT WITH CHECK (
    is_super_admin(auth.uid()) 
    OR location_organization_id IN (SELECT get_user_organizations(auth.uid()))
  );

CREATE POLICY "Update location access grants" ON location_access_grants
  FOR UPDATE USING (
    is_super_admin(auth.uid()) 
    OR location_organization_id IN (SELECT get_user_organizations(auth.uid()))
  );

CREATE POLICY "Delete location access grants" ON location_access_grants
  FOR DELETE USING (
    is_super_admin(auth.uid()) 
    OR location_organization_id IN (SELECT get_user_organizations(auth.uid()))
  );

-- Create trigger to auto-populate location_organization_id on insert
CREATE OR REPLACE FUNCTION set_location_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT organization_id INTO NEW.location_organization_id
  FROM locations WHERE id = NEW.location_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_location_org_id_trigger ON location_access_grants;
CREATE TRIGGER set_location_org_id_trigger
  BEFORE INSERT ON location_access_grants
  FOR EACH ROW
  EXECUTE FUNCTION set_location_organization_id();