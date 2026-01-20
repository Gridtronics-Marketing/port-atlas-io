-- Part 1: Add 'employee' value to the app_role enum
-- Add user_id column to employees table to link with auth.users
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create unique index on user_id (allows null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id) WHERE user_id IS NOT NULL;