-- Add field_photographer role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'field_photographer';

-- Grant usage on the type to authenticated users
GRANT USAGE ON TYPE app_role TO authenticated;