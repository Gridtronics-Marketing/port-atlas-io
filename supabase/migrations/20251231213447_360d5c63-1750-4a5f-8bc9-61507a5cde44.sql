-- Create "Calo & Sons Construction" organization (without status column)
INSERT INTO organizations (id, name, slug)
VALUES (
  gen_random_uuid(),
  'Calo & Sons Construction',
  'calo-sons-construction'
);

-- Fix NULL organization_id on existing locations (assign to ALJ Solutions)
UPDATE locations 
SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE organization_id IS NULL;