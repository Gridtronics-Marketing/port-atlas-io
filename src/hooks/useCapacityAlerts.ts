import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CapacityAlert {
  id: string;
  location_id: string;
  component_type: 'cable' | 'rack' | 'conduit' | 'frame' | 'device';
  component_id?: string;
  alert_type: 'approaching_capacity' | 'over_capacity' | 'utilization_warning' | 'performance_degradation';
  threshold_percentage?: number;
  current_utilization?: number;
  max_capacity?: number;
  alert_message?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
  // Joined data
  resolver?: {
    first_name: string;
    last_name: string;
  };
}

export const useCapacityAlerts = (locationId?: string) => {
  const [alerts, setAlerts] = useState<CapacityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('capacity_alerts')
        .select(`
          *,
          resolver:employees!resolved_by(first_name, last_name)
        `);
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setAlerts((data as CapacityAlert[]) || []);
    } catch (error) {
      console.error('Error fetching capacity alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch capacity alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAlert = async (alertData: Omit<CapacityAlert, 'id' | 'created_at' | 'resolver'>) => {
    try {
      const { data, error } = await supabase
        .from('capacity_alerts')
        .insert([alertData])
        .select()
        .single();
      
      if (error) throw error;
      await fetchAlerts();
      
      toast({
        title: "Alert Created",
        description: "Capacity alert created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding capacity alert:', error);
      toast({
        title: "Error",
        description: "Failed to create capacity alert",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resolveAlert = async (id: string, resolvedBy: string) => {
    try {
      const { data, error } = await supabase
        .from('capacity_alerts')
        .update({
          is_resolved: true,
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchAlerts();
      
      toast({
        title: "Success",
        description: "Alert resolved successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateAlert = async (id: string, updates: Partial<CapacityAlert>) => {
    try {
      const { data, error } = await supabase
        .from('capacity_alerts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchAlerts();
      
      toast({
        title: "Success",
        description: "Alert updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('capacity_alerts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchAlerts();
      
      toast({
        title: "Success",
        description: "Alert deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [locationId]);

  return {
    alerts,
    loading,
    fetchAlerts,
    addAlert,
    resolveAlert,
    updateAlert,
    deleteAlert
  };
};