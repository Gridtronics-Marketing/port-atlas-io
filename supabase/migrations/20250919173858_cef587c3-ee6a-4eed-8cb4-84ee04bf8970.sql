-- Make employee_id nullable in room_views table to allow admins without employee records to add room views
ALTER TABLE public.room_views ALTER COLUMN employee_id DROP NOT NULL;