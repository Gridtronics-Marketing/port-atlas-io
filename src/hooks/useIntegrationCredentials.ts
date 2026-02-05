import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationData } from '@/hooks/useOrganizationData';

export interface IntegrationStatus {
  configured: boolean;
  is_active: boolean;
  phone_number_masked: string | null;
  last_verified_at: string | null;
  last_error: string | null;
  settings: Record<string, boolean>;
  webhook_url: string | null;
  webhook_secret?: string;
}

export interface TwilioCredentials {
  account_sid: string;
  auth_token: string;
  phone_number: string;
}

export interface OpenPhoneCredentials {
  api_key: string;
  phone_number?: string;
}

type IntegrationType = 'twilio' | 'openphone';

export const useIntegrationCredentials = (integrationType: IntegrationType) => {
  const [status, setStatus] = useState<IntegrationStatus>({
    configured: false,
    is_active: false,
    phone_number_masked: null,
    last_verified_at: null,
    last_error: null,
    settings: {},
    webhook_url: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { organizationId } = useOrganizationData();

  const fetchStatus = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-integration-credentials', {
        body: {
          action: 'get_status',
          integration_type: integrationType,
          organization_id: organizationId,
        },
      });

      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error(`Error fetching ${integrationType} status:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, integrationType]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const configureCredentials = async (
    credentials: TwilioCredentials | OpenPhoneCredentials,
    settings?: Record<string, boolean>
  ): Promise<{ success: boolean; webhook_url?: string; webhook_secret?: string }> => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No organization selected',
        variant: 'destructive',
      });
      return { success: false };
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-integration-credentials', {
        body: {
          action: 'configure',
          integration_type: integrationType,
          organization_id: organizationId,
          credentials,
          settings,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success',
          description: `${integrationType === 'twilio' ? 'Twilio' : 'OpenPhone'} credentials saved securely`,
        });
        await fetchStatus();
        return { 
          success: true, 
          webhook_url: data.webhook_url,
          webhook_secret: data.webhook_secret,
        };
      } else {
        throw new Error(data.error || 'Failed to configure');
      }
    } catch (error) {
      console.error(`Error configuring ${integrationType}:`, error);
      toast({
        title: 'Error',
        description: `Failed to configure ${integrationType === 'twilio' ? 'Twilio' : 'OpenPhone'}`,
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (): Promise<boolean> => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No organization selected',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-integration-credentials', {
        body: {
          action: 'test',
          integration_type: integrationType,
          organization_id: organizationId,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Connection Successful',
          description: `${integrationType === 'twilio' ? 'Twilio' : 'OpenPhone'} is working properly`,
        });
        await fetchStatus();
        return true;
      } else {
        toast({
          title: 'Connection Failed',
          description: data.error || 'Please check your credentials',
          variant: 'destructive',
        });
        await fetchStatus();
        return false;
      }
    } catch (error) {
      console.error(`Error testing ${integrationType}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deactivate = async (): Promise<boolean> => {
    if (!organizationId) return false;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-integration-credentials', {
        body: {
          action: 'deactivate',
          integration_type: integrationType,
          organization_id: organizationId,
        },
      });

      if (error) throw error;

      toast({
        title: 'Integration Deactivated',
        description: `${integrationType === 'twilio' ? 'Twilio' : 'OpenPhone'} has been deactivated`,
      });
      await fetchStatus();
      return true;
    } catch (error) {
      console.error(`Error deactivating ${integrationType}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate integration',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    isLoading,
    configureCredentials,
    testConnection,
    deactivate,
    refetch: fetchStatus,
  };
};
