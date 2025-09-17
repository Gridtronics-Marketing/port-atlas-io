import { useState } from 'react';
import { Settings, Zap, CheckCircle, XCircle, AlertTriangle, RefreshCw, Plug, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useIntegrations } from '@/hooks/useIntegrations';
import { format } from 'date-fns';

export const IntegrationsManager = () => {
  const { 
    integrations, 
    syncLogs, 
    isLoading, 
    testConnection, 
    syncIntegration, 
    disconnectIntegration 
  } = useIntegrations();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crm':
        return '👥';
      case 'accounting':
        return '💰';
      case 'project_management':
        return '📋';
      case 'communication':
        return '💬';
      default:
        return '🔧';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrations</h2>
        <p className="text-muted-foreground">
          Connect and manage external service integrations
        </p>
      </div>

      {/* Active Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Active Integrations
          </CardTitle>
          <CardDescription>
            Manage your connected services and their synchronization status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getTypeIcon(integration.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{integration.name}</h3>
                      {getStatusIcon(integration.status)}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {integration.type.replace('_', ' ')} Integration
                    </p>
                    {integration.last_sync && (
                      <p className="text-xs text-muted-foreground">
                        Last sync: {format(new Date(integration.last_sync), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(integration.status)}
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testConnection(integration.id)}
                      disabled={isLoading}
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => syncIntegration(integration.id)}
                      disabled={isLoading || integration.status !== 'connected'}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => disconnectIntegration(integration.id)}
                      disabled={isLoading}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>
            Connect new services to enhance your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Microsoft Project', type: 'project_management', description: 'Sync project schedules and tasks' },
              { name: 'Autodesk AutoCAD', type: 'design', description: 'Import CAD drawings and floor plans' },
              { name: 'Xero Accounting', type: 'accounting', description: 'Financial data synchronization' },
              { name: 'Microsoft Teams', type: 'communication', description: 'Team communication and notifications' },
            ].map((service, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sync History
          </CardTitle>
          <CardDescription>
            Recent synchronization activity and logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncLogs.map((log) => {
              const integration = integrations.find(i => i.id === log.integration_id);
              return (
                <div key={log.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-green-500' : 
                      log.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{integration?.name || 'Unknown Integration'}</p>
                      <p className="text-xs text-muted-foreground">{log.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{log.records_processed} records</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};