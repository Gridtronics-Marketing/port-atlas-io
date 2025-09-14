import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Location {
  id: string;
  project_id: string | null;
  name: string;
  address: string;
  building_type: string | null;
  floors: number;
  total_square_feet: number | null;
  access_instructions: string | null;
  contact_onsite: string | null;
  contact_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'Active' | 'In Progress' | 'Completed' | 'On Hold';
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  // Joined data
  project?: {
    name: string;
    client?: {
      name: string;
    };
  };
  drop_points_count?: number;
}

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          project:projects(
            name,
            client:clients(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get drop points count for each location
      const locationsWithCounts = await Promise.all(
        (data || []).map(async (location) => {
          const { count } = await supabase
            .from('drop_points')
            .select('*', { count: 'exact', head: true })
            .eq('location_id', location.id);
          
          return {
            ...location,
            drop_points_count: count || 0,
          };
        })
      );

      setLocations(locationsWithCounts as Location[]);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async (locationData: Omit<Location, 'id' | 'created_at' | 'updated_at' | 'drop_points_count'>) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert([locationData])
        .select()
        .single();

      if (error) throw error;
      
      await fetchLocations(); // Refresh to get joined data
      toast({
        title: "Success",
        description: "Location added successfully",
      });
      return data;
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        title: "Error",
        description: "Failed to add location",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateLocation = async (id: string, updates: Partial<Location>) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchLocations(); // Refresh to get updated data
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setLocations(prev => prev.filter(location => location.id !== id));
      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return {
    locations,
    loading,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
  };
};