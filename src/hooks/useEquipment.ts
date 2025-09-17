import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  make?: string;
  model?: string;
  serial_number?: string;
  asset_tag?: string;
  firmware_version?: string;
  status?: string;
  location_id?: string;
  rack_id?: string;
  rack_position?: number;
  assigned_to?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Rack {
  id: string;
  rack_name: string;
  location_id?: string;
  floor?: number;
  room?: string;
  rack_units?: number;
  power_available?: number;
  cooling_required?: boolean;
  x_coordinate?: number;
  y_coordinate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch equipment',
        variant: 'destructive',
      });
    }
  };

  const fetchRacks = async () => {
    try {
      const { data, error } = await supabase
        .from('racks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRacks(data || []);
    } catch (error) {
      console.error('Error fetching racks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch racks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addEquipment = async (equipmentData: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([equipmentData])
        .select()
        .single();

      if (error) throw error;

      setEquipment(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Equipment added successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add equipment',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEquipment(prev => 
        prev.map(eq => eq.id === id ? { ...eq, ...data } : eq)
      );
      
      toast({
        title: 'Success',
        description: 'Equipment updated successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update equipment',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const addRack = async (rackData: Omit<Rack, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('racks')
        .insert([rackData])
        .select()
        .single();

      if (error) throw error;

      setRacks(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Rack added successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error adding rack:', error);
      toast({
        title: 'Error',
        description: 'Failed to add rack',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateRack = async (id: string, updates: Partial<Rack>) => {
    try {
      const { data, error } = await supabase
        .from('racks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRacks(prev => 
        prev.map(rack => rack.id === id ? { ...rack, ...data } : rack)
      );
      
      toast({
        title: 'Success',
        description: 'Rack updated successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error updating rack:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rack',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEquipment(prev => prev.filter(eq => eq.id !== id));
      toast({
        title: 'Success',
        description: 'Equipment deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete equipment',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteRack = async (id: string) => {
    try {
      const { error } = await supabase
        .from('racks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRacks(prev => prev.filter(rack => rack.id !== id));
      toast({
        title: 'Success',
        description: 'Rack deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting rack:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete rack',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchRacks();
  }, []);

  return {
    equipment,
    racks,
    loading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addRack,
    updateRack,
    deleteRack,
    refetch: () => {
      fetchEquipment();
      fetchRacks();
    },
  };
}