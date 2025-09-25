import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MaintenanceSchedule {
  id: string;
  service_plan_id: string;
  location_id?: string;
  scheduled_date: string;
  scheduled_time?: string;
  assigned_technician_id?: string;
  status: string;
  work_order_id?: string;
  completion_notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionBilling {
  id: string;
  contract_id: string;
  billing_period_start: string;
  billing_period_end: string;
  amount: number;
  status: string;
  invoice_date?: string;
  due_date?: string;
  paid_date?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export const useMaintenanceScheduling = () => {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [billing, setBilling] = useState<SubscriptionBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select(`
          *,
          service_plan:service_plans(plan_name, contract:contracts(title, client:clients(name))),
          location:locations(name, address),
          technician:employees(first_name, last_name)
        `)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch maintenance schedules.",
        variant: "destructive",
      });
    }
  };

  const fetchBilling = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_billing')
        .select(`
          *,
          contract:contracts(title, client:clients(name))
        `)
        .order('billing_period_start', { ascending: false });

      if (error) throw error;
      setBilling(data || []);
    } catch (error) {
      console.error('Error fetching billing:', error);
      toast({
        title: "Error",
        description: "Failed to fetch billing information.",
        variant: "destructive",
      });
    }
  };

  const createMaintenanceSchedule = async (scheduleData: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .insert(scheduleData)
        .select()
        .single();

      if (error) throw error;

      await fetchSchedules();
      toast({
        title: "Success",
        description: "Maintenance scheduled successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to schedule maintenance.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateScheduleStatus = async (id: string, status: string, completionNotes?: string) => {
    try {
      const updates: Partial<MaintenanceSchedule> = { 
        status,
        ...(completionNotes && { completion_notes: completionNotes }),
        ...(status === 'completed' && { completed_at: new Date().toISOString() })
      };

      const { error } = await supabase
        .from('maintenance_schedules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchSchedules();
      toast({
        title: "Success",
        description: "Schedule updated successfully.",
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const generateRecurringSchedules = async (servicePlanId: string, monthsAhead: number = 6) => {
    try {
      // Get service plan details
      const { data: servicePlan, error: planError } = await supabase
        .from('service_plans')
        .select('*, contract:contracts(*)')
        .eq('id', servicePlanId)
        .single();

      if (planError) throw planError;

      const schedules: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>[] = [];
      const today = new Date();
      
      // Calculate interval based on frequency
      let intervalDays = 30; // default monthly
      switch (servicePlan.service_frequency) {
        case 'weekly':
          intervalDays = 7;
          break;
        case 'bi-weekly':
          intervalDays = 14;
          break;
        case 'monthly':
          intervalDays = 30;
          break;
        case 'quarterly':
          intervalDays = 90;
          break;
        case 'semi-annually':
          intervalDays = 180;
          break;
        case 'annually':
          intervalDays = 365;
          break;
      }

      // Generate schedules for each location covered
      for (const locationId of servicePlan.locations_covered) {
        let currentDate = new Date(today);
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + monthsAhead);

        while (currentDate <= endDate) {
          schedules.push({
            service_plan_id: servicePlanId,
            location_id: locationId,
            scheduled_date: currentDate.toISOString().split('T')[0],
            status: 'scheduled',
          });

          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + intervalDays);
        }
      }

      if (schedules.length > 0) {
        const { error } = await supabase
          .from('maintenance_schedules')
          .insert(schedules);

        if (error) throw error;

        await fetchSchedules();
        toast({
          title: "Success",
          description: `Generated ${schedules.length} maintenance schedules.`,
        });
      }
    } catch (error) {
      console.error('Error generating schedules:', error);
      toast({
        title: "Error",
        description: "Failed to generate recurring schedules.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createBillingEntry = async (billingData: Omit<SubscriptionBilling, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('subscription_billing')
        .insert(billingData)
        .select()
        .single();

      if (error) throw error;

      await fetchBilling();
      toast({
        title: "Success",
        description: "Billing entry created successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error creating billing entry:', error);
      toast({
        title: "Error",
        description: "Failed to create billing entry.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const markBillingPaid = async (id: string, paymentMethod: string) => {
    try {
      const { error } = await supabase
        .from('subscription_billing')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchBilling();
      toast({
        title: "Success",
        description: "Payment recorded successfully.",
      });
    } catch (error) {
      console.error('Error marking billing as paid:', error);
      toast({
        title: "Error",
        description: "Failed to record payment.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getUpcomingMaintenance = (days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return schedules.filter(schedule => {
      const scheduledDate = new Date(schedule.scheduled_date);
      return scheduledDate <= cutoffDate && schedule.status === 'scheduled';
    });
  };

  const getOverdueBilling = () => {
    const today = new Date().toISOString().split('T')[0];
    return billing.filter(bill => 
      bill.status === 'pending' && 
      bill.due_date && 
      bill.due_date < today
    );
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSchedules(), fetchBilling()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    schedules,
    billing,
    loading,
    createMaintenanceSchedule,
    updateScheduleStatus,
    generateRecurringSchedules,
    createBillingEntry,
    markBillingPaid,
    getUpcomingMaintenance,
    getOverdueBilling,
    refetch: () => Promise.all([fetchSchedules(), fetchBilling()]),
  };
};