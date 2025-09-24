import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DropPointPhoto {
  id: string;
  employee_id: string;
  location_id: string;
  log_date: string;
  work_description: string;
  photos: string[];
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
}

export const useDropPointPhotos = (locationId?: string) => {
  const [photos, setPhotos] = useState<DropPointPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPhotos = async () => {
    if (!locationId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching photos for location:', locationId);
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select(`
          id,
          employee_id,
          location_id,
          log_date,
          work_description,
          photos,
          created_at,
          employee:employees(first_name, last_name)
        `)
        .eq('location_id', locationId)
        .not('photos', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Raw photo data from database:', data);

      // Filter out entries with empty photos arrays
      const filteredData = (data || []).filter(
        (entry: any) => entry.photos && Array.isArray(entry.photos) && entry.photos.length > 0
      ) as DropPointPhoto[];

      console.log('Filtered photos:', filteredData);
      setPhotos(filteredData);
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

  const deletePhoto = async (logId: string, photoIndex: number) => {
    try {
      const log = photos.find(p => p.id === logId);
      if (!log || !log.photos || photoIndex >= log.photos.length) {
        throw new Error('Photo not found');
      }

      const photoUrl = log.photos[photoIndex];
      const updatedPhotos = log.photos.filter((_, index) => index !== photoIndex);

      const { error } = await supabase
        .from('daily_logs')
        .update({ photos: updatedPhotos })
        .eq('id', logId);

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

      // Refresh the photos list
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