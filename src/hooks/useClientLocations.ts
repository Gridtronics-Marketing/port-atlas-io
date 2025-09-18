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
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          project:projects!inner(
            name,
            client_id,
            client:clients(name)
          )
        `)
        .eq('project.client_id', clientId)
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