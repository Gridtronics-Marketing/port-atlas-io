-- Enable leaked password protection
UPDATE auth.config 
SET leaked_password_protection = true 
WHERE id = (SELECT id FROM auth.config LIMIT 1);