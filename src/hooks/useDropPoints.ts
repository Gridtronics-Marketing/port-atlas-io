import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DropPoint {
  id: string;
  location_id: string;
  label: string;
  room: string | null;
  floor: number | null;
  point_type: 'data' | 'fiber' | 'security' | 'wireless' | 'power';
  x_coordinate: number | null;
  y_coordinate: number | null;
  status: 'planned' | 'roughed' | 'terminated' | 'tested' | 'active' | 'inactive';
  cable_id: string | null;
  patch_panel_port: string | null;
  switch_port: string | null;
  vlan: string | null;
  ip_address: string | null;
  mac_address: string | null;
  test_results: Record<string, any> | null;
  notes: string | null;
  installed_by: string | null;
  installed_date: string | null;
  tested_by: string | null;
  tested_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  installer?: {
    first_name: string;
    last_name: string;
  };
  tester?: {
    first_name: string;
    last_name: string;
  };
}

export const useDropPoints = (locationId?: string) => {
  const [dropPoints, setDropPoints] = useState<DropPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDropPoints = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('drop_points')
        .select(`
          *,
          installer:employees!drop_points_installed_by_fkey(first_name, last_name),
          tester:employees!drop_points_tested_by_fkey(first_name, last_name)
        `);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query.order('label', { ascending: true });

      if (error) throw error;
      setDropPoints((data || []) as DropPoint[]);
    } catch (error) {
      console.error('Error fetching drop points:', error);
      toast({
        title: "Error",
        description: "Failed to fetch drop points",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDropPoint = async (dropPointData: Omit<DropPoint, 'id' | 'created_at' | 'updated_at' | 'installer' | 'tester'>) => {
    try {
      const { data, error } = await supabase
        .from('drop_points')
        .insert([dropPointData])
        .select()
        .single();

      if (error) throw error;
      
      await fetchDropPoints(); // Refresh to get joined data
      toast({
        title: "Success",
        description: "Drop point added successfully",
      });
      return data;
    } catch (error) {
      console.error('Error adding drop point:', error);
      toast({
        title: "Error",
        description: "Failed to add drop point",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDropPoint = async (id: string, updates: Partial<DropPoint>) => {
    try {
      const { data, error } = await supabase
        .from('drop_points')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchDropPoints(); // Refresh to get updated data
      toast({
        title: "Success",
        description: "Drop point updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating drop point:', error);
      toast({
        title: "Error",
        description: "Failed to update drop point",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDropPoint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('drop_points')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDropPoints(prev => prev.filter(dropPoint => dropPoint.id !== id));
      toast({
        title: "Success",
        description: "Drop point deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting drop point:', error);
      toast({
        title: "Error",
        description: "Failed to delete drop point",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchDropPoints();
  }, [locationId]);

  return {
    dropPoints,
    loading,
    fetchDropPoints,
    addDropPoint,
    updateDropPoint,
    deleteDropPoint,
  };
};