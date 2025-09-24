import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JunctionBox {
  id: string;
  location_id: string;
  backbone_cable_id?: string;
  junction_type: 'splice' | 'patch_panel' | 'junction_box';
  floor: number;
  x_coordinate?: number;
  y_coordinate?: number;
  label: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useJunctionBoxes = (locationId?: string, cableId?: string) => {
  const [junctionBoxes, setJunctionBoxes] = useState<JunctionBox[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJunctionBoxes = async () => {
    try {
      setLoading(true);
      let query = supabase.from('cable_junction_boxes').select('*');
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      if (cableId) {
        query = query.eq('backbone_cable_id', cableId);
      }
      
      const { data, error } = await query.order('floor', { ascending: true });
      
      if (error) throw error;
      setJunctionBoxes((data as JunctionBox[]) || []);
    } catch (error) {
      console.error('Error fetching junction boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addJunctionBox = async (junctionData: Omit<Partial<JunctionBox>, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('cable_junction_boxes')
        .insert([junctionData as any])
        .select()
        .single();
      
      if (error) throw error;
      await fetchJunctionBoxes();
      return data;
    } catch (error) {
      console.error('Error adding junction box:', error);
      throw error;
    }
  };

  const updateJunctionBox = async (id: string, updates: Partial<JunctionBox>) => {
    try {
      const { data, error } = await supabase
        .from('cable_junction_boxes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchJunctionBoxes();
      return data;
    } catch (error) {
      console.error('Error updating junction box:', error);
      throw error;
    }
  };

  const deleteJunctionBox = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cable_junction_boxes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchJunctionBoxes();
    } catch (error) {
      console.error('Error deleting junction box:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchJunctionBoxes();
  }, [locationId, cableId]);

  return {
    junctionBoxes,
    loading,
    fetchJunctionBoxes,
    addJunctionBox,
    updateJunctionBox,
    deleteJunctionBox
  };
};