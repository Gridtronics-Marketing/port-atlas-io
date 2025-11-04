import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'admin' | 'hr_manager' | 'project_manager' | 'technician' | 'viewer' | 'client_technician' | 'client_admin' | 'field_photographer';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export const useUserRoles = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [currentUserRoles, setCurrentUserRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCurrentUserRoles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCurrentUserRoles((data || []).map(r => r.role as AppRole));
    } catch (error) {
      console.error('Error fetching current user roles:', error);
    }
  };

  const fetchAllUserRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRoles((data || []) as UserRole[]);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role }])
        .select()
        .single();

      if (error) throw error;

      await fetchAllUserRoles();
      if (userId === user?.id) {
        await fetchCurrentUserRoles();
      }

      toast({
        title: "Success",
        description: `Role ${role} assigned successfully`,
      });
      
      return data;
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      await fetchAllUserRoles();
      if (userId === user?.id) {
        await fetchCurrentUserRoles();
      }

      toast({
        title: "Success",
        description: `Role ${role} removed successfully`,
      });
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
      throw error;
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return currentUserRoles.includes(role);
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    return roles.some(role => currentUserRoles.includes(role));
  };

  const canManageEmployees = (): boolean => {
    return hasAnyRole(['admin', 'hr_manager', 'client_admin']);
  };

  const canViewSensitiveData = (): boolean => {
    return hasAnyRole(['admin', 'hr_manager']);
  };

  const canEditEmployees = (): boolean => {
    return hasAnyRole(['admin', 'hr_manager', 'client_admin']);
  };

  const isClientUser = (): boolean => {
    return hasAnyRole(['client_technician', 'client_admin']);
  };

  const isCompanyUser = (): boolean => {
    return hasAnyRole(['admin', 'hr_manager', 'project_manager', 'technician', 'viewer', 'field_photographer']);
  };

  useEffect(() => {
    if (user) {
      console.log('🔐 useUserRoles: User found, fetching roles for:', user.email);
      fetchCurrentUserRoles();
      fetchAllUserRoles(); // Always fetch all roles for admin interface
    }
  }, [user]);

  // Separate effect to refetch current user roles when they change
  useEffect(() => {
    console.log('🔐 useUserRoles: Current user roles updated:', currentUserRoles);
  }, [currentUserRoles]);

  return {
    userRoles,
    currentUserRoles,
    loading,
    fetchAllUserRoles,
    fetchCurrentUserRoles,
    assignRole,
    removeRole,
    hasRole,
    hasAnyRole,
    canManageEmployees,
    canViewSensitiveData,
    canEditEmployees,
    isClientUser,
    isCompanyUser,
  };
};