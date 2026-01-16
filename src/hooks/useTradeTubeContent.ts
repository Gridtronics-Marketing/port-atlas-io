import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { compressImage, CompressionResult } from '@/lib/image-compression';

export type MediaType = 'video' | 'audio' | 'document' | 'image' | 'voice_note';

export interface TradeTubeContent {
  id: string;
  organization_id: string;
  folder_id: string | null;
  title: string;
  description: string | null;
  media_type: MediaType;
  file_url: string;
  thumbnail_url: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  tags: string[];
  view_count: number;
  is_featured: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContentInput {
  title: string;
  description?: string;
  media_type: MediaType;
  file_url: string;
  thumbnail_url?: string;
  file_size?: number;
  duration_seconds?: number;
  tags?: string[];
  folder_id?: string;
  is_featured?: boolean;
}

export interface ContentFilters {
  folderId?: string | null;
  mediaType?: MediaType | null;
  searchQuery?: string;
  sortBy?: 'newest' | 'oldest' | 'most_viewed' | 'alphabetical';
}

export function useTradeTubeContent(filters?: ContentFilters) {
  const [content, setContent] = useState<TradeTubeContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  const fetchContent = async () => {
    if (!currentOrganization?.id) {
      setContent([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('tradetube_content')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      // Apply filters
      if (filters?.folderId) {
        query = query.eq('folder_id', filters.folderId);
      }
      
      if (filters?.mediaType) {
        query = query.eq('media_type', filters.mediaType);
      }

      if (filters?.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most_viewed':
          query = query.order('view_count', { ascending: false });
          break;
        case 'alphabetical':
          query = query.order('title', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setContent((data as TradeTubeContent[]) || []);
    } catch (error: any) {
      console.error('Error fetching TradeTube content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const createContent = async (input: CreateContentInput): Promise<TradeTubeContent | null> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected');
      return null;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('tradetube_content')
        .insert({
          organization_id: currentOrganization.id,
          title: input.title,
          description: input.description || null,
          media_type: input.media_type,
          file_url: input.file_url,
          thumbnail_url: input.thumbnail_url || null,
          file_size: input.file_size || null,
          duration_seconds: input.duration_seconds || null,
          tags: input.tags || [],
          folder_id: input.folder_id || null,
          is_featured: input.is_featured || false,
          created_by: userData.user?.id,
          sort_order: content.length
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Content uploaded successfully');
      await fetchContent();
      return data as TradeTubeContent;
    } catch (error: any) {
      console.error('Error creating content:', error);
      toast.error('Failed to upload content');
      return null;
    }
  };

  const updateContent = async (id: string, updates: Partial<CreateContentInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tradetube_content')
        .update({
          title: updates.title,
          description: updates.description,
          tags: updates.tags,
          folder_id: updates.folder_id,
          is_featured: updates.is_featured,
          thumbnail_url: updates.thumbnail_url
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Content updated successfully');
      await fetchContent();
      return true;
    } catch (error: any) {
      console.error('Error updating content:', error);
      toast.error('Failed to update content');
      return false;
    }
  };

  const deleteContent = async (id: string): Promise<boolean> => {
    try {
      // Get the content to find the file URL
      const contentItem = content.find(c => c.id === id);
      
      // Delete from database
      const { error } = await supabase
        .from('tradetube_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Try to delete from storage (non-blocking)
      if (contentItem?.file_url) {
        const filePath = contentItem.file_url.split('/tradetube-media/')[1];
        if (filePath) {
          await supabase.storage.from('tradetube-media').remove([filePath]);
        }
      }
      
      toast.success('Content deleted successfully');
      await fetchContent();
      return true;
    } catch (error: any) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
      return false;
    }
  };

  const recordView = async (contentId: string): Promise<void> => {
    if (!currentOrganization?.id) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Insert view record
      await supabase
        .from('tradetube_views')
        .insert({
          content_id: contentId,
          user_id: userData.user?.id,
          organization_id: currentOrganization.id
        });

      // Increment view count directly
      const currentItem = content.find(c => c.id === contentId);
      await supabase
        .from('tradetube_content')
        .update({ view_count: (currentItem?.view_count || 0) + 1 })
        .eq('id', contentId);
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const uploadFile = async (
    file: File, 
    mediaType: MediaType,
    onCompressionComplete?: (result: CompressionResult) => void
  ): Promise<string | null> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected');
      return null;
    }

    try {
      let fileToUpload = file;

      // Compress images before upload
      if (mediaType === 'image') {
        const compressionResult = await compressImage(file, {
          maxWidth: 2000,
          maxHeight: 2000,
          quality: 0.85
        });
        fileToUpload = compressionResult.file;
        onCompressionComplete?.(compressionResult);
      }

      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const folderPath = mediaType === 'voice_note' ? 'audio' : `${mediaType}s`;
      const filePath = `${currentOrganization.id}/${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tradetube-media')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tradetube-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      return null;
    }
  };

  useEffect(() => {
    fetchContent();
  }, [currentOrganization?.id, filters?.folderId, filters?.mediaType, filters?.searchQuery, filters?.sortBy]);

  return {
    content,
    loading,
    fetchContent,
    createContent,
    updateContent,
    deleteContent,
    recordView,
    uploadFile
  };
}
