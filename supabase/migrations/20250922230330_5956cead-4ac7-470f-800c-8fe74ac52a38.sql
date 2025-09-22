-- Fix infinite recursion in chat_participants policies
-- First, create a security definer function to get user's room IDs
CREATE OR REPLACE FUNCTION public.get_user_room_ids()
RETURNS uuid[] AS $$
  SELECT ARRAY_AGG(room_id)
  FROM public.chat_participants
  WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update rooms they participate in" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can delete rooms they participate in" ON public.chat_rooms;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view participants in their rooms" 
ON public.chat_participants 
FOR SELECT 
USING (room_id = ANY(get_user_room_ids()) OR has_role('admin'::app_role));

CREATE POLICY "Users can view rooms they participate in" 
ON public.chat_rooms 
FOR SELECT 
USING (id = ANY(get_user_room_ids()) OR has_role('admin'::app_role));

CREATE POLICY "Users can update rooms they participate in" 
ON public.chat_rooms 
FOR UPDATE 
USING (id = ANY(get_user_room_ids()) OR has_role('admin'::app_role));

CREATE POLICY "Users can delete rooms they participate in" 
ON public.chat_rooms 
FOR DELETE 
USING (id = ANY(get_user_room_ids()) OR has_role('admin'::app_role));