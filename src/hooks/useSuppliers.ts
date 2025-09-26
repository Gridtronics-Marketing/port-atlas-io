import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  supplier_code?: string;
  payment_terms: string;
  tax_id?: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierFormData {
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  supplier_code?: string;
  payment_terms: string;
  tax_id?: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers((data || []) as Supplier[]);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch suppliers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = async (supplierData: SupplierFormData) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;

      setSuppliers(prev => [...prev, data as Supplier]);
      toast({
        title: "Success",
        description: "Supplier added successfully",
      });
      return data;
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast({
        title: "Error",
        description: "Failed to add supplier",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<SupplierFormData>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSuppliers(prev => 
        prev.map(supplier => supplier.id === id ? data as Supplier : supplier)
      );
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "Error",
        description: "Failed to update supplier",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers,
  };
};