import React from 'react';
import { useOpenPhone } from '@/hooks/useOpenPhone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneCall } from 'lucide-react';

export const OpenPhoneManager = () => {
  const { callLogs, settings, loading } = useOpenPhone();

  if (loading) {
    return <div>Loading OpenPhone data...</div>;
  }

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'missed': return 'destructive';
      case 'voicemail': return 'secondary';
      case 'busy': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">OpenPhone Integration</h2>
        <Badge variant={settings?.enabled ? 'default' : 'secondary'}>
          {settings?.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p><strong>Phone Number:</strong></p>
                <p>{settings.phone_number_masked || 'Not set'}</p>
              </div>
              <div>
                <p><strong>Screen Pop:</strong></p>
                <p>{settings.screen_pop_enabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p><strong>Call Recording:</strong></p>
                <p>{settings.call_recording_enabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p><strong>Auto Work Orders:</strong></p>
                <p>{settings.auto_create_work_orders ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-medium mb-4">Recent Calls</h3>
        <div className="grid gap-4">
          {callLogs.slice(0, 10).map((call) => (
            <Card key={call.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    {call.direction === 'inbound' ? 
                      <PhoneCall className="h-4 w-4 text-green-500" /> : 
                      <Phone className="h-4 w-4 text-blue-500" />
                    }
                    <div>
                      <p className="font-medium">{call.phone_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(call.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getCallStatusColor(call.call_status)}>
                      {call.call_status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.floor(call.duration_seconds / 60)}:{(call.duration_seconds % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};