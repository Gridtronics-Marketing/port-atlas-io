import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSystemConfigurations } from '@/hooks/useSystemConfigurations';
import { useToast } from '@/hooks/use-toast';
import { Key, ExternalLink, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const APIKeysManager = () => {
  const { configurations, loading, addConfiguration, updateConfiguration } = useSystemConfigurations('external_apis');
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    google_maps_api_key: ''
  });

  useEffect(() => {
    const apiKeys = configurations.reduce((acc, config) => {
      if (config.key in formData) {
        acc[config.key as keyof typeof formData] = config.value || '';
      }
      return acc;
    }, {} as typeof formData);
    
    setFormData(prev => ({ ...prev, ...apiKeys }));
  }, [configurations]);

  const maskApiKey = (key: string, show: boolean) => {
    if (!key || show) return key;
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  const handleSave = async (key: keyof typeof formData, label: string) => {
    const value = formData[key];
    if (!value.trim()) {
      toast({
        title: 'Validation Error',
        description: 'API key cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    const existing = configurations.find(c => c.key === key);
    
    try {
      if (existing) {
        await updateConfiguration(existing.id, {
          value,
          is_active: true
        });
      } else {
        await addConfiguration({
          category: 'external_apis',
          key,
          value,
          data_type: 'string',
          description: `${label} for location services`,
          is_active: true
        });
      }

      toast({
        title: 'Success',
        description: `${label} saved successfully`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save API key',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading API configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          Google now uses a single unified API key for all Maps Platform services. Configure your key for Maps, Places, Geocoding, and Directions functionality.
          <a 
            href="https://console.cloud.google.com/google/maps-apis/start" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
          >
            Get API Key <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Google Maps Platform API Key
          </CardTitle>
          <CardDescription>
            Single unified key for Maps, Places, Geocoding, and Directions services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google_maps_api_key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="google_maps_api_key"
                  type={showKeys.google_maps_api_key ? 'text' : 'password'}
                  value={formData.google_maps_api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_maps_api_key: e.target.value }))}
                  placeholder="AIza..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKeys(prev => ({ ...prev, google_maps_api_key: !prev.google_maps_api_key }))}
                >
                  {showKeys.google_maps_api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={() => handleSave('google_maps_api_key', 'Google Maps Platform API Key')}>
                Save
              </Button>
            </div>
          </div>
          {configurations.find(c => c.key === 'google_maps_api_key' && c.is_active) && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Configured and active</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <h4 className="text-sm font-medium mb-2">Setup Instructions</h4>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Visit the <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Maps Platform</a></li>
          <li>Create a new project or select an existing one</li>
          <li>Enable the Maps Platform APIs (this automatically enables Maps, Places, Geocoding, and Directions)</li>
          <li>Create an API key in the Credentials section</li>
          <li>Restrict the API key to your domain and required APIs for security</li>
          <li>Copy and paste the API key above</li>
        </ol>
      </div>
    </div>
  );
};
