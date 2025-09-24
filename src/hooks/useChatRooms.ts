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
      
      // Check if user is admin for adding other participants
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);
      
      const isAdmin = userRoles?.some(ur => ur.role === 'admin');
      
      if (participantIds.length > 0 && !isAdmin) {
        throw new Error('Only admins can add other users to chat rooms. Create a personal room first.');
      }
      
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

      // Add creator first (this should always work due to RLS)
      const { error: creatorError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: room.id,
          user_id: user?.id
        });

      if (creatorError) {
        console.error('Creator addition error:', creatorError);
        throw creatorError;
      }

      // Add other participants only if admin and there are participants to add
      if (isAdmin && participantIds.length > 0) {
        const otherParticipants = participantIds.map(userId => ({
          room_id: room.id,
          user_id: userId
        }));

        console.log('Adding other participants:', otherParticipants);

        const { error: participantError } = await supabase
          .from('chat_participants')
          .insert(otherParticipants);

        if (participantError) {
          console.error('Other participants addition error:', participantError);
          // Don't fail the entire operation if adding others fails
          toast({
            title: "Warning",
            description: "Room created but some participants couldn't be added",
            variant: "destructive",
          });
        }
      }

      await fetchChatRooms();
      
      toast({
        title: "Success",
        description: "Chat room created successfully",
      });

      return room;
    } catch (error: any) {
      console.error('Error creating chat room:', error);
      let errorMessage = "Failed to create chat room";
      
      if (error.message?.includes('row-level security')) {
        errorMessage = "Permission denied. Only admins can create rooms with multiple participants.";
      } else if (error.message?.includes('foreign key')) {
        errorMessage = "Invalid participant selected. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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

  const deleteChatRoom = async (roomId: string) => {
    try {
      // Delete participants first
      const { error: participantError } = await supabase
        .from('chat_participants')
        .delete()
        .eq('room_id', roomId);

      if (participantError) throw participantError;

      // Delete messages
      const { error: messageError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('room_id', roomId);

      if (messageError) throw messageError;

      // Delete the room
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (roomError) throw roomError;

      await fetchChatRooms();
      
      toast({
        title: "Success",
        description: "Chat room deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting chat room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete chat room",
        variant: "destructive",
      });
    }
  };

  const updateChatRoomParticipants = async (roomId: string, participantIds: string[]) => {
    try {
      console.log('Updating chat room participants:', { roomId, participantIds, currentUser: user?.id });
      
      // Check if user is admin or room creator
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);
      
      const isAdmin = userRoles?.some(ur => ur.role === 'admin');
      
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('created_by')
        .eq('id', roomId)
        .maybeSingle();
      
      const isCreator = room?.created_by === user?.id;
      
      if (!isAdmin && !isCreator) {
        throw new Error('Only room creators and admins can manage participants');
      }

      // Get current participants
      const { data: currentParticipants } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('room_id', roomId);
      
      const currentUserIds = currentParticipants?.map(p => p.user_id) || [];
      const allParticipantIds = [...new Set([...participantIds, user?.id])].filter(Boolean);
      
      // Find participants to add and remove
      const toAdd = allParticipantIds.filter(id => !currentUserIds.includes(id));
      const toRemove = currentUserIds.filter(id => !allParticipantIds.includes(id));
      
      console.log('Participant changes:', { toAdd, toRemove, current: currentUserIds, target: allParticipantIds });
      
      // Remove participants (only if admin or removing self)
      if (toRemove.length > 0) {
        if (isAdmin) {
          const { error: deleteError } = await supabase
            .from('chat_participants')
            .delete()
            .eq('room_id', roomId)
            .in('user_id', toRemove);
          
          if (deleteError) throw deleteError;
        } else {
          // Non-admin can only remove themselves
          const selfRemoval = toRemove.filter(id => id === user?.id);
          if (selfRemoval.length > 0) {
            const { error: deleteError } = await supabase
              .from('chat_participants')
              .delete()
              .eq('room_id', roomId)
              .eq('user_id', user?.id);
            
            if (deleteError) throw deleteError;
          }
        }
      }
      
      // Add new participants (only if admin)
      if (toAdd.length > 0) {
        if (!isAdmin) {
          throw new Error('Only admins can add other users to chat rooms');
        }
        
        const newParticipants = toAdd.map(userId => ({
          room_id: roomId,
          user_id: userId
        }));
        
        const { error: insertError } = await supabase
          .from('chat_participants')
          .insert(newParticipants);
        
        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      }

      await fetchChatRooms();
      
      toast({
        title: "Success",
        description: "Chat room participants updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating chat room participants:', error);
      let errorMessage = "Failed to update participants";
      
      if (error.message?.includes('row-level security')) {
        errorMessage = "Permission denied. Only admins can manage chat room participants.";
      } else if (error.message?.includes('foreign key')) {
        errorMessage = "Invalid participant selected. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
    deleteChatRoom,
    updateChatRoomParticipants,
    markNotificationAsRead,
    refreshRooms: fetchChatRooms,
    refreshNotifications: fetchNotifications
  };
};