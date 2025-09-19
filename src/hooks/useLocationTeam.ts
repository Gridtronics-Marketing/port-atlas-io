import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LocationTeamMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  email?: string;
  phone?: string;
  status: string;
  schedule_date?: string;
  schedule_type?: string;
}

export const useLocationTeam = (locationId?: string) => {
  const [teamMembers, setTeamMembers] = useState<LocationTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLocationTeam = async () => {
    if (!locationId) {
      setTeamMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First get employee IDs from schedules
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('employee_schedules')
        .select('employee_id, schedule_date, schedule_type, status')
        .eq('location_id', locationId)
        .eq('status', 'scheduled')
        .gte('schedule_date', new Date().toISOString().split('T')[0]);

      if (scheduleError) throw scheduleError;

      if (!scheduleData || scheduleData.length === 0) {
        setTeamMembers([]);
        return;
      }

      // Get unique employee IDs
      const employeeIds = [...new Set(scheduleData.map(s => s.employee_id))];

      // Fetch employee details
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, email, phone, status')
        .in('id', employeeIds);

      if (employeeError) throw employeeError;

      // Combine the data
      const teamMembersData = employeeData?.map(employee => {
        const schedule = scheduleData.find(s => s.employee_id === employee.id);
        return {
          ...employee,
          schedule_date: schedule?.schedule_date,
          schedule_type: schedule?.schedule_type,
        };
      }) || [];

      setTeamMembers(teamMembersData);
    } catch (error) {
      console.error('Error fetching location team:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team members for this location",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationTeam();
  }, [locationId]);

  return {
    teamMembers,
    loading,
    refetch: fetchLocationTeam,
  };
};