import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustomerNote {
  id: string;
  location_id: string;
  note_text: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'acknowledged' | 'resolved';
  created_by: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
  creator_email?: string;
}

interface AddCustomerNoteParams {
  location_id: string;
  note_text: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export const useCustomerNotes = (locationId?: string) => {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotes = async () => {
    if (!locationId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data || []) as CustomerNote[]);
    } catch (error: any) {
      console.error('Error fetching customer notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customer notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (params: AddCustomerNoteParams) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('customer_notes')
        .insert({
          location_id: params.location_id,
          note_text: params.note_text,
          priority: params.priority || 'normal',
          created_by: userData?.user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Note Added',
        description: 'Customer note has been added successfully.',
      });

      await fetchNotes();
    } catch (error: any) {
      console.error('Error adding customer note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add customer note',
        variant: 'destructive',
      });
    }
  };

  const updateNoteStatus = async (noteId: string, status: 'open' | 'acknowledged' | 'resolved') => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const updateData: any = { status };
      
      if (status === 'acknowledged' || status === 'resolved') {
        updateData.acknowledged_by = userData?.user?.id;
        updateData.acknowledged_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('customer_notes')
        .update(updateData)
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Note marked as ${status}.`,
      });

      await fetchNotes();
    } catch (error: any) {
      console.error('Error updating note status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note status',
        variant: 'destructive',
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('customer_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Note Deleted',
        description: 'Customer note has been deleted.',
      });

      await fetchNotes();
    } catch (error: any) {
      console.error('Error deleting customer note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer note',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [locationId]);

  return {
    notes,
    loading,
    addNote,
    updateNoteStatus,
    deleteNote,
    refetch: fetchNotes,
  };
};
