import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | 'direct';
  created_by?: string;
  created_at: string;
  updated_at: string;
  participants?: ChatParticipant[];
}

interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
}

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'scheduling' | 'work_order' | 'chat' | 'system';
  data?: any;
  read_at?: string;
  sent_via_twilio: boolean;
  created_at: string;
}

export const useChatRooms = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<{ [roomId: string]: ChatMessage[] }>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChatRooms();
      fetchNotifications();
    }
  }, [user]);

  const fetchChatRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants!inner (
            id,
            user_id,
            joined_at
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChatRooms((data || []).map(room => ({
        ...room,
        type: room.type as 'group' | 'direct'
      })));
    } catch (error: any) {
      console.error('Error fetching chat rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load chat rooms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(prev => ({ 
        ...prev, 
        [roomId]: (data || []).map(msg => ({
          ...msg,
          message_type: msg.message_type as 'text' | 'image' | 'file'
        }))
      }));
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (roomId: string, message: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user?.id,
          message: message,
          message_type: 'text'
        });

      if (error) throw error;

      // Refresh messages
      await fetchMessages(roomId);
      
      toast({
        title: "Success",
        description: "Message sent",
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const createChatRoom = async (name: string, participantIds: string[]) => {
    try {
      console.log('Creating chat room:', { name, participantIds, currentUser: user?.id });
      
      // Create the chat room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          type: 'group',
          created_by: user?.id
        })
        .select()
        .maybeSingle();

      if (roomError) {
        console.error('Room creation error:', roomError);
        throw roomError;
      }

      if (!room) {
        throw new Error('Failed to create room - no data returned');
      }

      console.log('Room created:', room);

      // Only include the current user (auth user) for now
      // Skip employee IDs that don't correspond to auth users
      const validParticipants = [
        {
          room_id: room.id,
          user_id: user?.id
        }
      ];

      console.log('Adding participants:', validParticipants);

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(validParticipants);

      if (participantError) {
        console.error('Participant addition error:', participantError);
        throw participantError;
      }

      await fetchChatRooms();
      
      toast({
        title: "Success",
        description: "Chat room created successfully",
      });

      return room;
    } catch (error: any) {
      console.error('Error creating chat room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create chat room",
        variant: "destructive",
      });
      return null;
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []).map(notif => ({
        ...notif,
        type: notif.type as 'scheduling' | 'work_order' | 'chat' | 'system'
      })));
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      
      await fetchNotifications();
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  return {
    chatRooms,
    messages,
    notifications,
    isLoading,
    fetchMessages,
    sendMessage,
    createChatRoom,
    markNotificationAsRead,
    refreshRooms: fetchChatRooms,
    refreshNotifications: fetchNotifications
  };
};