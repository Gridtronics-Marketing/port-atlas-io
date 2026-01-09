import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/uuid-utils';

const FETCH_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

export interface DropPoint {
  id: string;
  location_id: string;
  label: string;
  room: string | null;
  floor: number | null;
  point_type: 'data' | 'fiber' | 'security' | 'wireless' | 'power';
  x_coordinate: number | null;
  y_coordinate: number | null;
  status: 'planned' | 'roughed_in' | 'finished' | 'tested';
  cable_id: string | null;
  cable_count: number;
  patch_panel_port: string | null;
  switch_port: string | null;
  vlan: string | null;
  ip_address: string | null;
  mac_address: string | null;
  test_results: Record<string, any> | null;
  notes: string | null;
  installed_by: string | null;
  installed_date: string | null;
  tested_by: string | null;
  tested_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  installer?: {
    first_name: string;
    last_name: string;
  };
  tester?: {
    first_name: string;
    last_name: string;
  };
}

export const useDropPoints = (locationId?: string) => {
  const [dropPoints, setDropPoints] = useState<DropPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Timeout wrapper for fetch operations
  const withTimeout = useCallback(<T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  }, []);

  // Retry logic with exponential backoff
  const retryFetch = useCallback(async <T,>(
    fn: () => Promise<T>,
    retries: number = MAX_RETRIES
  ): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return retryFetch(fn, retries - 1);
      }
      throw err;
    }
  }, []);

  const fetchDropPoints = useCallback(async () => {
    if (locationId && !isValidUUID(locationId)) {
      setDropPoints([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Emit telemetry event
      window.dispatchEvent(new CustomEvent('droppoint_fetch_start', {
        detail: { locationId, timestamp: Date.now() }
      }));

      const fetchOperation = async () => {
        let query = supabase
          .from('drop_points')
          .select(`
            *,
            installer:employees!drop_points_installed_by_fkey(first_name, last_name),
            tester:employees!drop_points_tested_by_fkey(first_name, last_name)
          `);

        if (locationId) {
          query = query.eq('location_id', locationId);
        }

        return query.order('label', { ascending: true });
      };

      // Apply timeout and retry logic
      const { data, error: queryError } = await withTimeout(
        retryFetch(fetchOperation),
        FETCH_TIMEOUT_MS
      );

      if (queryError) throw queryError;

      // Validate response shape
      if (!Array.isArray(data)) {
        console.warn('Invalid response shape for drop points:', data);
        setDropPoints([]);
      } else {
        // Defensive mapping with safe defaults
        const validatedData = data.map(point => ({
          ...point,
          label: point.label || 'TBD',
          room: point.room ?? null,
          floor: point.floor ?? null,
          cable_count: point.cable_count ?? 0,
          notes: point.notes ?? null,
          test_results: point.test_results ?? null,
        })) as DropPoint[];
        
        setDropPoints(validatedData);
      }

      // Emit success event
      window.dispatchEvent(new CustomEvent('droppoint_fetch_success', {
        detail: { 
          locationId, 
          count: data?.length || 0,
          latency_ms: Date.now() - performance.now(),
        }
      }));

    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch drop points';
      console.error('Error fetching drop points:', err);
      
      setError(errorMessage);
      setDropPoints([]);

      // Emit error event
      window.dispatchEvent(new CustomEvent('droppoint_fetch_error', {
        detail: { 
          locationId, 
          error_code: err?.code,
          error: errorMessage,
        }
      }));

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [locationId, toast, withTimeout, retryFetch]);

  const addDropPoint = async (dropPointData: Omit<DropPoint, 'id' | 'created_at' | 'updated_at' | 'installer' | 'tester'>) => {
    try {
      // Get the organization_id from the parent location
      let orgId = null;
      if (dropPointData.location_id) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('organization_id')
          .eq('id', dropPointData.location_id)
          .single();
        orgId = locationData?.organization_id;
      }

      const { data, error } = await supabase
        .from('drop_points')
        .insert([{ ...dropPointData, organization_id: orgId }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchDropPoints(); // Refresh to get joined data
      toast({
        title: "Success",
        description: "Drop point added successfully",
      });
      return data;
    } catch (error) {
      console.error('Error adding drop point:', error);
      toast({
        title: "Error",
        description: "Failed to add drop point",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDropPoint = async (id: string, updates: Partial<DropPoint>) => {
    try {
      const { data, error } = await supabase
        .from('drop_points')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchDropPoints(); // Refresh to get updated data
      toast({
        title: "Success",
        description: "Drop point updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating drop point:', error);
      toast({
        title: "Error",
        description: "Failed to update drop point",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDropPoint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('drop_points')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDropPoints(prev => prev.filter(dropPoint => dropPoint.id !== id));
      toast({
        title: "Success",
        description: "Drop point deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting drop point:', error);
      toast({
        title: "Error",
        description: "Failed to delete drop point",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchDropPoints();
  }, [locationId]);

  return {
    dropPoints,
    loading,
    error,
    fetchDropPoints,
    addDropPoint,
    updateDropPoint,
    deleteDropPoint,
  };
};