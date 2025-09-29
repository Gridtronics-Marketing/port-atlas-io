import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DropPointPhoto {
  id: string;
  drop_point_id: string;
  photo_url: string;
  description?: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
  drop_point?: {
    label: string;
    room?: string;
    point_type?: string;
  };
}

export const useDropPointPhotos = (dropPointId?: string, locationId?: string) => {
  const [photos, setPhotos] = useState<DropPointPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('drop_point_photos')
        .select(`
          id,
          drop_point_id,
          photo_url,
          description,
          employee_id,
          created_at,
          updated_at,
          employee:employees(first_name, last_name),
          drop_point:drop_points(label, room, point_type)
        `);

      // Filter by specific drop point or all drop points in a location
      if (dropPointId) {
        query = query.eq('drop_point_id', dropPointId);
      } else if (locationId) {
        // Get all photos for drop points in this location
        const { data: dropPoints } = await supabase
          .from('drop_points')
          .select('id')
          .eq('location_id', locationId);
        
        if (dropPoints && dropPoints.length > 0) {
          const dropPointIds = dropPoints.map(dp => dp.id);
          query = query.in('drop_point_id', dropPointIds);
        } else {
          setPhotos([]);
          setLoading(false);
          return;
        }
      } else {
        setPhotos([]);
        setLoading(false);
        return;
      }

      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;

      if (error) throw error;

      console.log('Drop point photos data:', data);
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching drop point photos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch photos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [locationId]);

  const addPhoto = async (photoData: {
    drop_point_id: string;
    photo_url: string;
    description?: string;
    employee_id?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('drop_point_photos')
        .insert([photoData]);

      if (error) throw error;

      await fetchPhotos();
      
      toast({
        title: "Photo Added",
        description: "Photo has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding drop point photo:', error);
      toast({
        title: "Error",
        description: "Failed to add photo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePhoto = async (id: string, updates: {
    description?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('drop_point_photos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchPhotos();
      
      toast({
        title: "Photo Updated",
        description: "Photo has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating drop point photo:', error);
      toast({
        title: "Error",
        description: "Failed to update photo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      const { error } = await supabase
        .from('drop_point_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

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

      await fetchPhotos();
      
      toast({
        title: "Photo Deleted",
        description: "Photo has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting drop point photo:', error);
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    photos,
    loading,
    refetch: fetchPhotos,
    deletePhoto,
  };
};