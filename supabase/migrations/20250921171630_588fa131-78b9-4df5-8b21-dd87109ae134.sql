-- Fix chat security: Restrict access to chat rooms and participants
-- Only show chat rooms where the user is a participant

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can view all chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view all participants" ON public.chat_participants;

-- Create secure policies for chat_rooms
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

-- Create secure policies for chat_participants  
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

-- Allow users to delete/leave rooms they participate in
CREATE POLICY "Users can delete chat rooms they participate in" 
ON public.chat_rooms 
FOR DELETE 
USING (
  id IN (
    SELECT room_id 
    FROM public.chat_participants 
    WHERE user_id = auth.uid()
  ) OR has_role('admin'::app_role)
);

-- Allow users to update rooms they participate in (e.g., room names)
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