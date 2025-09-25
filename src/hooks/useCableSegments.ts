import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CableSegment {
  id: string;
  cable_run_id: string;
  segment_order: number;
  origin_equipment: string;
  destination_equipment: string;
  origin_floor?: number;
  destination_floor?: number;
  segment_label: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useCableSegments = (cableRunId?: string) => {
  const [segments, setSegments] = useState<CableSegment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      let query = supabase.from('cable_segments').select('*');
      
      if (cableRunId) {
        query = query.eq('cable_run_id', cableRunId);
      }
      
      const { data, error } = await query.order('segment_order', { ascending: true });
      
      if (error) throw error;
      setSegments((data as CableSegment[]) || []);
    } catch (error) {
      console.error('Error fetching cable segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSegment = async (segmentData: Omit<CableSegment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('cable_segments')
        .insert([segmentData])
        .select()
        .single();
      
      if (error) throw error;
      await fetchSegments();
      return data;
    } catch (error) {
      console.error('Error adding cable segment:', error);
      throw error;
    }
  };

  const addMultipleSegments = async (segmentsData: Omit<CableSegment, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { data, error } = await supabase
        .from('cable_segments')
        .insert(segmentsData)
        .select();
      
      if (error) throw error;
      await fetchSegments();
      return data;
    } catch (error) {
      console.error('Error adding cable segments:', error);
      throw error;
    }
  };

  const updateSegment = async (id: string, updates: Partial<CableSegment>) => {
    try {
      const { data, error } = await supabase
        .from('cable_segments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchSegments();
      return data;
    } catch (error) {
      console.error('Error updating cable segment:', error);
      throw error;
    }
  };

  const deleteSegment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cable_segments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchSegments();
    } catch (error) {
      console.error('Error deleting cable segment:', error);
      throw error;
    }
  };

  const deleteSegmentsByCableRun = async (cableRunId: string) => {
    try {
      const { error } = await supabase
        .from('cable_segments')
        .delete()
        .eq('cable_run_id', cableRunId);
      
      if (error) throw error;
      await fetchSegments();
    } catch (error) {
      console.error('Error deleting cable segments:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSegments();
  }, [cableRunId]);

  return {
    segments,
    loading,
    fetchSegments,
    addSegment,
    addMultipleSegments,
    updateSegment,
    deleteSegment,
    deleteSegmentsByCableRun
  };
};