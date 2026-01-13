-- Add email notification preference columns to notification_preferences table
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS email_on_new_request BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_on_status_change BOOLEAN DEFAULT true;