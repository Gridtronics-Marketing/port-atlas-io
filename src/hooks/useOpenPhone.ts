import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  call_status: 'completed' | 'missed' | 'voicemail' | 'busy';
  disposition?: string;
  notes?: string;
  work_order_created?: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OpenPhoneSettings {
  api_key: string;
  webhook_url: string;
  phone_number: string;
  enabled: boolean;
  auto_create_work_orders: boolean;
  screen_pop_enabled: boolean;
  call_recording_enabled: boolean;
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
  const [settings, setSettings] = useState<OpenPhoneSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('openphone_call_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCallLogs((data || []) as OpenPhoneCallLog[]);
    } catch (error) {
      console.error('Error fetching call logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch call logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('procurement_settings')
        .select('setting_value')
        .eq('setting_key', 'openphone_config')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data.setting_value as unknown as OpenPhoneSettings);
      }
    } catch (error) {
      console.error('Error fetching OpenPhone settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<OpenPhoneSettings>) => {
    try {
      const currentSettings = settings || {
        api_key: '',
        webhook_url: '',
        phone_number: '',
        enabled: false,
        auto_create_work_orders: false,
        screen_pop_enabled: false,
        call_recording_enabled: false
      };

      const updatedSettings = { ...currentSettings, ...newSettings };

      const { error } = await supabase
        .from('procurement_settings')
        .upsert({
          setting_key: 'openphone_config',
          setting_value: updatedSettings,
          description: 'OpenPhone integration configuration'
        });

      if (error) throw error;

      setSettings(updatedSettings);
      toast({
        title: "Success",
        description: "OpenPhone settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating OpenPhone settings:', error);
      toast({
        title: "Error",
        description: "Failed to update OpenPhone settings",
        variant: "destructive",
      });
      throw error;
    }
  };

  const matchContact = async (phoneNumber: string): Promise<ContactMatch | null> => {
    try {
      // Clean phone number for matching
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Search in employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, phone, email')
        .ilike('phone', `%${cleanPhone.slice(-10)}%`);

      if (empError) throw empError;

      if (employees && employees.length > 0) {
        const emp = employees[0];
        return {
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          type: 'employee',
          phone: emp.phone,
          email: emp.email,
          recent_activity: [] // TODO: Fetch recent work orders/projects
        };
      }

      // Search in clients
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, name, contact_name, contact_phone, contact_email')
        .ilike('contact_phone', `%${cleanPhone.slice(-10)}%`);

      if (clientError) throw clientError;

      if (clients && clients.length > 0) {
        const client = clients[0];
        return {
          id: client.id,
          name: client.contact_name || client.name,
          type: 'client',
          phone: client.contact_phone,
          email: client.contact_email,
          recent_activity: [] // TODO: Fetch recent projects/work orders
        };
      }

      // Search in suppliers
      const { data: suppliers, error: suppError } = await supabase
        .from('suppliers')
        .select('id, name, contact_name, contact_phone, contact_email')
        .ilike('contact_phone', `%${cleanPhone.slice(-10)}%`);

      if (suppError) throw suppError;

      if (suppliers && suppliers.length > 0) {
        const supplier = suppliers[0];
        return {
          id: supplier.id,
          name: supplier.contact_name || supplier.name,
          type: 'supplier',
          phone: supplier.contact_phone,
          email: supplier.contact_email,
          recent_activity: [] // TODO: Fetch recent purchase orders
        };
      }

      return null;
    } catch (error) {
      console.error('Error matching contact:', error);
      return null;
    }
  };

  const logCall = async (callData: {
    openphone_call_id: string;
    direction: 'inbound' | 'outbound';
    phone_number: string;
    started_at: string;
    contact_id?: string;
    contact_type?: 'employee' | 'client' | 'supplier' | 'unknown';
    duration_seconds?: number;
    recording_url?: string;
    transcription?: string;
    call_status?: 'completed' | 'missed' | 'voicemail' | 'busy';
    disposition?: string;
    notes?: string;
    work_order_created?: string;
    ended_at?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('openphone_call_logs')
        .insert([callData])
        .select()
        .single();

      if (error) throw error;

      setCallLogs(prev => [data as OpenPhoneCallLog, ...prev]);
      return data as OpenPhoneCallLog;
    } catch (error) {
      console.error('Error logging call:', error);
      throw error;
    }
  };

  const updateCallDisposition = async (callId: string, disposition: string, notes?: string) => {
    try {
      const { data, error } = await supabase
        .from('openphone_call_logs')
        .update({ disposition, notes })
        .eq('id', callId)
        .select()
        .single();

      if (error) throw error;

      setCallLogs(prev => 
        prev.map(call => call.id === callId ? data as OpenPhoneCallLog : call)
      );

      toast({
        title: "Success",
        description: "Call disposition updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating call disposition:', error);
      toast({
        title: "Error",
        description: "Failed to update call disposition",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCallLogs();
    fetchSettings();
  }, []);

  return {
    callLogs,
    settings,
    loading,
    updateSettings,
    matchContact,
    logCall,
    updateCallDisposition,
    refetch: fetchCallLogs,
  };
};