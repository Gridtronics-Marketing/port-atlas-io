import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationData } from '@/hooks/useOrganizationData';

// Full employee data - HR and Admin only
export interface Employee {
  id: string;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  hire_date: string | null;
  hourly_rate: number | null;
  skills: string[] | null;
  certifications: string[] | null;
  certification_expiry: any;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  client_id: string | null;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

// Limited employee data - Project Managers
export interface EmployeeBasic {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  skills: string[] | null;
  certifications: string[] | null;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
}

// Directory-only data - Technicians and Viewers
export interface EmployeeDirectory {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { canViewSensitiveData, hasRole, hasAnyRole, loading: rolesLoading } = useUserRoles();
  const { organizationId } = useOrganizationData();

  // Filter employee data based on user role - return Employee but with sensitive fields nullified
  const filterEmployeeData = (employee: Employee): Employee => {
    // HR and Admin see full data
    if (canViewSensitiveData()) {
      return employee;
    }
    
    // Project Managers see basic info without sensitive personal data
    if (hasRole('project_manager')) {
      return {
        ...employee,
        email: null,
        phone: null,
        hire_date: null,
        hourly_rate: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        employee_number: null,
        certification_expiry: null
      };
    }
    
    // Technicians and Viewers see directory info only
    return {
      ...employee,
      email: null,
      phone: null,
      hire_date: null,
      hourly_rate: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      employee_number: null,
      certification_expiry: null,
      skills: null,
      certifications: null
    };
  };

  // Fetch a single employee by ID with fresh data from database
  const fetchEmployeeById = async (id: string): Promise<Employee | null> => {
    try {
      console.log('🔍 Fetching employee by ID:', id);
      console.log('🔐 User has admin/HR access:', canViewSensitiveData());
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const employee = data as Employee;
      
      // For admins, return raw data; for others, apply filtering
      const result = canViewSensitiveData() ? employee : filterEmployeeData(employee);
      
      console.log('✅ Fresh employee data fetched. Skills:', result.skills);
      return result;
    } catch (error) {
      console.error('❌ Error fetching employee by ID:', error);
      throw error;
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // For technicians and viewers, use the secure directory function
      // For HR/Admin and Project Managers, use the full employees table
      if (hasAnyRole(['technician', 'viewer'])) {
        const { data, error } = await supabase
          .rpc('get_employee_directory');
          
        if (error) throw error;
        
        // Transform directory data to match Employee interface (with nullified sensitive fields)
        const directoryData = (data || []).map(emp => ({
          ...emp,
          employee_number: null,
          email: null,
          phone: null,
          hire_date: null,
          hourly_rate: null,
          skills: null,
          certifications: null,
          certification_expiry: null,
          emergency_contact_name: null,
          emergency_contact_phone: null,
        } as Employee));
        
        setEmployees(directoryData);
      } else {
        // HR/Admin and Project Managers get data from main table with filtering
        let query = supabase
          .from('employees')
          .select('*')
          .order('first_name', { ascending: true });

        // Filter by organization if one is selected
        if (organizationId) {
          query = query.eq('organization_id', organizationId);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        // Filter data based on user role
        const filteredData = (data || []).map(employee => filterEmployeeData(employee as Employee));
        setEmployees(filteredData);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{ ...employeeData, organization_id: organizationId }])
        .select()
        .single();

      if (error) throw error;
      
      // Apply filtering to the new employee data before adding to state
      const filteredEmployee = filterEmployeeData(data as Employee);
      setEmployees(prev => [...prev, filteredEmployee].sort((a, b) => a.first_name.localeCompare(b.first_name)));
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
      return data;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      // 1. Update in database
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Employee updated in database:', data);
      console.log('🔐 Admin access:', canViewSensitiveData());
      
      // 2. Fetch fresh data from database to ensure accuracy
      const freshEmployee = await fetchEmployeeById(id);
      
      if (!freshEmployee) {
        throw new Error('Failed to fetch updated employee data');
      }
      
      // 3. Update state with fresh data
      setEmployees(prev => 
        prev.map(emp => emp.id === id ? freshEmployee : emp)
          .sort((a, b) => a.first_name.localeCompare(b.first_name))
      );
      
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEmployees(prev => prev.filter(employee => employee.id !== id));
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user && !rolesLoading) {
      console.log('🔄 [useEmployees] Fetching employees (roles loaded, user authenticated)');
      console.log('🔐 [useEmployees] User has admin/HR access:', canViewSensitiveData());
      fetchEmployees();
    }
  }, [user, rolesLoading, organizationId]);

  // Helper function to check if user can view sensitive employee data
  const canViewSensitiveEmployeeData = () => canViewSensitiveData();
  
  // Helper function to check if user can view basic employee data (skills, certifications)
  const canViewBasicEmployeeData = () => canViewSensitiveData() || hasRole('project_manager');

  return {
    employees,
    loading,
    fetchEmployees,
    fetchEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    canViewSensitiveEmployeeData,
    canViewBasicEmployeeData,
  };
};
