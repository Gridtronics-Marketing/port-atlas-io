import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RiserPathway {
  id: string;
  location_id: string;
  pathway_name: string;
  pathway_type: 'conduit' | 'cable_tray' | 'riser_shaft' | 'plenum' | 'other';
  floors_served: number[];
  pathway_capacity: number;
  utilization_percentage: number;
  fire_stops: any[];
  x_coordinate?: number;
  y_coordinate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useRiserPathways = (locationId?: string) => {
  const [pathways, setPathways] = useState<RiserPathway[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPathways = async () => {
    try {
      setLoading(true);
      let query = supabase.from('riser_pathways').select('*');
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query.order('pathway_name', { ascending: true });
      
      if (error) throw error;
      setPathways((data as RiserPathway[]) || []);
    } catch (error) {
      console.error('Error fetching riser pathways:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPathway = async (pathwayData: Omit<Partial<RiserPathway>, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('riser_pathways')
        .insert([pathwayData as any])
        .select()
        .single();
      
      if (error) throw error;
      await fetchPathways();
      return data;
    } catch (error) {
      console.error('Error adding riser pathway:', error);
      throw error;
    }
  };

  const updatePathway = async (id: string, updates: Partial<RiserPathway>) => {
    try {
      const { data, error } = await supabase
        .from('riser_pathways')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchPathways();
      return data;
    } catch (error) {
      console.error('Error updating riser pathway:', error);
      throw error;
    }
  };

  const deletePathway = async (id: string) => {
    try {
      const { error } = await supabase
        .from('riser_pathways')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchPathways();
    } catch (error) {
      console.error('Error deleting riser pathway:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPathways();
  }, [locationId]);

  return {
    pathways,
    loading,
    fetchPathways,
    addPathway,
    updatePathway,
    deletePathway
  };
};