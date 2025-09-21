-- Fix chat security: Restrict access to chat rooms and participants
-- Only show chat rooms where the user is a participant

-- Drop ALL existing policies for both tables
DROP POLICY IF EXISTS "Users can view all chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view all participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can delete chat rooms they participate in" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update rooms they participate in" ON public.chat_rooms;

-- Create secure SELECT policies
CREATE POLICY "Users can view rooms they participate in" 
ON public.chat_rooms 
FOR SELECT 
USING (
  id IN (
    SELECT room_id 
    FROM public.chat_participants 
    WHERE user_id = auth.uid()
  ) OR has_role('admin'::app_role)
);

CREATE POLICY "Users can view participants in their rooms" 
ON public.chat_participants 
FOR SELECT 
USING (
  room_id IN (
    SELECT room_id 
    FROM public.chat_participants 
    WHERE user_id = auth.uid()
  ) OR has_role('admin'::app_role)
);

-- Create UPDATE and DELETE policies for chat rooms
CREATE POLICY "Users can update rooms they participate in" 
ON public.chat_rooms 
FOR UPDATE 
USING (
  id IN (
    SELECT room_id 
    FROM public.chat_participants 
    WHERE user_id = auth.uid()
  ) OR has_role('admin'::app_role)
);

CREATE POLICY "Users can delete rooms they participate in" 
ON public.chat_rooms 
FOR DELETE 
USING (
  id IN (
    SELECT room_id 
    FROM public.chat_participants 
    WHERE user_id = auth.uid()
  ) OR has_role('admin'::app_role)
);