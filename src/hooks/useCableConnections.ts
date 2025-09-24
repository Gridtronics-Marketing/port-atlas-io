import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CableConnection {
  id: string;
  backbone_cable_id: string;
  from_frame_id: string;
  to_frame_id: string;
  from_port: string;
  to_port: string;
  connection_type: 'patch' | 'splice' | 'direct';
  is_active: boolean;
  redundancy_group?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useCableConnections = (locationId?: string) => {
  const [connections, setConnections] = useState<CableConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      let query = supabase.from('cable_connections').select(`
        *,
        backbone_cables!inner(location_id)
      `);
      
      if (locationId) {
        query = query.eq('backbone_cables.location_id', locationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setConnections((data as any[])?.map(item => ({
        id: item.id,
        backbone_cable_id: item.backbone_cable_id,
        from_frame_id: item.from_frame_id,
        to_frame_id: item.to_frame_id,
        from_port: item.from_port,
        to_port: item.to_port,
        connection_type: item.connection_type,
        is_active: item.is_active,
        redundancy_group: item.redundancy_group,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || []);
    } catch (error) {
      console.error('Error fetching cable connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const addConnection = async (connectionData: Omit<Partial<CableConnection>, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('cable_connections')
        .insert([connectionData as any])
        .select()
        .single();
      
      if (error) throw error;
      await fetchConnections();
      return data;
    } catch (error) {
      console.error('Error adding cable connection:', error);
      throw error;
    }
  };

  const updateConnection = async (id: string, updates: Partial<CableConnection>) => {
    try {
      const { data, error } = await supabase
        .from('cable_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchConnections();
      return data;
    } catch (error) {
      console.error('Error updating cable connection:', error);
      throw error;
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cable_connections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchConnections();
    } catch (error) {
      console.error('Error deleting cable connection:', error);
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