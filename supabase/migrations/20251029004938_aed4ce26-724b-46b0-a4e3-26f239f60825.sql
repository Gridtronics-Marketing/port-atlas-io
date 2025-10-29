-- Add annotation columns to drop_point_photos table
ALTER TABLE drop_point_photos 
ADD COLUMN IF NOT EXISTS annotation_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS annotation_metadata JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_drop_point_photos_with_annotations 
ON drop_point_photos ((annotation_data IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_drop_point_photos_annotation_metadata 
ON drop_point_photos USING gin(annotation_metadata);

-- Add comments for documentation
COMMENT ON COLUMN drop_point_photos.annotation_data IS 'Fabric.js canvas JSON containing all drawing objects';
COMMENT ON COLUMN drop_point_photos.annotation_metadata IS 'Metadata about annotations: created_by, modified_at, tool_versions, etc.';