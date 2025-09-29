import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from './useUserRoles';

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: AppRole[];
  employee?: {
    first_name?: string;
    last_name?: string;
    department?: string;
    status?: string;
  };
  is_active: boolean;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First get all users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        // If admin API fails, get user roles and build user list from that
        console.warn('Admin API not available, using user_roles table');
        
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');
          
        if (rolesError) throw rolesError;
        
        // Get unique user IDs
        const uniqueUserIds = [...new Set(userRoles?.map(ur => ur.user_id) || [])];
        
        // Get employee info for these users
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email, department, status');
          
        if (empError) console.warn('Could not fetch employees:', empError);
        
        const usersData = uniqueUserIds.map(userId => {
          const userRolesList = userRoles?.filter(ur => ur.user_id === userId).map(ur => ur.role as AppRole) || [];
          const employee = employees?.find(emp => emp.email && emp.id === userId);
          
          return {
            id: userId,
            email: employee?.email || `user-${userId.slice(0, 8)}`,
            name: employee ? `${employee.first_name} ${employee.last_name}` : undefined,
            roles: userRolesList,
            employee: employee ? {
              first_name: employee.first_name,
              last_name: employee.last_name,
              department: employee.department,
              status: employee.status
            } : undefined,
            is_active: employee?.status === 'Active' || true
          };
        });
        
        setUsers(usersData);
        return;
      }

      // Get user roles for all users
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
        
      if (rolesError) throw rolesError;

      // Get employee information 
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, department, status');
        
      if (empError) console.warn('Could not fetch employees:', empError);

      // Combine the data
      const usersData = authUsers.users.map(authUser => {
        const userRolesList = userRoles?.filter(ur => ur.user_id === authUser.id).map(ur => ur.role as AppRole) || [];
        const employee = employees?.find(emp => emp.email === authUser.email);
        
        return {
          id: authUser.id,
          email: authUser.email || '',
          name: employee ? `${employee.first_name} ${employee.last_name}` : undefined,
          roles: userRolesList,
          employee: employee ? {
            first_name: employee.first_name,
            last_name: employee.last_name,
            department: employee.department,
            status: employee.status
          } : undefined,
          is_active: employee?.status === 'Active' || true
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    refetch: fetchUsers,
  };
};