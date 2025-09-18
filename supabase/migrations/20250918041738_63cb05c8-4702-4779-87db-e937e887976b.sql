-- Create communications tables
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('group', 'direct')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('scheduling', 'work_order', 'chat', 'system')),
  data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  sent_via_twilio BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.twilio_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_sid TEXT,
  auth_token TEXT,
  phone_number TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  push_notifications_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twilio_settings ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
CREATE POLICY "Users can view rooms they participate in" 
ON public.chat_rooms FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE room_id = chat_rooms.id AND user_id = auth.uid()
  ) OR 
  has_role('admin'::app_role)
);

CREATE POLICY "Admins can create chat rooms" 
ON public.chat_rooms FOR INSERT 
WITH CHECK (has_role('admin'::app_role));

-- Chat participants policies
CREATE POLICY "Users can view participants in their rooms" 
ON public.chat_participants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp 
    WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid()
  ) OR 
  has_role('admin'::app_role)
);

CREATE POLICY "Admins can manage participants" 
ON public.chat_participants FOR ALL 
USING (has_role('admin'::app_role));

-- Chat messages policies
CREATE POLICY "Users can view messages in their rooms" 
ON public.chat_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
  ) OR 
  has_role('admin'::app_role)
);

CREATE POLICY "Users can send messages to their rooms" 
ON public.chat_messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
  )
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Twilio settings policies (admin only)
CREATE POLICY "Admins can manage Twilio settings" 
ON public.twilio_settings FOR ALL 
USING (has_role('admin'::app_role));

-- Add update triggers
CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_twilio_settings_updated_at
BEFORE UPDATE ON public.twilio_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();