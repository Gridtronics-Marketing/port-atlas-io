import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DropPointTestResult {
  id: string;
  drop_point_id: string;
  test_type: string;
  test_date: string;
  tested_by: string | null;
  results: Record<string, any> | null;
  pass_fail: 'pass' | 'fail' | 'pending';
  test_values: Record<string, any> | null;
  equipment_used: string | null;
  notes: string | null;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
  // Joined data
  tester?: {
    first_name: string;
    last_name: string;
  };
}

export const useDropPointTestResults = (dropPointId?: string) => {
  const [testResults, setTestResults] = useState<DropPointTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTestResults = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('test_results')
        .select(`
          *,
          tester:employees!test_results_tested_by_fkey(first_name, last_name)
        `);

      if (dropPointId) {
        query = query.eq('drop_point_id', dropPointId);
      }

      const { data, error } = await query.order('test_date', { ascending: false });

      if (error) throw error;
      setTestResults((data || []) as DropPointTestResult[]);
    } catch (error) {
      console.error('Error fetching test results:', error);
      toast({
        title: "Error",
        description: "Failed to fetch test results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = async (testData: Omit<DropPointTestResult, 'id' | 'created_at' | 'updated_at' | 'tester'>) => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .insert([testData])
        .select()
        .single();

      if (error) throw error;
      
      await fetchTestResults(); // Refresh to get joined data
      toast({
        title: "Success",
        description: "Test result added successfully",
      });
      return data;
    } catch (error) {
      console.error('Error adding test result:', error);
      toast({
        title: "Error",
        description: "Failed to add test result",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTestResult = async (id: string, updates: Partial<DropPointTestResult>) => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchTestResults(); // Refresh to get updated data
      toast({
        title: "Success",
        description: "Test result updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating test result:', error);
      toast({
        title: "Error",
        description: "Failed to update test result",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTestResult = async (id: string) => {
    try {
      const { error } = await supabase
        .from('test_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTestResults(prev => prev.filter(result => result.id !== id));
      toast({
        title: "Success",
        description: "Test result deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting test result:', error);
      toast({
        title: "Error",
        description: "Failed to delete test result",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchTestResults();
  }, [dropPointId]);

  return {
    testResults,
    loading,
    fetchTestResults,
    addTestResult,
    updateTestResult,
    deleteTestResult,
  };
};