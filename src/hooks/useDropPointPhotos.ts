import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DropPointPhoto {
  id: string;
  drop_point_id: string;
  photo_url: string;
  description?: string;
  employee_id?: string;
  photo_type?: 'standard' | 'panoramic';
  annotation_data?: string;
  annotation_metadata?: Record<string, any>;
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
      
      // Filter by specific drop point or all drop points in a location
      if (dropPointId) {
        const { data, error } = await supabase
          .from('drop_point_photos')
          .select('*')
          .eq('drop_point_id', dropPointId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch related data separately to avoid join issues
        const enrichedData = await Promise.all((data || []).map(async (photo: any) => {
          let employee = undefined;
          let drop_point = undefined;

          // Fetch employee data if employee_id exists
          if (photo.employee_id) {
            const { data: empData } = await supabase
              .from('employees')
              .select('first_name, last_name')
              .eq('id', photo.employee_id)
              .single();
            employee = empData;
          }

          // Fetch drop point data
          const { data: dpData } = await supabase
            .from('drop_points')
            .select('label, room, point_type')
            .eq('id', photo.drop_point_id)
            .single();
          drop_point = dpData;

          return {
            ...photo,
            employee,
            drop_point
          };
        }));

        setPhotos(enrichedData);
      } else if (locationId) {
        // Get all photos for drop points in this location
        const { data: dropPoints } = await supabase
          .from('drop_points')
          .select('id')
          .eq('location_id', locationId);
        
        if (dropPoints && dropPoints.length > 0) {
          const dropPointIds = dropPoints.map(dp => dp.id);
          
          const { data, error } = await supabase
            .from('drop_point_photos')
            .select('*')
            .in('drop_point_id', dropPointIds)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Fetch related data separately
          const enrichedData = await Promise.all((data || []).map(async (photo: any) => {
            let employee = undefined;
            let drop_point = undefined;

            // Fetch employee data if employee_id exists
            if (photo.employee_id) {
              const { data: empData } = await supabase
                .from('employees')
                .select('first_name, last_name')
                .eq('id', photo.employee_id)
                .single();
              employee = empData;
            }

            // Fetch drop point data
            const { data: dpData } = await supabase
              .from('drop_points')
              .select('label, room, point_type')
              .eq('id', photo.drop_point_id)
              .single();
            drop_point = dpData;

            return {
              ...photo,
              employee,
              drop_point
            };
          }));

          setPhotos(enrichedData);
        } else {
          setPhotos([]);
        }
      } else {
        setPhotos([]);
      }
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

  const addPhoto = async (photoData: {
    drop_point_id: string;
    photo_url: string;
    description?: string;
    employee_id?: string;
    photo_type?: 'standard' | 'panoramic';
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
    photo_url?: string;
    description?: string;
    annotation_data?: string;
    annotation_metadata?: Record<string, any>;
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

      // Delete from storage - photoUrl is now a relative path or legacy full URL
      if (photoUrl && !photoUrl.startsWith('http')) {
        // New format: relative path — need to know the bucket
        // Try both buckets since we may not have storage_bucket info here
        const { error: storageError } = await supabase.storage
          .from('floor-plans')
          .remove([photoUrl]);
        if (storageError) {
          // Try the other bucket
          await supabase.storage.from('room-views').remove([photoUrl]);
        }
      } else if (photoUrl?.includes('supabase')) {
        const fileName = photoUrl.split('/').pop()?.split('?')[0];
        if (fileName) {
          await supabase.storage.from('floor-plans').remove([fileName]);
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

  useEffect(() => {
    fetchPhotos();
  }, [dropPointId, locationId]);

  return {
    photos,
    loading,
    refetch: fetchPhotos,
    addPhoto,
    updatePhoto,
    deletePhoto,
  };
};