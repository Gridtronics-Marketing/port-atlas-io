import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemConfiguration {
  id: string;
  category: string;
  key: string;
  value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSystemConfigurations = (category?: string) => {
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('system_configurations')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConfigurations((data || []).map(item => ({
        ...item,
        data_type: item.data_type as 'string' | 'number' | 'boolean' | 'json'
      })));
    } catch (error) {
      console.error('Error fetching system configurations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addConfiguration = async (configData: Omit<SystemConfiguration, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('system_configurations')
        .insert([configData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Configuration added successfully",
      });
      
      fetchConfigurations();
    } catch (error) {
      console.error('Error adding configuration:', error);
      toast({
        title: "Error",
        description: "Failed to add configuration",
        variant: "destructive",
      });
    }
  };

  const updateConfiguration = async (id: string, updates: Partial<SystemConfiguration>) => {
    try {
      const { error } = await supabase
        .from('system_configurations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Configuration updated successfully",
      });
      
      fetchConfigurations();
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      });
    }
  };

  const deleteConfiguration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('system_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Configuration deleted successfully",
      });
      
      fetchConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({
        title: "Error",
        description: "Failed to delete configuration",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, [category]);

  return {
    configurations,
    loading,
    fetchConfigurations,
    addConfiguration,
    updateConfiguration,
    deleteConfiguration,
  };
};