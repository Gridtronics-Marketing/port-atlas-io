import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationData } from '@/hooks/useOrganizationData';
import { useIntegrationCredentials, OpenPhoneCredentials } from './useIntegrationCredentials';

export interface OpenPhoneCallLog {
  id: string;
  openphone_call_id: string;
  direction: 'inbound' | 'outbound';
  phone_number: string;
  contact_id?: string;
  contact_type?: 'employee' | 'client' | 'supplier' | 'unknown';
  duration_seconds: number;
  recording_url?: string;
  transcription?: string;
  call_status: 'completed' | 'missed' | 'voicemail' | 'busy' | 'in_progress';
  disposition?: string;
  notes?: string;
  work_order_created?: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface OpenPhoneSettings {
  enabled: boolean;
  auto_create_work_orders: boolean;
  screen_pop_enabled: boolean;
  call_recording_enabled: boolean;
  credentials_configured: boolean;
  phone_number_masked?: string;
  webhook_url?: string;
}

export interface ContactMatch {
  id: string;
  name: string;
  type: 'employee' | 'client' | 'supplier';
  phone: string;
  email?: string;
  recent_activity?: Array<{
    type: 'work_order' | 'project' | 'call';
    title: string;
    date: string;
  }>;
}

export const useOpenPhone = () => {
  const [callLogs, setCallLogs] = useState<OpenPhoneCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { organizationId } = useOrganizationData();

  const {
    status,
    isLoading: credentialsLoading,
    configureCredentials,
    testConnection: testCredentials,
    deactivate,
  } = useIntegrationCredentials('openphone');

  // Map integration status to settings format
  const settings: OpenPhoneSettings = {
    enabled: status.is_active,
    auto_create_work_orders: status.settings?.auto_create_work_orders || false,
    screen_pop_enabled: status.settings?.screen_pop_enabled || false,
    call_recording_enabled: status.settings?.call_recording_enabled || false,
    credentials_configured: status.configured,
    phone_number_masked: status.phone_number_masked || undefined,
    webhook_url: status.webhook_url || undefined,
  };

  const fetchCallLogs = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('openphone_call_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCallLogs((data || []) as OpenPhoneCallLog[]);
    } catch (error) {
      console.error('Error fetching call logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch call logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

  const updateSettings = async (newSettings: {
    api_key?: string;
    phone_number?: string;
    auto_create_work_orders?: boolean;
    screen_pop_enabled?: boolean;
    call_recording_enabled?: boolean;
  }): Promise<{ success: boolean; webhook_url?: string; webhook_secret?: string }> => {
    if (newSettings.api_key) {
      const credentials: OpenPhoneCredentials = {
        api_key: newSettings.api_key,
        phone_number: newSettings.phone_number,
      };

      return configureCredentials(credentials, {
        auto_create_work_orders: newSettings.auto_create_work_orders ?? settings.auto_create_work_orders,
        screen_pop_enabled: newSettings.screen_pop_enabled ?? settings.screen_pop_enabled,
        call_recording_enabled: newSettings.call_recording_enabled ?? settings.call_recording_enabled,
      });
    }

    return { success: false };
  };

  const matchContact = async (phoneNumber: string): Promise<ContactMatch | null> => {
    if (!organizationId) return null;

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');

      // Search in employees (scoped to org via RLS)
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, phone, email')
        .ilike('phone', `%${cleanPhone.slice(-10)}%`)
        .limit(1);

      if (employees && employees.length > 0) {
        const emp = employees[0];
        return {
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          type: 'employee',
          phone: emp.phone || '',
          email: emp.email || undefined,
          recent_activity: [],
        };
      }

      // Search in clients (scoped to org via RLS)
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, contact_name, contact_phone, contact_email')
        .ilike('contact_phone', `%${cleanPhone.slice(-10)}%`)
        .limit(1);

      if (clients && clients.length > 0) {
        const client = clients[0];
        return {
          id: client.id,
          name: client.contact_name || client.name,
          type: 'client',
          phone: client.contact_phone || '',
          email: client.contact_email || undefined,
          recent_activity: [],
        };
      }

      // Search in suppliers (scoped to org via RLS)
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name, contact_name, contact_phone, contact_email')
        .ilike('contact_phone', `%${cleanPhone.slice(-10)}%`)
        .limit(1);

      if (suppliers && suppliers.length > 0) {
        const supplier = suppliers[0];
        return {
          id: supplier.id,
          name: supplier.contact_name || supplier.name,
          type: 'supplier',
          phone: supplier.contact_phone || '',
          email: supplier.contact_email || undefined,
          recent_activity: [],
        };
      }

      return null;
    } catch (error) {
      console.error('Error matching contact:', error);
      return null;
    }
  };

  const updateCallDisposition = async (
    callId: string,
    disposition: string,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('openphone_call_logs')
        .update({ disposition, notes })
        .eq('id', callId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      setCallLogs((prev) =>
        prev.map((call) => (call.id === callId ? (data as OpenPhoneCallLog) : call))
      );

      toast({
        title: 'Success',
        description: 'Call disposition updated successfully',
      });
      return data;
    } catch (error) {
      console.error('Error updating call disposition:', error);
      toast({
        title: 'Error',
        description: 'Failed to update call disposition',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    callLogs,
    settings,
    loading: loading || credentialsLoading,
    updateSettings,
    matchContact,
    updateCallDisposition,
    testConnection: testCredentials,
    deactivate,
    refetch: fetchCallLogs,
  };
};
