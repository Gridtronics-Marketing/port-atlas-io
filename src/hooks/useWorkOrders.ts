import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  work_type?: string;
  assigned_to?: string;
  created_by?: string;
  project_id?: string;
  location_id?: string;
  due_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
}

export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWorkOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch work orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addWorkOrder = async (workOrderData: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .insert([workOrderData])
        .select()
        .single();

      if (error) throw error;

      setWorkOrders(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Work order created successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error adding work order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create work order',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setWorkOrders(prev => 
        prev.map(wo => wo.id === id ? { ...wo, ...data } : wo)
      );
      
      toast({
        title: 'Success',
        description: 'Work order updated successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error updating work order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update work order',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteWorkOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWorkOrders(prev => prev.filter(wo => wo.id !== id));
      toast({
        title: 'Success',
        description: 'Work order deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting work order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete work order',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  return {
    workOrders,
    loading,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    refetch: fetchWorkOrders,
  };
}