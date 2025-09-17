import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Geolocation } from '@capacitor/geolocation';

export interface TimeEntry {
  id: string;
  employee_id: string;
  project_id?: string;
  location_id?: string;
  work_order_id?: string;
  check_in_time: string;
  check_out_time?: string;
  check_in_location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  check_out_location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  total_hours?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useTimeTracking(employeeId?: string) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const { toast } = useToast();

  const checkLocationPermission = async () => {
    try {
      const permission = await Geolocation.checkPermissions();
      setLocationEnabled(permission.location === 'granted');
      
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        setLocationEnabled(requested.location === 'granted');
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationEnabled(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!locationEnabled) return null;
    
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      
      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: 'Location Error',
        description: 'Could not get current location',
        variant: 'destructive',
      });
      return null;
    }
  };

  const fetchTimeEntries = async () => {
    if (!employeeId) return;
    
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform daily_logs to time entries format
      const entries = data?.map(log => ({
        id: log.id,
        employee_id: log.employee_id,
        project_id: log.project_id,
        location_id: log.location_id,
        work_order_id: log.work_order_id,
        check_in_time: log.created_at,
        check_out_time: log.updated_at !== log.created_at ? log.updated_at : undefined,
        total_hours: log.hours_worked,
        notes: log.work_description,
        created_at: log.created_at,
        updated_at: log.updated_at,
      })) || [];
      
      setTimeEntries(entries);
      
      // Check if there's an active entry (no check_out_time)
      const active = entries.find(entry => !entry.check_out_time);
      setCurrentEntry(active || null);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch time entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async (projectId?: string, locationId?: string, workOrderId?: string) => {
    if (!employeeId) {
      toast({
        title: 'Error',
        description: 'Employee ID is required',
        variant: 'destructive',
      });
      return;
    }

    if (currentEntry) {
      toast({
        title: 'Already Checked In',
        description: 'You must check out before checking in again',
        variant: 'destructive',
      });
      return;
    }

    try {
      const location = await getCurrentLocation();
      
      const { data, error } = await supabase
        .from('daily_logs')
        .insert([{
          employee_id: employeeId,
          project_id: projectId,
          location_id: locationId,
          work_order_id: workOrderId,
          log_date: new Date().toISOString().split('T')[0],
          work_description: 'Checked in',
          hours_worked: 0,
        }])
        .select()
        .single();

      if (error) throw error;

      const newEntry: TimeEntry = {
        id: data.id,
        employee_id: employeeId,
        project_id: projectId,
        location_id: locationId,
        work_order_id: workOrderId,
        check_in_time: data.created_at,
        check_in_location: location || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setCurrentEntry(newEntry);
      setTimeEntries(prev => [newEntry, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Checked in successfully',
      });
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: 'Error',
        description: 'Failed to check in',
        variant: 'destructive',
      });
    }
  };

  const checkOut = async (notes?: string) => {
    if (!currentEntry) {
      toast({
        title: 'Error',
        description: 'No active check-in found',
        variant: 'destructive',
      });
      return;
    }

    try {
      const location = await getCurrentLocation();
      const checkOutTime = new Date();
      const checkInTime = new Date(currentEntry.check_in_time);
      const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      const { data, error } = await supabase
        .from('daily_logs')
        .update({
          hours_worked: totalHours,
          work_description: notes || currentEntry.notes,
          updated_at: checkOutTime.toISOString(),
        })
        .eq('id', currentEntry.id)
        .select()
        .single();

      if (error) throw error;

      const updatedEntry: TimeEntry = {
        ...currentEntry,
        check_out_time: checkOutTime.toISOString(),
        check_out_location: location || undefined,
        total_hours: totalHours,
        notes: notes || currentEntry.notes,
        updated_at: data.updated_at,
      };

      setCurrentEntry(null);
      setTimeEntries(prev => 
        prev.map(entry => entry.id === currentEntry.id ? updatedEntry : entry)
      );
      
      toast({
        title: 'Success',
        description: `Checked out successfully. Total time: ${totalHours.toFixed(2)} hours`,
      });
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: 'Error',
        description: 'Failed to check out',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    checkLocationPermission();
    fetchTimeEntries();
  }, [employeeId]);

  return {
    timeEntries,
    currentEntry,
    loading,
    locationEnabled,
    checkIn,
    checkOut,
    refetch: fetchTimeEntries,
  };
}