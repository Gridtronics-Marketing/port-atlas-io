import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DropdownOption {
  id: string;
  category: string;
  option_key: string;
  option_value: string;
  display_name: string;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useDropdownOptions = (category?: string) => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOptions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('dropdown_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOptions((data || []).map(item => ({
        ...item,
        metadata: item.metadata as Record<string, any>
      })));
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dropdown options",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addOption = async (optionData: Omit<DropdownOption, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('dropdown_options')
        .insert([optionData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Option added successfully",
      });
      
      fetchOptions();
    } catch (error) {
      console.error('Error adding option:', error);
      toast({
        title: "Error",
        description: "Failed to add option",
        variant: "destructive",
      });
    }
  };

  const updateOption = async (id: string, updates: Partial<DropdownOption>) => {
    try {
      const { error } = await supabase
        .from('dropdown_options')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Option updated successfully",
      });
      
      fetchOptions();
    } catch (error) {
      console.error('Error updating option:', error);
      toast({
        title: "Error",
        description: "Failed to update option",
        variant: "destructive",
      });
    }
  };

  const deleteOption = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dropdown_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Option deleted successfully",
      });
      
      fetchOptions();
    } catch (error) {
      console.error('Error deleting option:', error);
      toast({
        title: "Error",
        description: "Failed to delete option",
        variant: "destructive",
      });
    }
  };

  // Get available categories
  const getCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('category')
        .eq('is_active', true);

      if (error) throw error;
      
      const categories = [...new Set(data?.map(item => item.category) || [])];
      return categories.sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [category]);

  return {
    options,
    loading,
    fetchOptions,
    addOption,
    updateOption,
    deleteOption,
    getCategories,
  };
};