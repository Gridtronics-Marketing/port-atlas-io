-- Create client_portal_users table for direct client-user relationships
CREATE TABLE IF NOT EXISTS client_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(client_id, user_id)
);

-- Enable RLS
ALTER TABLE client_portal_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_portal_users
CREATE POLICY "Users can view their own portal memberships"
ON client_portal_users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Org admins can manage client portal users"
ON client_portal_users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM clients c
    JOIN organization_members om ON om.organization_id = c.organization_id
    WHERE c.id = client_portal_users.client_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_portal_users_user_id ON client_portal_users(user_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_users_client_id ON client_portal_users(client_id);

-- Migrate existing client portal users to new table (with correct enum mapping)
INSERT INTO client_portal_users (client_id, user_id, role)
SELECT c.id, om.user_id, 
  CASE 
    WHEN om.role = 'owner' THEN 'admin'
    WHEN om.role = 'admin' THEN 'admin'
    WHEN om.role = 'project_manager' THEN 'member'
    WHEN om.role = 'technician' THEN 'member'
    ELSE 'viewer'
  END
FROM clients c
JOIN organization_members om ON om.organization_id = c.linked_organization_id
WHERE c.linked_organization_id IS NOT NULL
ON CONFLICT (client_id, user_id) DO NOTHING;