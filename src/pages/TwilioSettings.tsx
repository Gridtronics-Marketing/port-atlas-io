import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Phone, MessageSquare, Settings } from 'lucide-react';
import { useTwilioSettings } from '@/hooks/useTwilioSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TwilioSettings = () => {
  const { settings, isLoading, updateSettings, testConnection } = useTwilioSettings();
  const [formData, setFormData] = useState({
    account_sid: '',
    auth_token: '',
    phone_number: ''
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCredentials = async () => {
    await updateSettings(formData);
    // Clear form after successful save
    setFormData({ account_sid: '', auth_token: '', phone_number: '' });
  };

  const handleToggleSetting = async (field: 'enabled' | 'push_notifications_enabled', value: boolean) => {
    await updateSettings({ [field]: value });
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await testConnection();
    setIsTestingConnection(false);
  };

  const hasCredentials = settings.account_sid && settings.auth_token;

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Twilio Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure Twilio for SMS notifications and communication features
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Twilio Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Twilio Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need a Twilio account to send SMS notifications. Get your credentials from{' '}
                <a 
                  href="https://console.twilio.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Twilio Console
                </a>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="account_sid">Account SID</Label>
                <Input
                  id="account_sid"
                  placeholder="Enter your Twilio Account SID"
                  value={formData.account_sid}
                  onChange={(e) => handleInputChange('account_sid', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="auth_token">Auth Token</Label>
                <Input
                  id="auth_token"
                  type="password"
                  placeholder="Enter your Twilio Auth Token"
                  value={formData.auth_token}
                  onChange={(e) => handleInputChange('auth_token', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Twilio Phone Number</Label>
                <Input
                  id="phone_number"
                  placeholder="+1234567890"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Include country code (e.g., +1 for US numbers)
                </p>
              </div>

              <Button 
                onClick={handleSaveCredentials} 
                className="w-full"
                disabled={isLoading || !formData.account_sid || !formData.auth_token}
              >
                Save Credentials
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Service Status & Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Connection Status</h4>
                <p className="text-sm text-muted-foreground">
                  {hasCredentials ? 'Credentials configured' : 'No credentials set'}
                </p>
              </div>
              <Badge variant={hasCredentials ? 'default' : 'secondary'}>
                {hasCredentials ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {hasCredentials ? 'Ready' : 'Not Configured'}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">Enable Twilio</Label>
                  <p className="text-sm text-muted-foreground">
                    Master switch for all Twilio features
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => handleToggleSetting('enabled', checked)}
                  disabled={!hasCredentials || isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push_notifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send SMS for scheduling and work order alerts
                  </p>
                </div>
                <Switch
                  id="push_notifications"
                  checked={settings.push_notifications_enabled}
                  onCheckedChange={(checked) => handleToggleSetting('push_notifications_enabled', checked)}
                  disabled={!settings.enabled || isLoading}
                />
              </div>
            </div>

            <Separator />

            <Button 
              onClick={handleTestConnection}
              variant="outline"
              className="w-full"
              disabled={!hasCredentials || isTestingConnection || !settings.enabled}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Getting Started with Twilio:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Create a free Twilio account at{' '}
                  <a 
                    href="https://www.twilio.com/try-twilio" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    twilio.com/try-twilio
                  </a>
                </li>
                <li>
                  Purchase a phone number from the{' '}
                  <a 
                    href="https://console.twilio.com/us1/develop/phone-numbers/manage/search" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Twilio Console
                  </a>
                </li>
                <li>
                  Find your Account SID and Auth Token in your{' '}
                  <a 
                    href="https://console.twilio.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Console Dashboard
                  </a>
                </li>
                <li>Enter the credentials above and test the connection</li>
                <li>Enable the desired notification features</li>
              </ol>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> SMS notifications will be sent for employee scheduling updates, 
                work order assignments, and urgent system alerts when enabled.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default TwilioSettings;