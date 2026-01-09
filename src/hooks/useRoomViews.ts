import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/uuid-utils';

export interface RoomView {
  id: string;
  location_id: string;
  floor: number;
  x_coordinate: number;
  y_coordinate: number;
  room_name?: string;
  description?: string;
  ceiling_height?: number | null;
  ceiling_height_unit?: string;
  photo_url: string;
  employee_id: string;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
}

export const useRoomViews = (locationId?: string) => {
  const [roomViews, setRoomViews] = useState<RoomView[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoomViews = async () => {
    if (!locationId || !isValidUUID(locationId)) {
      setRoomViews([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('room_views')
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoomViews(data || []);
    } catch (error) {
      console.error('Error fetching room views:', error);
      toast({
        title: "Error",
        description: "Failed to fetch room views",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRoomView = async (roomViewData: Omit<RoomView, 'id' | 'created_at' | 'updated_at' | 'employee'>) => {
    try {
      // Get the organization_id from the parent location
      let orgId = null;
      if (roomViewData.location_id) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('organization_id')
          .eq('id', roomViewData.location_id)
          .single();
        orgId = locationData?.organization_id;
      }

      const { data, error } = await supabase
        .from('room_views')
        .insert({ ...roomViewData, organization_id: orgId })
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      setRoomViews(prev => [data, ...prev]);
      toast({
        title: "Room View Added",
        description: "Room view has been successfully added to the floor plan.",
      });

      return data;
    } catch (error) {
      console.error('Error adding room view:', error);
      toast({
        title: "Error",
        description: "Failed to add room view",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateRoomView = async (id: string, updates: Partial<RoomView>) => {
    try {
      const { data, error } = await supabase
        .from('room_views')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      setRoomViews(prev => prev.map(rv => rv.id === id ? data : rv));
      toast({
        title: "Room View Updated",
        description: "Room view has been updated successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error updating room view:', error);
      toast({
        title: "Error",
        description: "Failed to update room view",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteRoomView = async (id: string) => {
    try {
      const { error } = await supabase
        .from('room_views')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRoomViews(prev => prev.filter(rv => rv.id !== id));
      toast({
        title: "Room View Deleted",
        description: "Room view has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting room view:', error);
      toast({
        title: "Error",
        description: "Failed to delete room view",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchRoomViews();
  }, [locationId]);

  return {
    roomViews,
    loading,
    fetchRoomViews,
    addRoomView,
    updateRoomView,
    deleteRoomView,
  };
};