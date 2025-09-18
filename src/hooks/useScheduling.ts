import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmployeeSchedule {
  id: string;
  employee_id: string;
  project_id?: string;
  location_id?: string;
  work_order_id?: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  schedule_type: 'assignment' | 'template' | 'time_off';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface CreateScheduleData {
  employee_id: string;
  project_id?: string;
  location_id?: string;
  work_order_id?: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  schedule_type?: 'assignment' | 'template' | 'time_off';
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export const useScheduling = () => {
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchedules = async (startDate?: string, endDate?: string, employeeId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('employee_schedules')
        .select('*')
        .order('schedule_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (startDate) {
        query = query.gte('schedule_date', startDate);
      }
      if (endDate) {
        query = query.lte('schedule_date', endDate);
      }
      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching schedules:', error);
        toast({
          title: "Error",
          description: "Failed to fetch schedules",
          variant: "destructive",
        });
        return;
      }

      setSchedules((data || []) as EmployeeSchedule[]);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSchedule = async (scheduleData: CreateScheduleData): Promise<EmployeeSchedule | null> => {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .insert([scheduleData])
        .select()
        .single();

      if (error) {
        console.error('Error adding schedule:', error);
        toast({
          title: "Error",
          description: "Failed to create schedule",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Schedule created successfully",
      });

      await fetchSchedules();
      return data as EmployeeSchedule;
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast({
        title: "Error",
        description: "Failed to create schedule",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<EmployeeSchedule>): Promise<EmployeeSchedule | null> => {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating schedule:', error);
        toast({
          title: "Error",
          description: "Failed to update schedule",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });

      await fetchSchedules();
      return data as EmployeeSchedule;
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteSchedule = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('employee_schedules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting schedule:', error);
        toast({
          title: "Error",
          description: "Failed to delete schedule",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });

      await fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return {
    schedules,
    loading,
    fetchSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
  };
};