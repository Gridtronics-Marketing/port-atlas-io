import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationData } from '@/hooks/useOrganizationData';

export interface Location {
  id: string;
  project_id: string | null;
  client_id: string | null;
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
  floor_plan_files?: { [floorNumber: number]: string };
  organization_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: {
    name: string;
  };
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
  const { organizationId } = useOrganizationData();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('locations')
        .select(`
          *,
          client:clients(name),
          project:projects(
            name,
            client:clients(name)
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by organization if one is selected
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

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

  // Helper function to create location access grant for client portal
  const createLocationAccessGrant = async (locationId: string, clientId: string) => {
    try {
      // Get the client's linked organization (portal org)
      const { data: client } = await supabase
        .from('clients')
        .select('linked_organization_id')
        .eq('id', clientId)
        .single();

      if (client?.linked_organization_id) {
        // Grant view access to this location for the client's organization
        const { data: user } = await supabase.auth.getUser();
        await supabase
          .from('location_access_grants')
          .upsert({
            location_id: locationId,
            granted_organization_id: client.linked_organization_id,
            location_organization_id: organizationId,
            access_level: 'view',
            granted_by: user?.user?.id
          }, {
            onConflict: 'location_id,granted_organization_id'
          });
      }
    } catch (error) {
      console.error('Error creating location access grant:', error);
      // Don't throw - this is a non-critical operation
    }
  };

  const addLocation = async (locationData: Omit<Location, 'id' | 'created_at' | 'updated_at' | 'drop_points_count'>) => {
    // Validate organization is selected before adding
    if (!organizationId) {
      toast({
        title: "Organization Required",
        description: "Please select an organization before adding a location.",
        variant: "destructive",
      });
      throw new Error("No organization selected");
    }

    try {
      const { data, error } = await supabase
        .from('locations')
        .insert([{ ...locationData, organization_id: organizationId }])
        .select()
        .single();

      if (error) throw error;
      
      // Create access grant if client has a portal
      if (data && locationData.client_id) {
        await createLocationAccessGrant(data.id, locationData.client_id);
      }
      
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
      
      // Create/update access grant if client_id changed and client has a portal
      if (data && updates.client_id) {
        await createLocationAccessGrant(id, updates.client_id);
      }
      
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
  }, [organizationId]);

  return {
    locations,
    loading,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
  };
};
