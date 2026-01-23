-- Add unique constraint for upsert on onboarding_responses
ALTER TABLE public.onboarding_responses
ADD CONSTRAINT onboarding_responses_lead_step_unique UNIQUE (lead_id, step_number);