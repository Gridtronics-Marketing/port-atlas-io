-- Add new app roles for multi-tenant system
ALTER TYPE app_role ADD VALUE 'client_technician';
ALTER TYPE app_role ADD VALUE 'client_admin';