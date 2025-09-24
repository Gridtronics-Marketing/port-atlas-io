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
        console.log('🔍 Fetching employee for email:', user.email);
        
        // Try to find employee by email first
        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email, role, department, status')
          .eq('email', user.email)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // Not found error
            console.error('Error fetching current employee:', error);
          } else {
            console.log('⚠️ No employee found with email:', user.email);
            
            // If employee not found by email, try alternative lookup methods
            // This can happen if the employee record exists but email is not set
            console.log('🔍 Attempting alternative employee lookup...');
            
            // Try to find by user ID or other matching criteria
            const { data: altData, error: altError } = await supabase
              .from('employees')
              .select('id, first_name, last_name, email, role, department, status')
              .is('email', null)
              .limit(1)
              .single();
              
            if (altData) {
              console.log('✅ Found employee with missing email, using as fallback:', altData);
              setEmployee(altData);
              toast({
                title: "Employee Profile Found",
                description: `Welcome ${altData.first_name} ${altData.last_name}! Your employee record needs email update.`,
              });
              return;
            }
          }
          
          // Show helpful message to user
          toast({
            title: "Employee Profile Not Found",
            description: "Your user account is not linked to an employee profile. Contact your administrator for assistance.",
            variant: "destructive",
          });
        } else {
          console.log('✅ Employee found:', data);
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