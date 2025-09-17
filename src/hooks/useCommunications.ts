import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  reply_to?: string;
  mentions?: string[]; // Array of user IDs
  reactions?: Record<string, string[]>; // emoji -> array of user IDs
  edited_at?: string;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  channel_type: 'project' | 'location' | 'work_order' | 'general' | 'direct';
  project_id?: string;
  location_id?: string;
  work_order_id?: string;
  participants: string[]; // Array of user IDs
  created_by: string;
  is_private: boolean;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'message' | 'work_order' | 'safety' | 'inventory' | 'system';
  related_id?: string; // ID of related entity (work order, message, etc.)
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface UserPresence {
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  current_activity?: string;
}

export function useCommunications() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChannels = async () => {
    try {
      // Create sample channels based on projects and locations
      const { data: projectsData } = await supabase.from('projects').select('*');
      const { data: locationsData } = await supabase.from('locations').select('*');
      const { data: workOrdersData } = await supabase.from('work_orders').select('*');

      const sampleChannels: Channel[] = [
        {
          id: 'general',
          name: 'General Discussion',
          description: 'General company-wide discussions',
          channel_type: 'general',
          participants: ['user1', 'user2', 'user3'],
          created_by: 'admin',
          is_private: false,
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'safety-alerts',
          name: 'Safety Alerts',
          description: 'Important safety notifications and alerts',
          channel_type: 'general',
          participants: ['user1', 'user2', 'user3'],
          created_by: 'admin',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Add project channels
      if (projectsData) {
        projectsData.forEach(project => {
          sampleChannels.push({
            id: `project-${project.id}`,
            name: `Project: ${project.name}`,
            description: `Discussion for ${project.name}`,
            channel_type: 'project',
            project_id: project.id,
            participants: ['user1', 'user2'],
            created_by: 'user1',
            is_private: false,
            created_at: project.created_at,
            updated_at: project.updated_at,
          });
        });
      }

      // Add location channels
      if (locationsData) {
        locationsData.slice(0, 3).forEach(location => {
          sampleChannels.push({
            id: `location-${location.id}`,
            name: `Site: ${location.name}`,
            description: `On-site communications for ${location.name}`,
            channel_type: 'location',
            location_id: location.id,
            participants: ['user1', 'user2'],
            created_by: 'user1',
            is_private: false,
            created_at: location.created_at,
            updated_at: location.updated_at,
          });
        });
      }

      // Add work order channels
      if (workOrdersData) {
        workOrdersData.slice(0, 2).forEach(workOrder => {
          sampleChannels.push({
            id: `work-order-${workOrder.id}`,
            name: `WO: ${workOrder.title}`,
            description: `Discussion for work order: ${workOrder.title}`,
            channel_type: 'work_order',
            work_order_id: workOrder.id,
            participants: ['user1', 'user2'],
            created_by: 'user1',
            is_private: false,
            created_at: workOrder.created_at,
            updated_at: workOrder.updated_at,
          });
        });
      }

      setChannels(sampleChannels);

      // Create sample messages for each channel
      const sampleMessages: Record<string, Message[]> = {};
      sampleChannels.forEach(channel => {
        sampleMessages[channel.id] = generateSampleMessages(channel.id);
      });
      setMessages(sampleMessages);

    } catch (error) {
      console.error('Error fetching channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch communication channels',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSampleMessages = (channelId: string): Message[] => {
    const baseMessages: Message[] = [
      {
        id: `msg-1-${channelId}`,
        channel_id: channelId,
        sender_id: 'user1',
        sender_name: 'John Smith',
        content: channelId === 'general' 
          ? 'Good morning team! Ready for another productive day.'
          : channelId === 'safety-alerts'
          ? '⚠️ Reminder: Hard hats required in all work areas today.'
          : channelId.includes('project')
          ? 'Project update: Fiber installation is 75% complete.'
          : channelId.includes('location')
          ? 'On-site update: Access to building B is available from 8 AM.'
          : 'Work order status update: Materials have arrived on site.',
        message_type: 'text',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `msg-2-${channelId}`,
        channel_id: channelId,
        sender_id: 'user2',
        sender_name: 'Sarah Johnson',
        content: channelId === 'general'
          ? 'Morning John! Looking forward to the team meeting at 10 AM.'
          : channelId === 'safety-alerts'
          ? 'Got it! Also, please remember to sign in at the safety station.'
          : channelId.includes('project')
          ? 'Great progress! I\'ll update the client on our status.'
          : channelId.includes('location')
          ? 'Perfect timing. We can start the cable runs in that section.'
          : 'Thanks for the update. I\'ll coordinate with the crew.',
        message_type: 'text',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `msg-3-${channelId}`,
        channel_id: channelId,
        sender_id: 'system',
        sender_name: 'System',
        content: channelId === 'general'
          ? 'Daily safety briefing scheduled for 9:00 AM in the main conference room.'
          : channelId === 'safety-alerts'
          ? 'New safety protocol uploaded to the document library.'
          : channelId.includes('project')
          ? 'Project milestone completed: Phase 2 installation finished.'
          : channelId.includes('location')
          ? 'Weather alert: Rain expected this afternoon. Plan accordingly.'
          : 'Work order #12345 has been marked as completed.',
        message_type: 'system',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ];

    return baseMessages;
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const sampleNotifications: Notification[] = [
        {
          id: 'notif-1',
          user_id: userId,
          title: 'New Work Order Assigned',
          message: 'You have been assigned work order #12347: Fiber Installation - Building C',
          type: 'info',
          category: 'work_order',
          related_id: 'work-order-12347',
          action_url: '/work-orders',
          is_read: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 'notif-2',
          user_id: userId,
          title: 'Low Stock Alert',
          message: 'Cat6 Cable is running low (Current: 800ft, Minimum: 1000ft)',
          type: 'warning',
          category: 'inventory',
          action_url: '/inventory',
          is_read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'notif-3',
          user_id: userId,
          title: 'Safety Checklist Completed',
          message: 'Pre-job safety checklist completed for Project Alpha',
          type: 'success',
          category: 'safety',
          is_read: true,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setNotifications(sampleNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const sendMessage = async (channelId: string, content: string, senderId: string, senderName: string) => {
    try {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        channel_id: channelId,
        sender_id: senderId,
        sender_name: senderName,
        content,
        message_type: 'text',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), newMessage],
      }));

      // Update channel's last message time
      setChannels(prev =>
        prev.map(channel =>
          channel.id === channelId
            ? { ...channel, last_message_at: newMessage.created_at }
            : channel
        )
      );

      // Set up real-time subscription for the channel
      const channel = supabase.channel(`messages-${channelId}`);
      channel.subscribe();

      toast({
        title: 'Message Sent',
        description: 'Your message has been sent successfully',
      });

      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const createChannel = async (channelData: Omit<Channel, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newChannel: Channel = {
        id: crypto.randomUUID(),
        ...channelData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setChannels(prev => [newChannel, ...prev]);
      setMessages(prev => ({ ...prev, [newChannel.id]: [] }));

      toast({
        title: 'Channel Created',
        description: `Channel "${newChannel.name}" has been created`,
      });

      return newChannel;
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to create channel',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const sendNotification = async (notificationData: Omit<Notification, 'id' | 'created_at'>) => {
    try {
      const notification: Notification = {
        id: crypto.randomUUID(),
        ...notificationData,
        created_at: new Date().toISOString(),
      };

      setNotifications(prev => [notification, ...prev]);

      // In a real implementation, you'd send push notifications here
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      });

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  const updateUserPresence = async (userId: string, status: UserPresence['status'], activity?: string) => {
    try {
      const presence: UserPresence = {
        user_id: userId,
        status,
        last_seen: new Date().toISOString(),
        current_activity: activity,
      };

      setUserPresence(prev => ({
        ...prev,
        [userId]: presence,
      }));

      // Set up real-time presence tracking
      const presenceChannel = supabase.channel('user-presence');
      presenceChannel.on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        console.log('Presence sync:', presenceState);
      });

      presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track(presence);
        }
      });

    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter(notif => !notif.is_read).length;
  };

  const getChannelMessages = (channelId: string) => {
    return messages[channelId] || [];
  };

  useEffect(() => {
    fetchChannels();
    // Fetch notifications for current user (placeholder)
    fetchNotifications('current-user-id');
  }, []);

  return {
    channels,
    messages,
    notifications,
    userPresence,
    loading,
    sendMessage,
    markNotificationAsRead,
    createChannel,
    sendNotification,
    updateUserPresence,
    getUnreadNotificationCount,
    getChannelMessages,
    refetch: fetchChannels,
  };
}