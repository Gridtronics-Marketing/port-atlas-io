-- Drop the problematic policies
DROP POLICY "Users can view rooms they participate in" ON public.chat_rooms;
DROP POLICY "Users can view participants in their rooms" ON public.chat_participants;
DROP POLICY "Admins can manage participants" ON public.chat_participants;

-- Create new non-recursive policies
CREATE POLICY "Users can view all chat rooms" 
ON public.chat_rooms FOR SELECT 
USING (true);

CREATE POLICY "Users can view all participants" 
ON public.chat_participants FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own participation" 
ON public.chat_participants FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all participants" 
ON public.chat_participants FOR ALL 
USING (has_role('admin'::app_role));