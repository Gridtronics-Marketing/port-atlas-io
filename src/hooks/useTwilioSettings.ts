import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TwilioSettings {
  id?: string;
  account_sid?: string;
  auth_token?: string;
  phone_number?: string;
  enabled: boolean;
  push_notifications_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useTwilioSettings = () => {
  const [settings, setSettings] = useState<TwilioSettings>({
    enabled: false,
    push_notifications_enabled: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('twilio_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Error fetching Twilio settings:', error);
      toast({
        title: "Error",
        description: "Failed to load Twilio settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updatedSettings: Partial<TwilioSettings>) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('twilio_settings')
        .upsert({
          ...settings,
          ...updatedSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      
      toast({
        title: "Success",
        description: "Twilio settings updated",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating Twilio settings:', error);
      toast({
        title: "Error",
        description: "Failed to update Twilio settings",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      if (!settings.account_sid || !settings.auth_token) {
        toast({
          title: "Error",
          description: "Please configure Account SID and Auth Token first",
          variant: "destructive",
        });
        return false;
      }

      // Call edge function to test Twilio connection
      const { data, error } = await supabase.functions.invoke('test-twilio-connection', {
        body: {
          accountSid: settings.account_sid,
          authToken: settings.auth_token,
          phoneNumber: settings.phone_number
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Twilio connection test successful",
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: data.error || "Connection test failed",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    testConnection,
    refreshSettings: fetchSettings
  };
};