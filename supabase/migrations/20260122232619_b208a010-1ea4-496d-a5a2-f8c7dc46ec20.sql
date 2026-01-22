
-- Delete organization members first (foreign key constraint)
DELETE FROM organization_members 
WHERE organization_id IN ('75e2b3d3-78c5-46f2-af8e-be71ef52a032', '49258f17-b4d4-45df-9e89-36f54d37e062');

-- Delete the orphaned client portal organizations
DELETE FROM organizations 
WHERE id IN ('75e2b3d3-78c5-46f2-af8e-be71ef52a032', '49258f17-b4d4-45df-9e89-36f54d37e062');

-- Clear linked_organization_id on clients since we no longer use it
UPDATE clients SET linked_organization_id = NULL WHERE linked_organization_id IS NOT NULL;
