import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmployeeAvailability {
  id: string;
  employee_id: string;
  availability_type: 'time_off' | 'available' | 'unavailable';
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'denied';
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CreateAvailabilityData {
  employee_id: string;
  availability_type: 'time_off' | 'available' | 'unavailable';
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  notes?: string;
}

export const useEmployeeAvailability = () => {
  const [availability, setAvailability] = useState<EmployeeAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAvailability = async (employeeId?: string, status?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('employee_availability')
        .select('*')
        .order('start_date', { ascending: true });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching availability:', error);
        toast({
          title: "Error",
          description: "Failed to fetch availability data",
          variant: "destructive",
        });
        return;
      }

      setAvailability((data || []) as EmployeeAvailability[]);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: "Error",
        description: "Failed to fetch availability data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAvailability = async (availabilityData: CreateAvailabilityData): Promise<EmployeeAvailability | null> => {
    try {
      const { data, error } = await supabase
        .from('employee_availability')
        .insert([availabilityData])
        .select()
        .single();

      if (error) {
        console.error('Error adding availability:', error);
        toast({
          title: "Error",
          description: "Failed to create availability request",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Availability request created successfully",
      });

      await fetchAvailability();
      return data as EmployeeAvailability;
    } catch (error) {
      console.error('Error adding availability:', error);
      toast({
        title: "Error",
        description: "Failed to create availability request",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAvailability = async (id: string, updates: Partial<EmployeeAvailability>): Promise<EmployeeAvailability | null> => {
    try {
      const { data, error } = await supabase
        .from('employee_availability')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating availability:', error);
        toast({
          title: "Error",
          description: "Failed to update availability",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Availability updated successfully",
      });

      await fetchAvailability();
      return data as EmployeeAvailability;
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
      return null;
    }
  };

  const approveAvailability = async (id: string, approved: boolean): Promise<void> => {
    try {
      const updates: Partial<EmployeeAvailability> = {
        status: approved ? 'approved' : 'denied',
        approved_at: new Date().toISOString(),
      };

      await updateAvailability(id, updates);
    } catch (error) {
      console.error('Error approving availability:', error);
    }
  };

  const deleteAvailability = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('employee_availability')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting availability:', error);
        toast({
          title: "Error",
          description: "Failed to delete availability request",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Availability request deleted successfully",
      });

      await fetchAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast({
        title: "Error",
        description: "Failed to delete availability request",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  return {
    availability,
    loading,
    fetchAvailability,
    addAvailability,
    updateAvailability,
    approveAvailability,
    deleteAvailability,
  };
};