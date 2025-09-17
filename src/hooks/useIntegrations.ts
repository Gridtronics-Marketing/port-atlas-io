import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Integration {
  id: string;
  name: string;
  type: 'crm' | 'accounting' | 'project_management' | 'communication';
  status: 'connected' | 'disconnected' | 'error';
  last_sync: string | null;
  config: Record<string, any>;
  created_at: string;
}

export interface SyncLog {
  id: string;
  integration_id: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  records_processed: number;
  created_at: string;
}

export const useIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchIntegrations();
    fetchSyncLogs();
  }, []);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      // Mock data for integrations
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Salesforce CRM',
          type: 'crm',
          status: 'connected',
          last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          config: { api_version: 'v52.0', sandbox: false },
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          name: 'QuickBooks Online',
          type: 'accounting',
          status: 'connected',
          last_sync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          config: { company_id: 'qbo_12345', sandbox: true },
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          name: 'Slack Workspace',
          type: 'communication',
          status: 'disconnected',
          last_sync: null,
          config: { team_id: 'slack_789', webhook_url: '' },
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setIntegrations(mockIntegrations);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch integrations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      // Mock data for sync logs
      const mockLogs: SyncLog[] = [
        {
          id: '1',
          integration_id: '1',
          status: 'success',
          message: 'Successfully synced 15 clients and 8 projects',
          records_processed: 23,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          integration_id: '2',
          status: 'success',
          message: 'Financial data synchronized successfully',
          records_processed: 42,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          integration_id: '3',
          status: 'error',
          message: 'Connection timeout - webhook not responding',
          records_processed: 0,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setSyncLogs(mockLogs);
    } catch (error) {
      console.error('Failed to fetch sync logs:', error);
    }
  };

  const testConnection = async (integrationId: string) => {
    setIsLoading(true);
    try {
      // Mock connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        toast({
          title: "Connection Test Successful",
          description: "Integration is working properly",
        });
        return true;
      } else {
        toast({
          title: "Connection Test Failed",
          description: "Please check your integration settings",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const syncIntegration = async (integrationId: string) => {
    setIsLoading(true);
    try {
      // Mock sync operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const integration = integrations.find(i => i.id === integrationId);
      if (integration) {
        const updatedIntegration = {
          ...integration,
          status: 'connected' as const,
          last_sync: new Date().toISOString(),
        };
        
        setIntegrations(prev => 
          prev.map(i => i.id === integrationId ? updatedIntegration : i)
        );

        // Add new sync log
        const newLog: SyncLog = {
          id: Date.now().toString(),
          integration_id: integrationId,
          status: 'success',
          message: `Successfully synced ${integration.name}`,
          records_processed: Math.floor(Math.random() * 50) + 10,
          created_at: new Date().toISOString(),
        };
        
        setSyncLogs(prev => [newLog, ...prev]);

        toast({
          title: "Sync Complete",
          description: `${integration.name} has been synchronized`,
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize integration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    try {
      const integration = integrations.find(i => i.id === integrationId);
      if (integration) {
        const updatedIntegration = {
          ...integration,
          status: 'disconnected' as const,
          last_sync: null,
        };
        
        setIntegrations(prev => 
          prev.map(i => i.id === integrationId ? updatedIntegration : i)
        );

        toast({
          title: "Integration Disconnected",
          description: `${integration.name} has been disconnected`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect integration",
        variant: "destructive",
      });
    }
  };

  return {
    integrations,
    syncLogs,
    isLoading,
    testConnection,
    syncIntegration,
    disconnectIntegration,
    refetch: fetchIntegrations,
  };
};