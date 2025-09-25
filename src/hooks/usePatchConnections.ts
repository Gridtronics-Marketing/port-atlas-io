import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PatchConnection {
  id: string;
  from_frame_id: string;
  to_frame_id: string;
  from_port: number;
  to_port: number;
  cable_type?: 'fiber' | 'copper' | 'coax';
  connection_status: 'active' | 'inactive' | 'testing' | 'failed';
  patch_cable_id?: string;
  signal_strength?: number;
  test_results: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  from_frame?: {
    frame_type: string;
    floor: number;
    room?: string;
  };
  to_frame?: {
    frame_type: string;
    floor: number;
    room?: string;
  };
}

export const usePatchConnections = (locationId?: string) => {
  const [connections, setConnections] = useState<PatchConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConnections = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('patch_connections')
        .select(`
          *,
          from_frame:distribution_frames!from_frame_id(frame_type, floor, room),
          to_frame:distribution_frames!to_frame_id(frame_type, floor, room)
        `);
      
      if (locationId) {
        // Filter by location through the distribution frames
        query = query
          .eq('from_frame.location_id', locationId)
          .eq('to_frame.location_id', locationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setConnections((data as PatchConnection[]) || []);
    } catch (error) {
      console.error('Error fetching patch connections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patch connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addConnection = async (connectionData: Omit<PatchConnection, 'id' | 'created_at' | 'updated_at' | 'from_frame' | 'to_frame'>) => {
    try {
      const { data, error } = await supabase
        .from('patch_connections')
        .insert([connectionData])
        .select()
        .single();
      
      if (error) throw error;
      await fetchConnections();
      
      toast({
        title: "Success",
        description: "Patch connection added successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding patch connection:', error);
      toast({
        title: "Error",
        description: "Failed to add patch connection",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateConnection = async (id: string, updates: Partial<PatchConnection>) => {
    try {
      const { data, error } = await supabase
        .from('patch_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchConnections();
      
      toast({
        title: "Success",
        description: "Patch connection updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating patch connection:', error);
      toast({
        title: "Error",
        description: "Failed to update patch connection",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patch_connections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchConnections();
      
      toast({
        title: "Success",
        description: "Patch connection deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting patch connection:', error);
      toast({
        title: "Error",
        description: "Failed to delete patch connection",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [locationId]);

  return {
    connections,
    loading,
    fetchConnections,
    addConnection,
    updateConnection,
    deleteConnection
  };
};