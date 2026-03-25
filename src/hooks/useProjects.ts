import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationData } from '@/hooks/useOrganizationData';

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  project_type?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
  estimated_budget?: number;
  actual_cost?: number;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { organizationId } = useOrganizationData();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by organization if one is selected
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...projectData, organization_id: organizationId }])
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => 
        prev.map(p => p.id === id ? { ...p, ...data } : p)
      );
      
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [organizationId]);

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
