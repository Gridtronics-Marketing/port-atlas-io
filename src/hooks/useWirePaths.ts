import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface WirePath {
  id: string;
  location_id: string;
  organization_id: string | null;
  floor: number;
  path_points: { x: number; y: number }[];
  cable_type: string;
  label: string | null;
  notes: string | null;
  color: string;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useWirePaths = (locationId?: string, floor?: number) => {
  const [wirePaths, setWirePaths] = useState<WirePath[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  const fetchWirePaths = async () => {
    if (!locationId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('wire_paths')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (floor !== undefined) {
        query = query.eq('floor', floor);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Parse path_points from JSON
      const parsedData = (data || []).map(wp => ({
        ...wp,
        path_points: Array.isArray(wp.path_points) ? wp.path_points : []
      }));
      
      setWirePaths(parsedData as WirePath[]);
    } catch (error) {
      console.error('Error fetching wire paths:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wire paths',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addWirePath = async (pathData: {
    location_id: string;
    floor: number;
    path_points: { x: number; y: number }[];
    cable_type: string;
    label?: string;
    notes?: string;
    color?: string;
    status?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('wire_paths')
        .insert([{
          ...pathData,
          organization_id: currentOrganization?.id,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Wire path added',
      });

      fetchWirePaths();
      return data;
    } catch (error) {
      console.error('Error adding wire path:', error);
      toast({
        title: 'Error',
        description: 'Failed to add wire path',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateWirePath = async (id: string, updates: Partial<WirePath>) => {
    try {
      const { error } = await supabase
        .from('wire_paths')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Wire path updated',
      });

      fetchWirePaths();
    } catch (error) {
      console.error('Error updating wire path:', error);
      toast({
        title: 'Error',
        description: 'Failed to update wire path',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteWirePath = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wire_paths')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Wire path deleted',
      });

      fetchWirePaths();
    } catch (error) {
      console.error('Error deleting wire path:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete wire path',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchWirePaths();
  }, [locationId, floor]);

  return {
    wirePaths,
    loading,
    addWirePath,
    updateWirePath,
    deleteWirePath,
    refetch: fetchWirePaths,
  };
};
