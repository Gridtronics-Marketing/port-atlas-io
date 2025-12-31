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
  // Access grant info
  is_granted?: boolean;
  granted_by_org?: {
    id: string;
    name: string;
  };
  access_level?: 'view' | 'edit' | 'full';
}

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { organizationId } = useOrganizationData();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      // Fetch owned locations
      let ownedQuery = supabase
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
        ownedQuery = ownedQuery.eq('organization_id', organizationId);
      }

      const { data: ownedData, error: ownedError } = await ownedQuery;
      if (ownedError) throw ownedError;

      // Fetch granted locations (locations shared with this organization)
      let grantedLocations: Location[] = [];
      if (organizationId) {
        const { data: grants, error: grantsError } = await supabase
          .from('location_access_grants')
          .select('location_id, access_level')
          .eq('granted_organization_id', organizationId);

        if (!grantsError && grants && grants.length > 0) {
          const grantedLocationIds = grants.map(g => g.location_id);
          const accessMap = new Map(grants.map(g => [g.location_id, g.access_level]));

          const { data: grantedData, error: grantedError } = await supabase
            .from('locations')
            .select(`
              *,
              client:clients(name),
              project:projects(
                name,
                client:clients(name)
              )
            `)
            .in('id', grantedLocationIds)
            .order('created_at', { ascending: false });

          if (!grantedError && grantedData) {
            // Fetch owner organization names
            const ownerOrgIds = [...new Set(grantedData.map(l => l.organization_id).filter(Boolean))];
            const { data: orgs } = await supabase
              .from('organizations')
              .select('id, name')
              .in('id', ownerOrgIds);

            const orgMap = new Map((orgs || []).map(o => [o.id, o]));

            grantedLocations = grantedData.map(location => ({
              ...location,
              status: location.status as Location['status'],
              floor_plan_files: location.floor_plan_files as { [floorNumber: number]: string } | undefined,
              is_granted: true,
              granted_by_org: location.organization_id ? orgMap.get(location.organization_id) : undefined,
              access_level: accessMap.get(location.id) as 'view' | 'edit' | 'full',
            })) as Location[];
          }
        }
      }

      // Combine owned and granted locations
      const allLocations: Location[] = [
        ...(ownedData || []).map(l => ({ 
          ...l, 
          status: l.status as Location['status'],
          floor_plan_files: l.floor_plan_files as { [floorNumber: number]: string } | undefined,
          is_granted: false 
        })) as Location[],
        ...grantedLocations
      ];
      
      // Get drop points count for each location
      const locationsWithCounts = await Promise.all(
        allLocations.map(async (location) => {
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
        .insert([{ ...locationData, organization_id: organizationId }])
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

  // Check if current org is the owner of a location
  const isLocationOwner = (location: Location) => {
    return location.organization_id === organizationId;
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
    isLocationOwner,
  };
};
