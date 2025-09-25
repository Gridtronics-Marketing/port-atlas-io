import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NetworkDevice {
  id: string;
  location_id: string;
  device_name: string;
  device_type: 'switch' | 'router' | 'server' | 'access_point' | 'voip_phone' | 'camera' | 'firewall' | 'ups' | 'patch_panel';
  ip_address?: string;
  mac_address?: string;
  poe_status: 'enabled' | 'disabled' | 'auto';
  port_count: number;
  rack_id?: string;
  rack_position?: number;
  device_details: any;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  firmware_version?: string;
  management_url?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  created_at: string;
  updated_at: string;
}

export const useNetworkDevices = (locationId?: string) => {
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDevices = async () => {
    try {
      setLoading(true);
      let query = supabase.from('network_devices').select('*');
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query.order('device_name', { ascending: true });
      
      if (error) throw error;
      setDevices((data as NetworkDevice[]) || []);
    } catch (error) {
      console.error('Error fetching network devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch network devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDevice = async (deviceData: Omit<NetworkDevice, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('network_devices')
        .insert([deviceData])
        .select()
        .single();
      
      if (error) throw error;
      await fetchDevices();
      
      toast({
        title: "Success",
        description: "Network device added successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding network device:', error);
      toast({
        title: "Error",
        description: "Failed to add network device",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDevice = async (id: string, updates: Partial<NetworkDevice>) => {
    try {
      const { data, error } = await supabase
        .from('network_devices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchDevices();
      
      toast({
        title: "Success",
        description: "Network device updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating network device:', error);
      toast({
        title: "Error",
        description: "Failed to update network device",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDevice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('network_devices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchDevices();
      
      toast({
        title: "Success",
        description: "Network device deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting network device:', error);
      toast({
        title: "Error",
        description: "Failed to delete network device",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [locationId]);

  return {
    devices,
    loading,
    fetchDevices,
    addDevice,
    updateDevice,
    deleteDevice
  };
};