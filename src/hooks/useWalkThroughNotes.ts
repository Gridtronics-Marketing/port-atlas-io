import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WalkThroughNote {
  id: string;
  location_id: string;
  floor: number;
  note_text: string | null;
  voice_recording_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useWalkThroughNotes = (locationId?: string, floor?: number) => {
  const [notes, setNotes] = useState<WalkThroughNote[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchNotes = async () => {
    if (!locationId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('walk_through_notes')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      // Only filter by floor if specified
      if (floor !== undefined) {
        query = query.eq('floor', floor);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching walk-through notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load walk-through notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (noteData: {
    location_id: string;
    floor: number;
    note_text: string;
    voice_recording_url?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('walk_through_notes')
        .insert([{
          ...noteData,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Walk-through note added',
      });

      fetchNotes();
      return data;
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateNote = async (id: string, updates: Partial<WalkThroughNote>) => {
    try {
      const { error } = await supabase
        .from('walk_through_notes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note updated',
      });

      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('walk_through_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note deleted',
      });

      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [locationId, floor]);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
};