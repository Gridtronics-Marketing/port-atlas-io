import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface WorkflowConfiguration {
  id: string;
  workflow_name: string;
  workflow_type: string;
  steps: Json;
  approval_rules: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkflowFormData {
  workflow_name: string;
  workflow_type: string;
  steps: any[];
  approval_rules: any;
  is_active: boolean;
}

export const useWorkflowConfigurations = () => {
  const [workflows, setWorkflows] = useState<WorkflowConfiguration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflow_configurations')
        .select('*')
        .order('workflow_name');

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWorkflow = async (workflowData: WorkflowFormData) => {
    try {
      const { data, error } = await supabase
        .from('workflow_configurations')
        .insert([workflowData])
        .select()
        .single();

      if (error) throw error;
      
      setWorkflows(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding workflow:', error);
      throw error;
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<WorkflowFormData>) => {
    try {
      const { data, error } = await supabase
        .from('workflow_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setWorkflows(prev => 
        prev.map(workflow => 
          workflow.id === id ? { ...workflow, ...data } : workflow
        )
      );
      return data;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workflow_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWorkflows(prev => prev.filter(workflow => workflow.id !== id));
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return {
    workflows,
    loading,
    fetchWorkflows,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
};