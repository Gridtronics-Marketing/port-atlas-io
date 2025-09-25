import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChangeLog {
  id: string;
  location_id: string;
  work_order_id?: string;
  change_type: 'move' | 'add' | 'change' | 'remove';
  component_type: 'cable' | 'device' | 'port' | 'frame' | 'vlan' | 'connection';
  component_id?: string;
  old_values: any;
  new_values: any;
  technician_id?: string;
  change_description?: string;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  // Joined data
  technician?: {
    first_name: string;
    last_name: string;
  } | null;
  work_order?: {
    title: string;
    work_order_number: string;
  } | null;
}

export const useChangeLog = (locationId?: string, componentId?: string) => {
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChangeLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('change_logs')
        .select(`
          *,
          technician:employees!technician_id(first_name, last_name),
          work_order:work_orders!work_order_id(title, work_order_number)
        `);
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      if (componentId) {
        query = query.eq('component_id', componentId);
      }
      
      const { data, error } = await query.order('timestamp', { ascending: false });
      
      if (error) throw error;
      setChangeLogs((data as any[])?.map(item => ({
        ...item,
        technician: item.technician || null,
        work_order: item.work_order || null
      })) || []);
    } catch (error) {
      console.error('Error fetching change logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch change logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addChangeLog = async (changeData: Omit<ChangeLog, 'id' | 'timestamp' | 'technician' | 'work_order'>) => {
    try {
      const { data, error } = await supabase
        .from('change_logs')
        .insert([changeData])
        .select()
        .single();
      
      if (error) throw error;
      await fetchChangeLogs();
      
      toast({
        title: "Success",
        description: "Change log recorded successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding change log:', error);
      toast({
        title: "Error",
        description: "Failed to record change log",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateChangeLog = async (id: string, updates: Partial<ChangeLog>) => {
    try {
      const { data, error } = await supabase
        .from('change_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchChangeLogs();
      
      toast({
        title: "Success",
        description: "Change log updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating change log:', error);
      toast({
        title: "Error",
        description: "Failed to update change log",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteChangeLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from('change_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchChangeLogs();
      
      toast({
        title: "Success",
        description: "Change log deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting change log:', error);
      toast({
        title: "Error",
        description: "Failed to delete change log",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchChangeLogs();
  }, [locationId, componentId]);

  return {
    changeLogs,
    loading,
    fetchChangeLogs,
    addChangeLog,
    updateChangeLog,
    deleteChangeLog
  };
};