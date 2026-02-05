import { useIntegrationCredentials, TwilioCredentials } from './useIntegrationCredentials';

export interface TwilioSettings {
  enabled: boolean;
  push_notifications_enabled: boolean;
  credentials_configured: boolean;
  phone_number_masked?: string;
  last_verified_at?: string;
  last_error?: string;
}

export const useTwilioSettings = () => {
  const {
    status,
    isLoading,
    configureCredentials,
    testConnection,
    deactivate,
    refetch,
  } = useIntegrationCredentials('twilio');

  // Map status to settings format for backward compatibility
  const settings: TwilioSettings = {
    enabled: status.is_active,
    push_notifications_enabled: status.settings?.push_notifications_enabled || false,
    credentials_configured: status.configured,
    phone_number_masked: status.phone_number_masked || undefined,
    last_verified_at: status.last_verified_at || undefined,
    last_error: status.last_error || undefined,
  };

  const updateSettings = async (updates: {
    account_sid?: string;
    auth_token?: string;
    phone_number?: string;
    enabled?: boolean;
    push_notifications_enabled?: boolean;
  }): Promise<boolean> => {
    // If credentials are provided, configure them
    if (updates.account_sid && updates.auth_token) {
      const credentials: TwilioCredentials = {
        account_sid: updates.account_sid,
        auth_token: updates.auth_token,
        phone_number: updates.phone_number || '',
      };
      
      const result = await configureCredentials(credentials, {
        push_notifications_enabled: updates.push_notifications_enabled ?? settings.push_notifications_enabled,
      });
      
      return result.success;
    }

    // If only settings are being updated, we need to call configure with existing settings
    // For now, settings changes require re-entering credentials (or we could store settings separately)
    // This is a limitation that could be improved
    return false;
  };

  return {
    settings,
    isLoading,
    updateSettings,
    testConnection,
    deactivate,
    refreshSettings: refetch,
  };
};
