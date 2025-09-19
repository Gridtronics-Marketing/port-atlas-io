-- Make employee_id nullable in daily_logs table to allow admins without employee records to upload photos
ALTER TABLE public.daily_logs ALTER COLUMN employee_id DROP NOT NULL;