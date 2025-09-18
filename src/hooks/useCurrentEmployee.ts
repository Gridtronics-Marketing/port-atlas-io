import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CurrentEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  role: string;
  department: string | null;
  status: string | null;
}

export const useCurrentEmployee = () => {
  const [employee, setEmployee] = useState<CurrentEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email, role, department, status')
          .eq('email', user.email)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // Not found error
            console.error('Error fetching current employee:', error);
            toast({
              title: "Warning",
              description: "Could not find employee record for current user",
              variant: "destructive",
            });
          }
        } else {
          setEmployee(data);
        }
      } catch (error) {
        console.error('Error fetching current employee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentEmployee();
  }, [user?.email, toast]);

  return {
    employee,
    loading,
  };
};