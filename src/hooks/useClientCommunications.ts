import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientCommunication {
  id: string;
  client_id: string;
  type: string;
  direction: string;
  to_email: string | null;
  cc_emails: string[] | null;
  subject: string | null;
  body: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

export const useClientCommunications = (clientId: string | undefined) => {
  const [communications, setCommunications] = useState<ClientCommunication[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCommunications = useCallback(async (limit = 5) => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_communications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      setCommunications((data || []) as ClientCommunication[]);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const addNote = async (noteText: string) => {
    if (!clientId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('client_communications').insert({
        client_id: clientId,
        type: 'note',
        direction: 'outgoing',
        body: noteText,
        status: 'logged',
        created_by: user?.id || null,
      });
      if (error) throw error;
      toast({ title: 'Note logged' });
      fetchCommunications();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({ title: 'Error', description: 'Failed to log note', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, [fetchCommunications]);

  // Real-time subscription
  useEffect(() => {
    if (!clientId) return;
    const channel = supabase
      .channel(`client-comms-${clientId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'client_communications',
        filter: `client_id=eq.${clientId}`,
      }, () => {
        fetchCommunications();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId, fetchCommunications]);

  return { communications, loading, fetchCommunications, addNote };
};
