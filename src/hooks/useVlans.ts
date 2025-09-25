import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VLAN {
  id: string;
  location_id: string;
  vlan_id: number;
  vlan_name: string;
  description?: string;
  subnet?: string;
  security_zone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useVlans = (locationId?: string) => {
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVlans = async () => {
    try {
      setLoading(true);
      let query = supabase.from('vlans').select('*');
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query
        .eq('is_active', true)
        .order('vlan_id', { ascending: true });
      
      if (error) throw error;
      setVlans((data as VLAN[]) || []);
    } catch (error) {
      console.error('Error fetching VLANs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch VLANs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addVlan = async (vlanData: Omit<VLAN, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('vlans')
        .insert([vlanData])
        .select()
        .single();
      
      if (error) throw error;
      await fetchVlans();
      
      toast({
        title: "Success",
        description: "VLAN added successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding VLAN:', error);
      toast({
        title: "Error",
        description: "Failed to add VLAN",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateVlan = async (id: string, updates: Partial<VLAN>) => {
    try {
      const { data, error } = await supabase
        .from('vlans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchVlans();
      
      toast({
        title: "Success",
        description: "VLAN updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating VLAN:', error);
      toast({
        title: "Error",
        description: "Failed to update VLAN",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteVlan = async (id: string) => {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('vlans')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      await fetchVlans();
      
      toast({
        title: "Success",
        description: "VLAN deactivated successfully",
      });
    } catch (error) {
      console.error('Error deactivating VLAN:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate VLAN",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchVlans();
  }, [locationId]);

  return {
    vlans,
    loading,
    fetchVlans,
    addVlan,
    updateVlan,
    deleteVlan
  };
};