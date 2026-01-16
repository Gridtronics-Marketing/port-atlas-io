import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Location } from './useLocations';

export const useClientLocations = (clientId?: string) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClientLocations = async () => {
    if (!clientId) {
      setLocations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching locations for client:', clientId);

      // Query 1: Direct client_id match
      const { data: directLocations, error: directError } = await supabase
        .from('locations')
        .select(`
          *,
          client:clients(name),
          project:projects(
            name,
            client_id,
            client:clients(name)
          )
        `)
        .eq('client_id', clientId)
        .order('name', { ascending: true });

      if (directError) {
        console.error('Error fetching direct locations:', directError);
        throw directError;
      }

      // Query 2: Via project relationship (only locations without direct client_id)
      const { data: projectLocations, error: projectError } = await supabase
        .from('locations')
        .select(`
          *,
          client:clients(name),
          project:projects!inner(
            name,
            client_id,
            client:clients(name)
          )
        `)
        .eq('project.client_id', clientId)
        .is('client_id', null)
        .order('name', { ascending: true });

      if (projectError) {
        console.error('Error fetching project locations:', projectError);
        throw projectError;
      }

      // Merge results and remove duplicates
      const allLocationIds = new Set();
      const mergedLocations = [
        ...(directLocations || []),
        ...(projectLocations || [])
      ].filter(location => {
        if (allLocationIds.has(location.id)) {
          return false;
        }
        allLocationIds.add(location.id);
        return true;
      });

      console.log('Found locations:', mergedLocations.length);
      
      // Get drop points count for each location
      const locationsWithCounts = await Promise.all(
        mergedLocations.map(async (location) => {
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
      console.error('Error fetching client locations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch locations for this client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientLocations();
  }, [clientId]);

  return {
    locations,
    loading,
    refetch: fetchClientLocations,
  };
};