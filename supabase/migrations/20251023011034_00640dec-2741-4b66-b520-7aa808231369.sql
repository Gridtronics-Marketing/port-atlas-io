-- Make drop_points.label column optional (nullable)
ALTER TABLE drop_points 
ALTER COLUMN label DROP NOT NULL;