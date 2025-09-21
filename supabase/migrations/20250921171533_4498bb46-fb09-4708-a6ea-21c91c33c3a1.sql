-- Remove sensitive credential fields from twilio_settings table
-- Keep only configuration flags and metadata
ALTER TABLE public.twilio_settings 
DROP COLUMN IF EXISTS account_sid,
DROP COLUMN IF EXISTS auth_token,
DROP COLUMN IF EXISTS phone_number;

-- Add a note field to indicate credentials are stored in secrets
ALTER TABLE public.twilio_settings 
ADD COLUMN credentials_configured boolean DEFAULT false,
ADD COLUMN last_test_status text DEFAULT 'untested',
ADD COLUMN last_test_date timestamp with time zone;