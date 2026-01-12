import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface AccessibleLocation {
  id: string;
  name: string;
  address: string | null;
  status: string | null;
  access_level: string;
  drop_points_count: number;
}

interface ClientProject {
  id: string;
  name: string;
  status: string;
  project_type: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

export const useClientPortalData = () => {
  const { currentOrganization, isClientPortalUser, linkedClientId } = useOrganization();
  const [accessibleLocations, setAccessibleLocations] = useState<AccessibleLocation[]>([]);
  const [clientProjects, setClientProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccessibleLocations = async () => {
    if (!currentOrganization?.id) return;

    try {
      // Fetch locations via location_access_grants
      const { data: grants, error } = await supabase
        .from('location_access_grants')
        .select(`
          access_level,
          location_id,
          locations (
            id,
            name,
            address,
            status
          )
        `)
        .eq('granted_organization_id', currentOrganization.id);

      if (error) throw error;

      // Get drop point counts for each location
      const locationIds = grants?.map(g => g.location_id) || [];
      
      let dropPointCounts: Record<string, number> = {};
      if (locationIds.length > 0) {
        const { data: dropPoints } = await supabase
          .from('drop_points')
          .select('location_id')
          .in('location_id', locationIds);
        
        dropPointCounts = (dropPoints || []).reduce((acc, dp) => {
          acc[dp.location_id] = (acc[dp.location_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      const locations: AccessibleLocation[] = (grants || [])
        .filter(g => g.locations)
        .map(g => ({
          id: (g.locations as any).id,
          name: (g.locations as any).name,
          address: (g.locations as any).address,
          status: (g.locations as any).status,
          access_level: g.access_level,
          drop_points_count: dropPointCounts[g.location_id] || 0,
        }));

      setAccessibleLocations(locations);
    } catch (error) {
      console.error('Error fetching accessible locations:', error);
    }
  };

  const fetchClientProjects = async () => {
    if (!linkedClientId) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, project_type, start_date, end_date, description')
        .eq('client_id', linkedClientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientProjects(data || []);
    } catch (error) {
      console.error('Error fetching client projects:', error);
    }
  };

  const fetchAllData = async () => {
    if (!isClientPortalUser) return;
    
    setLoading(true);
    await Promise.all([
      fetchAccessibleLocations(),
      fetchClientProjects(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [currentOrganization?.id, linkedClientId, isClientPortalUser]);

  return {
    accessibleLocations,
    clientProjects,
    loading,
    refetch: fetchAllData,
  };
};
