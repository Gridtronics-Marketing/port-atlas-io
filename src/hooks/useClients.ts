import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationData } from '@/hooks/useOrganizationData';

export interface Client {
  id: string;
  name: string;
  slug?: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  billing_address: string | null;
  status: 'Active' | 'Inactive' | 'Pending';
  organization_id?: string;
  linked_organization_id?: string | null;
  linked_organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { organizationId } = useOrganizationData();

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('clients')
        .select(`
          *,
          linked_organization:organizations!clients_linked_organization_id_fkey(
            id,
            name,
            slug
          )
        `)
        .order('name', { ascending: true });

      // Filter by organization if one is selected
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClients((data || []) as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, organization_id: organizationId }])
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => [data as Client, ...prev]);
      toast({
        title: "Success",
        description: "Client added successfully",
      });
      return data;
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => prev.map(client => 
        client.id === id ? data as Client : client
      ));
      
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClients(prev => prev.filter(client => client.id !== id));
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [organizationId]);

  return {
    clients,
    loading,
    fetchClients,
    addClient,
    updateClient,
    deleteClient,
  };
};
