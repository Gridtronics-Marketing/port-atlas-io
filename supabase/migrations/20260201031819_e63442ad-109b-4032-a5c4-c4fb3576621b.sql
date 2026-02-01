-- Add missing slug column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_clients_slug ON public.clients(slug);