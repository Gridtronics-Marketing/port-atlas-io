import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface SafetyChecklist {
  id: string;
  name: string;
  description?: string;
  category: 'general' | 'pre_job' | 'post_job' | 'hazmat' | 'electrical';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  items?: SafetyChecklistItem[];
}

export interface SafetyChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  description?: string;
  category: 'safety' | 'equipment' | 'environment' | 'procedures';
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface QualityChecklist {
  id: string;
  name: string;
  description?: string;
  category: 'general' | 'installation' | 'testing' | 'documentation' | 'handover';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  items?: QualityChecklistItem[];
}

export interface QualityChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  description?: string;
  category: 'quality' | 'performance' | 'documentation' | 'compliance';
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useChecklistManagement = () => {
  const [safetyChecklists, setSafetyChecklists] = useState<SafetyChecklist[]>([]);
  const [qualityChecklists, setQualityChecklists] = useState<QualityChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch safety checklists
  const fetchSafetyChecklists = async () => {
    try {
      const { data: checklists, error: checklistError } = await supabase
        .from('safety_checklists')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (checklistError) {
        console.error('Error fetching safety checklists:', checklistError);
        return;
      }

      // Fetch items for each checklist
      const checklistsWithItems = await Promise.all(
        (checklists || []).map(async (checklist) => {
          const { data: items, error: itemsError } = await supabase
            .from('safety_checklist_items')
            .select('*')
            .eq('checklist_id', checklist.id)
            .order('sort_order');

          if (itemsError) {
            console.error('Error fetching safety checklist items:', itemsError);
            return { ...checklist, items: [] };
          }

          return { ...checklist, items: items || [] };
        })
      );

      setSafetyChecklists(checklistsWithItems as SafetyChecklist[]);
    } catch (error) {
      console.error('Error fetching safety checklists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch safety checklists",
        variant: "destructive",
      });
    }
  };

  // Fetch quality checklists
  const fetchQualityChecklists = async () => {
    try {
      const { data: checklists, error: checklistError } = await supabase
        .from('quality_checklists')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (checklistError) {
        console.error('Error fetching quality checklists:', checklistError);
        return;
      }

      // Fetch items for each checklist
      const checklistsWithItems = await Promise.all(
        (checklists || []).map(async (checklist) => {
          const { data: items, error: itemsError } = await supabase
            .from('quality_checklist_items')
            .select('*')
            .eq('checklist_id', checklist.id)
            .order('sort_order');

          if (itemsError) {
            console.error('Error fetching quality checklist items:', itemsError);
            return { ...checklist, items: [] };
          }

          return { ...checklist, items: items || [] };
        })
      );

      setQualityChecklists(checklistsWithItems as QualityChecklist[]);
    } catch (error) {
      console.error('Error fetching quality checklists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quality checklists",
        variant: "destructive",
      });
    }
  };

  // Create safety checklist
  const createSafetyChecklist = async (
    checklistData: Omit<SafetyChecklist, 'id' | 'created_by' | 'created_at' | 'updated_at'>,
    items: Omit<SafetyChecklistItem, 'id' | 'checklist_id' | 'created_at' | 'updated_at'>[]
  ): Promise<SafetyChecklist | null> => {
    try {
      if (!user?.id) {
        toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
        return null;
      }

      // Create the checklist
      const { data: checklist, error: checklistError } = await supabase
        .from('safety_checklists')
        .insert([{ ...checklistData, created_by: user.id }])
        .select()
        .single();

      if (checklistError) {
        console.error('Error creating safety checklist:', checklistError);
        toast({ title: "Error", description: "Failed to create safety checklist", variant: "destructive" });
        return null;
      }

      // Create the items
      if (items.length > 0) {
        const itemsWithChecklistId = items.map((item, index) => ({
          ...item,
          checklist_id: checklist.id,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('safety_checklist_items')
          .insert(itemsWithChecklistId);

        if (itemsError) {
          console.error('Error creating safety checklist items:', itemsError);
          toast({ title: "Error", description: "Failed to create checklist items", variant: "destructive" });
        }
      }

      toast({ title: "Success", description: "Safety checklist created successfully" });
      await fetchSafetyChecklists();
      return checklist as SafetyChecklist;
    } catch (error) {
      console.error('Error creating safety checklist:', error);
      toast({ title: "Error", description: "Failed to create safety checklist", variant: "destructive" });
      return null;
    }
  };

  // Create quality checklist
  const createQualityChecklist = async (
    checklistData: Omit<QualityChecklist, 'id' | 'created_by' | 'created_at' | 'updated_at'>,
    items: Omit<QualityChecklistItem, 'id' | 'checklist_id' | 'created_at' | 'updated_at'>[]
  ): Promise<QualityChecklist | null> => {
    try {
      if (!user?.id) {
        toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
        return null;
      }

      // Create the checklist
      const { data: checklist, error: checklistError } = await supabase
        .from('quality_checklists')
        .insert([{ ...checklistData, created_by: user.id }])
        .select()
        .single();

      if (checklistError) {
        console.error('Error creating quality checklist:', checklistError);
        toast({ title: "Error", description: "Failed to create quality checklist", variant: "destructive" });
        return null;
      }

      // Create the items
      if (items.length > 0) {
        const itemsWithChecklistId = items.map((item, index) => ({
          ...item,
          checklist_id: checklist.id,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('quality_checklist_items')
          .insert(itemsWithChecklistId);

        if (itemsError) {
          console.error('Error creating quality checklist items:', itemsError);
          toast({ title: "Error", description: "Failed to create checklist items", variant: "destructive" });
        }
      }

      toast({ title: "Success", description: "Quality checklist created successfully" });
      await fetchQualityChecklists();
      return checklist as QualityChecklist;
    } catch (error) {
      console.error('Error creating quality checklist:', error);
      toast({ title: "Error", description: "Failed to create quality checklist", variant: "destructive" });
      return null;
    }
  };

  // Update safety checklist
  const updateSafetyChecklist = async (
    id: string,
    updates: Partial<SafetyChecklist>
  ): Promise<SafetyChecklist | null> => {
    try {
      const { data, error } = await supabase
        .from('safety_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating safety checklist:', error);
        toast({ title: "Error", description: "Failed to update safety checklist", variant: "destructive" });
        return null;
      }

      toast({ title: "Success", description: "Safety checklist updated successfully" });
      await fetchSafetyChecklists();
      return data as SafetyChecklist;
    } catch (error) {
      console.error('Error updating safety checklist:', error);
      toast({ title: "Error", description: "Failed to update safety checklist", variant: "destructive" });
      return null;
    }
  };

  // Update quality checklist
  const updateQualityChecklist = async (
    id: string,
    updates: Partial<QualityChecklist>
  ): Promise<QualityChecklist | null> => {
    try {
      const { data, error } = await supabase
        .from('quality_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating quality checklist:', error);
        toast({ title: "Error", description: "Failed to update quality checklist", variant: "destructive" });
        return null;
      }

      toast({ title: "Success", description: "Quality checklist updated successfully" });
      await fetchQualityChecklists();
      return data as QualityChecklist;
    } catch (error) {
      console.error('Error updating quality checklist:', error);
      toast({ title: "Error", description: "Failed to update quality checklist", variant: "destructive" });
      return null;
    }
  };

  // Delete safety checklist
  const deleteSafetyChecklist = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('safety_checklists')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting safety checklist:', error);
        toast({ title: "Error", description: "Failed to delete safety checklist", variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Safety checklist deleted successfully" });
      await fetchSafetyChecklists();
    } catch (error) {
      console.error('Error deleting safety checklist:', error);
      toast({ title: "Error", description: "Failed to delete safety checklist", variant: "destructive" });
    }
  };

  // Delete quality checklist
  const deleteQualityChecklist = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('quality_checklists')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting quality checklist:', error);
        toast({ title: "Error", description: "Failed to delete quality checklist", variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Quality checklist deleted successfully" });
      await fetchQualityChecklists();
    } catch (error) {
      console.error('Error deleting quality checklist:', error);
      toast({ title: "Error", description: "Failed to delete quality checklist", variant: "destructive" });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchSafetyChecklists(), fetchQualityChecklists()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  return {
    safetyChecklists,
    qualityChecklists,
    loading,
    fetchSafetyChecklists,
    fetchQualityChecklists,
    createSafetyChecklist,
    createQualityChecklist,
    updateSafetyChecklist,
    updateQualityChecklist,
    deleteSafetyChecklist,
    deleteQualityChecklist,
  };
};