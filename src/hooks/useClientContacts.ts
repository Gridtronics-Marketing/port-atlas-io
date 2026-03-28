import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export const useClientContacts = (clientId: string | undefined) => {
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchContacts = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setContacts((data || []) as ClientContact[]);
    } catch (error) {
      console.error('Error fetching client contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (contact: { name: string; email?: string; phone?: string; role?: string }) => {
    if (!clientId) return;
    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .insert([{ ...contact, client_id: clientId }])
        .select()
        .single();
      if (error) throw error;
      setContacts(prev => [...prev, data as ClientContact]);
      toast({ title: "Success", description: "Contact added" });
      return data;
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({ title: "Error", description: "Failed to add contact", variant: "destructive" });
      throw error;
    }
  };

  const updateContact = async (id: string, updates: Partial<ClientContact>) => {
    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setContacts(prev => prev.map(c => c.id === id ? data as ClientContact : c));
      toast({ title: "Success", description: "Contact updated" });
      return data;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({ title: "Error", description: "Failed to update contact", variant: "destructive" });
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('client_contacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setContacts(prev => prev.filter(c => c.id !== id));
      toast({ title: "Success", description: "Contact deleted" });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({ title: "Error", description: "Failed to delete contact", variant: "destructive" });
      throw error;
    }
  };

  return { contacts, loading, fetchContacts, addContact, updateContact, deleteContact };
};
