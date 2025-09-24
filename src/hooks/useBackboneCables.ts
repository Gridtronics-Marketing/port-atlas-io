import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BackboneCable {
  id: string;
  location_id: string;
  cable_type: 'fiber' | 'copper' | 'coax';
  cable_subtype?: string;
  strand_count?: number;
  pair_count?: number;
  jacket_rating?: 'plenum' | 'riser' | 'LSZH';
  origin_floor?: number;
  destination_floor?: number;
  origin_equipment?: string;
  destination_equipment?: string;
  labeling_standard: string;
  cable_label: string;
  unique_id?: string;
  installation_date?: string;
  test_results: any;
  capacity_total?: number;
  capacity_used: number;
  capacity_spare?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useBackboneCables = (locationId?: string) => {
  const [cables, setCables] = useState<BackboneCable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCables = async () => {
    try {
      setLoading(true);
      let query = supabase.from('backbone_cables').select('*');
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setCables((data as BackboneCable[]) || []);
    } catch (error) {
      console.error('Error fetching backbone cables:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCable = async (cableData: Omit<Partial<BackboneCable>, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('backbone_cables')
        .insert([cableData as any])
        .select()
        .single();
      
      if (error) throw error;
      await fetchCables();
      return data;
    } catch (error) {
      console.error('Error adding backbone cable:', error);
      throw error;
    }
  };

  const updateCable = async (id: string, updates: Partial<BackboneCable>) => {
    try {
      const { data, error } = await supabase
        .from('backbone_cables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchCables();
      return data;
    } catch (error) {
      console.error('Error updating backbone cable:', error);
      throw error;
    }
  };

  const deleteCable = async (id: string) => {
    try {
      const { error } = await supabase
        .from('backbone_cables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchCables();
    } catch (error) {
      console.error('Error deleting backbone cable:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCables();
  }, [locationId]);

  return {
    cables,
    loading,
    fetchCables,
    addCable,
    updateCable,
    deleteCable
  };
};