import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LocationNote {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  created_by: string;
  employee_name?: string;
}

export const useLocationNotes = (locationId?: string) => {
  const [notes, setNotes] = useState<LocationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLocationNotes = async () => {
    if (!locationId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch notes from daily_logs where work_description contains structured note data
      const { data, error } = await supabase
        .from('daily_logs')
        .select(`
          id,
          work_description,
          materials_used,
          created_at,
          employee_id,
          employees!daily_logs_employee_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq('location_id', locationId)
        .not('work_description', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform daily_logs into notes format
      const transformedNotes = (data || [])
        .filter(log => log.work_description && log.work_description.includes(':'))
        .map(log => {
          const [title, ...contentParts] = log.work_description.split(':');
          const content = contentParts.join(':').trim();
          
          return {
            id: log.id,
            title: title.trim(),
            content,
            category: (log.materials_used as any)?.note_category || 'general',
            created_at: log.created_at,
            created_by: log.employee_id,
            employee_name: log.employees ? 
              `${log.employees.first_name} ${log.employees.last_name}` : 
              'Unknown'
          };
        });

      setNotes(transformedNotes);
    } catch (error) {
      console.error('Error fetching location notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch location notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationNotes();
  }, [locationId]);

  return {
    notes,
    loading,
    refetch: fetchLocationNotes,
  };
};