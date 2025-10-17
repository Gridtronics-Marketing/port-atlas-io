import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RoomViewPhoto {
  id: string;
  room_view_id: string;
  photo_url: string;
  description?: string;
  employee_id?: string;
  photo_type?: 'standard' | 'panoramic';
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
}

export const useRoomViewPhotos = (roomViewId?: string) => {
  const [photos, setPhotos] = useState<RoomViewPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPhotos = async () => {
    if (!roomViewId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('room_view_photos')
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .eq('room_view_id', roomViewId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos((data || []) as RoomViewPhoto[]);
    } catch (error) {
      console.error('Error fetching room view photos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch photos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPhoto = async (photoData: Omit<RoomViewPhoto, 'id' | 'created_at' | 'updated_at' | 'employee'> & { employee_id?: string | null }) => {
    try {
      // Validate that room_view exists before inserting
      const { data: roomViewExists, error: checkError } = await supabase
        .from('room_views')
        .select('id')
        .eq('id', photoData.room_view_id)
        .single();

      if (checkError || !roomViewExists) {
        throw new Error('Room view not found. It may have been deleted.');
      }

      const { data, error } = await supabase
        .from('room_view_photos')
        .insert(photoData)
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      setPhotos(prev => [data as RoomViewPhoto, ...prev]);
      toast({
        title: "Photo Added",
        description: "Photo has been successfully added to the room view.",
      });

      return data;
    } catch (error) {
      console.error('Error adding room view photo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add photo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePhoto = async (id: string, updates: Partial<RoomViewPhoto>) => {
    try {
      const { data, error } = await supabase
        .from('room_view_photos')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      setPhotos(prev => prev.map(photo => photo.id === id ? data as RoomViewPhoto : photo));
      toast({
        title: "Photo Updated",
        description: "Photo has been updated successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error updating room view photo:', error);
      toast({
        title: "Error",
        description: "Failed to update photo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePhoto = async (id: string, photoUrl: string) => {
    try {
      // Delete from database first
      const { error: dbError } = await supabase
        .from('room_view_photos')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Delete from storage if it's a Supabase storage URL
      if (photoUrl.includes('supabase')) {
        const fileName = photoUrl.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('room-views')
            .remove([fileName]);
          
          if (storageError) {
            console.warn('Error deleting from storage:', storageError);
          }
        }
      }

      setPhotos(prev => prev.filter(photo => photo.id !== id));
      toast({
        title: "Photo Deleted",
        description: "Photo has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting room view photo:', error);
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [roomViewId]);

  return {
    photos,
    loading,
    fetchPhotos,
    addPhoto,
    updatePhoto,
    deletePhoto,
  };
};