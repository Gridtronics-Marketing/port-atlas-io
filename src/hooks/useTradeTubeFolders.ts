import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface TradeTubeFolder {
  id: string;
  organization_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  icon: string;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFolderInput {
  name: string;
  description?: string;
  icon?: string;
  parent_id?: string;
}

export interface UpdateFolderInput {
  name?: string;
  description?: string;
  icon?: string;
  parent_id?: string | null;
}

export function useTradeTubeFolders() {
  const [folders, setFolders] = useState<TradeTubeFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  const fetchFolders = async () => {
    if (!currentOrganization?.id) {
      setFolders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tradetube_folders')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFolders((data as TradeTubeFolder[]) || []);
    } catch (error: any) {
      console.error('Error fetching TradeTube folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (input: CreateFolderInput): Promise<TradeTubeFolder | null> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected');
      return null;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('tradetube_folders')
        .insert({
          organization_id: currentOrganization.id,
          name: input.name,
          description: input.description || null,
          icon: input.icon || 'folder',
          parent_id: input.parent_id || null,
          created_by: userData.user?.id,
          sort_order: folders.length
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Folder created successfully');
      await fetchFolders();
      return data as TradeTubeFolder;
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
      return null;
    }
  };

  const updateFolder = async (id: string, updates: UpdateFolderInput): Promise<boolean> => {
    try {
      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.parent_id !== undefined) updateData.parent_id = updates.parent_id;

      const { error } = await supabase
        .from('tradetube_folders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Folder updated successfully');
      await fetchFolders();
      return true;
    } catch (error: any) {
      console.error('Error updating folder:', error);
      toast.error('Failed to update folder');
      return false;
    }
  };

  const reorderFolders = async (folderId: string, targetFolderId: string, position: 'before' | 'after'): Promise<boolean> => {
    try {
      // Get current folder order
      const targetFolder = folders.find(f => f.id === targetFolderId);
      const draggedFolder = folders.find(f => f.id === folderId);
      
      if (!targetFolder || !draggedFolder) return false;

      // Calculate new sort_order
      const newSortOrder = position === 'before' 
        ? targetFolder.sort_order 
        : targetFolder.sort_order + 1;

      // Update dragged folder's sort_order and parent_id to match target's parent
      const { error: updateError } = await supabase
        .from('tradetube_folders')
        .update({ 
          sort_order: newSortOrder,
          parent_id: targetFolder.parent_id 
        })
        .eq('id', folderId);

      if (updateError) throw updateError;

      // Shift other folders
      const foldersToShift = folders.filter(
        f => f.id !== folderId && 
        f.parent_id === targetFolder.parent_id && 
        f.sort_order >= newSortOrder
      );

      for (const folder of foldersToShift) {
        await supabase
          .from('tradetube_folders')
          .update({ sort_order: folder.sort_order + 1 })
          .eq('id', folder.id);
      }

      toast.success('Folders reordered');
      await fetchFolders();
      return true;
    } catch (error: any) {
      console.error('Error reordering folders:', error);
      toast.error('Failed to reorder folders');
      return false;
    }
  };

  const deleteFolder = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tradetube_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Folder deleted successfully');
      await fetchFolders();
      return true;
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
      return false;
    }
  };

  const seedDefaultFolders = async (): Promise<void> => {
    if (!currentOrganization?.id || folders.length > 0) return;

    const defaultFolders = [
      { name: 'How-To Guides', description: 'Step-by-step instructions', icon: 'book-open' },
      { name: 'Onboarding', description: 'New employee training', icon: 'user-plus' },
      { name: 'Equipment & Tools', description: 'Equipment manuals and usage', icon: 'wrench' },
      { name: 'Safety Procedures', description: 'Safety training and protocols', icon: 'shield-check' },
      { name: 'Office Systems', description: 'Admin processes and software', icon: 'building' },
      { name: 'Field Operations', description: 'Field work procedures', icon: 'map-pin' },
    ];

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const foldersToInsert = defaultFolders.map((folder, index) => ({
        organization_id: currentOrganization.id,
        name: folder.name,
        description: folder.description,
        icon: folder.icon,
        sort_order: index,
        created_by: userData.user?.id
      }));

      const { error } = await supabase
        .from('tradetube_folders')
        .insert(foldersToInsert);

      if (error) throw error;
      
      await fetchFolders();
    } catch (error: any) {
      console.error('Error seeding default folders:', error);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [currentOrganization?.id]);

  // Auto-seed default folders when org has none
  useEffect(() => {
    if (!loading && folders.length === 0 && currentOrganization?.id) {
      seedDefaultFolders();
    }
  }, [loading, folders.length, currentOrganization?.id]);

  return {
    folders,
    loading,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders,
    seedDefaultFolders
  };
}
