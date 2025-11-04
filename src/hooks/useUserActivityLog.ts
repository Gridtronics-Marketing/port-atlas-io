import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserActivity {
  id: string;
  user_id: string;
  actor_id: string | null;
  activity_type: string;
  activity_description: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor_email?: string;
  user_email?: string;
}

export const useUserActivityLog = (userId?: string) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('user_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch actor and user emails from profiles
      if (data && data.length > 0) {
        const actorIds = [...new Set(data.map(a => a.actor_id).filter(Boolean))];
        const userIds = [...new Set(data.map(a => a.user_id))];
        const allIds = [...new Set([...actorIds, ...userIds])];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', allIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

        const enrichedData = data.map(activity => ({
          ...activity,
          metadata: (activity.metadata as any) || {},
          actor_email: activity.actor_id ? profileMap.get(activity.actor_id) : null,
          user_email: profileMap.get(activity.user_id),
        })) as UserActivity[];

        setActivities(enrichedData);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activity log:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activity log",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (
    userId: string,
    activityType: string,
    description: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          actor_id: (await supabase.auth.getUser()).data.user?.id,
          activity_type: activityType,
          activity_description: description,
          metadata: metadata || {},
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('user_activity_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activity_log',
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    activities,
    loading,
    fetchActivities,
    logActivity,
  };
};
