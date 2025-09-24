import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DistributionFrame {
  id: string;
  location_id: string;
  frame_type: 'MDF' | 'IDF';
  floor: number;
  room?: string;
  rack_position?: number;
  equipment_details: any;
  port_count: number;
  capacity: number;
  patch_panels: any[];
  x_coordinate?: number;
  y_coordinate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useDistributionFrames = (locationId?: string) => {
  const [frames, setFrames] = useState<DistributionFrame[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFrames = async () => {
    try {
      setLoading(true);
      let query = supabase.from('distribution_frames').select('*');
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query.order('frame_type', { ascending: true });
      
      if (error) throw error;
      setFrames((data as DistributionFrame[]) || []);
    } catch (error) {
      console.error('Error fetching distribution frames:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFrame = async (frameData: Omit<Partial<DistributionFrame>, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('distribution_frames')
        .insert([frameData as any])
        .select()
        .single();
      
      if (error) throw error;
      await fetchFrames();
      return data;
    } catch (error) {
      console.error('Error adding distribution frame:', error);
      throw error;
    }
  };

  const updateFrame = async (id: string, updates: Partial<DistributionFrame>) => {
    try {
      const { data, error } = await supabase
        .from('distribution_frames')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchFrames();
      return data;
    } catch (error) {
      console.error('Error updating distribution frame:', error);
      throw error;
    }
  };

  const deleteFrame = async (id: string) => {
    try {
      const { error } = await supabase
        .from('distribution_frames')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchFrames();
    } catch (error) {
      console.error('Error deleting distribution frame:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchFrames();
  }, [locationId]);

  return {
    frames,
    loading,
    fetchFrames,
    addFrame,
    updateFrame,
    deleteFrame
  };
};