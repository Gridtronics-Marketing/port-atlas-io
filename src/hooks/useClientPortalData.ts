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
  const { isClientPortalUser, linkedClientId, clientPortalAccess } = useOrganization();
  const [accessibleLocations, setAccessibleLocations] = useState<AccessibleLocation[]>([]);
  const [clientProjects, setClientProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccessibleLocations = async () => {
    if (!linkedClientId) return;

    try {
      // Fetch locations via location_access_grants for this client
      // Note: location_access_grants might use granted_organization_id or granted_client_id
      // depending on implementation - check for client-based grants first
      const { data: grants, error } = await supabase
        .from('location_access_grants')
        .select('access_level, location_id')
        .or(`granted_client_id.eq.${linkedClientId}`);

      if (error) throw error;
      
      // Get location details separately
      const locationIds = grants?.map(g => g.location_id) || [];
      if (locationIds.length === 0) {
        setAccessibleLocations([]);
        return;
      }

      const { data: locations } = await supabase
        .from('locations')
        .select('id, name, address, status')
        .in('id', locationIds);

      // Get drop point counts for each location
      let dropPointCounts: Record<string, number> = {};
      const { data: dropPoints } = await supabase
        .from('drop_points')
        .select('location_id')
        .in('location_id', locationIds);
      
      dropPointCounts = (dropPoints || []).reduce((acc, dp) => {
        acc[dp.location_id] = (acc[dp.location_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Build access level map from grants
      const accessLevelMap = (grants || []).reduce((acc, g) => {
        acc[g.location_id] = g.access_level;
        return acc;
      }, {} as Record<string, string>);

      const accessibleLocs: AccessibleLocation[] = (locations || []).map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        status: loc.status,
        access_level: accessLevelMap[loc.id] || 'view',
        drop_points_count: dropPointCounts[loc.id] || 0,
      }));

      setAccessibleLocations(accessibleLocs);
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
    if (!isClientPortalUser || !linkedClientId) return;
    
    setLoading(true);
    await Promise.all([
      fetchAccessibleLocations(),
      fetchClientProjects(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [linkedClientId, isClientPortalUser]);

  return {
    accessibleLocations,
    clientProjects,
    loading,
    clientName: clientPortalAccess?.clientName || null,
    clientRole: clientPortalAccess?.role || null,
    refetch: fetchAllData,
  };
};