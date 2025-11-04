-- Create user activity log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type text NOT NULL,
  activity_description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity log
CREATE POLICY "Users can view their own activity"
  ON public.user_activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON public.user_activity_log
  FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "System can insert activity logs"
  ON public.user_activity_log
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_actor_id ON public.user_activity_log(actor_id);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_log_activity_type ON public.user_activity_log(activity_type);

-- Function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.user_activity_log (
      user_id,
      actor_id,
      activity_type,
      activity_description,
      metadata
    ) VALUES (
      NEW.user_id,
      auth.uid(),
      'role_assigned',
      'Role "' || NEW.role || '" assigned to user',
      jsonb_build_object('role', NEW.role, 'role_id', NEW.id)
    );
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.user_activity_log (
      user_id,
      actor_id,
      activity_type,
      activity_description,
      metadata
    ) VALUES (
      OLD.user_id,
      auth.uid(),
      'role_removed',
      'Role "' || OLD.role || '" removed from user',
      jsonb_build_object('role', OLD.role, 'role_id', OLD.id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for automatic role change logging
DROP TRIGGER IF EXISTS on_user_role_change ON public.user_roles;
CREATE TRIGGER on_user_role_change
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();