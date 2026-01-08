import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  Download, 
  Wifi, 
  Bell, 
  HardDrive, 
  RefreshCw,
  Monitor,
  Zap,
  Shield,
  Camera,
  MapPin,
  Share,
  Plus
} from 'lucide-react';
import { usePWA, getPWACapabilities, trackPWAEvent } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { PWAInstallationStatus } from '@/components/PWAInstallationStatus';

export const PWASettings: React.FC = () => {
  const { isInstalled, isStandalone, canInstall, installPrompt, isOnline } = usePWA();
  const { toast } = useToast();
  const capabilities = getPWACapabilities();

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const handleInstall = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        trackPWAEvent('install_prompt_result', { outcome });
        
        if (outcome === 'accepted') {
          toast({
            title: "Installing App",
            description: "Trade Atlas is being added to your device.",
          });
        }
      } catch (error) {
        console.error('Install error:', error);
        toast({
          title: "Installation Error",
          description: "Unable to install the app.",
          variant: "destructive",
        });
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      trackPWAEvent('notification_permission', { permission });
      
      toast({
        title: permission === 'granted' ? "Notifications Enabled" : "Notifications Disabled",
        description: permission === 'granted' 
          ? "You'll receive important updates from Trade Atlas." 
          : "You can enable notifications later in your browser settings.",
        variant: permission === 'granted' ? "default" : "destructive",
      });
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        trackPWAEvent('cache_cleared');
        
        toast({
          title: "Cache Cleared",
          description: "App cache has been cleared. The page will reload.",
        });
        
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error('Cache clear error:', error);
        toast({
          title: "Error",
          description: "Unable to clear cache.",
          variant: "destructive",
        });
      }
    }
  };

  const getStorageEstimate = async () => {
    if (capabilities.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage ? (estimate.usage / 1024 / 1024).toFixed(1) : 0;
        const quota = estimate.quota ? (estimate.quota / 1024 / 1024 / 1024).toFixed(1) : 0;
        
        toast({
          title: "Storage Usage",
          description: `Using ${used}MB of ${quota}GB available space.`,
        });
      } catch (error) {
        console.error('Storage estimate error:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Multi-Device Installation Info */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Multi-Device Installation
          </CardTitle>
          <CardDescription>
            Important: PWAs must be installed separately on each device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-background/80 p-4 space-y-3">
            <p className="text-sm font-medium">Did you know?</p>
            <p className="text-sm text-muted-foreground">
              If you installed Trade Atlas on your computer, you'll need to install it separately on your phone, tablet, or other devices. PWA installations don't sync across devices - each device needs its own installation.
            </p>
          </div>
          
          <PWAInstallationStatus />
        </CardContent>
      </Card>

      {/* Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            App Installation
          </CardTitle>
          <CardDescription>
            Install Trade Atlas for faster access and offline functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Installation Status</p>
              <p className="text-sm text-muted-foreground">
                {isInstalled ? 'App is installed on this device' : 'App is running in browser'}
              </p>
            </div>
            <Badge variant={isInstalled ? "default" : "secondary"}>
              {isInstalled ? 'Installed' : 'Browser'}
            </Badge>
          </div>
          
          {/* Install Button */}
          {!isInstalled && (
            <PWAInstallButton variant="default" className="w-full" />
          )}

          {/* iOS-specific instructions */}
          {isIOS && !isInstalled && (
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <p className="text-sm font-medium">Install on iOS</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="font-medium">1.</span>
                  <span>Tap the <Share className="inline w-3 h-3" /> Share button in Safari</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">2.</span>
                  <span>Select "Add to Home Screen" <Plus className="inline w-3 h-3" /></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">3.</span>
                  <span>Tap "Add" to complete installation</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Standalone Mode</p>
              <p className="text-sm text-muted-foreground">
                App is running {isStandalone ? 'standalone' : 'in browser'}
              </p>
            </div>
            <Badge variant={isStandalone ? "default" : "outline"}>
              {isStandalone ? 'Standalone' : 'Browser'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Connection & Sync
          </CardTitle>
          <CardDescription>
            Network status and offline capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Network Status</p>
              <p className="text-sm text-muted-foreground">
                You are currently {isOnline ? 'online' : 'offline'}
              </p>
            </div>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Offline Mode</p>
              <p className="text-sm text-muted-foreground">
                App works offline with cached data
              </p>
            </div>
            <Badge variant="default">Enabled</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage push notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                {capabilities.notifications ? 'Supported by your device' : 'Not supported'}
              </p>
            </div>
            {capabilities.notifications && (
              <Button variant="outline" onClick={requestNotificationPermission}>
                Enable
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage & Cache */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage & Cache
          </CardTitle>
          <CardDescription>
            Manage app storage and cached data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={getStorageEstimate} className="flex-1">
              <HardDrive className="w-4 h-4 mr-2" />
              Check Usage
            </Button>
            <Button variant="outline" onClick={clearCache} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Device Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Device Capabilities
          </CardTitle>
          <CardDescription>
            Available PWA features on this device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Service Worker</span>
              </div>
              <Badge variant={capabilities.serviceWorker ? "default" : "secondary"}>
                {capabilities.serviceWorker ? 'Yes' : 'No'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Notifications</span>
              </div>
              <Badge variant={capabilities.notifications ? "default" : "secondary"}>
                {capabilities.notifications ? 'Yes' : 'No'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Background Sync</span>
              </div>
              <Badge variant={capabilities.backgroundSync ? "default" : "secondary"}>
                {capabilities.backgroundSync ? 'Yes' : 'No'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span className="text-sm">Camera</span>
              </div>
              <Badge variant={capabilities.camera ? "default" : "secondary"}>
                {capabilities.camera ? 'Yes' : 'No'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Geolocation</span>
              </div>
              <Badge variant={capabilities.geolocation ? "default" : "secondary"}>
                {capabilities.geolocation ? 'Yes' : 'No'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Web Share</span>
              </div>
              <Badge variant={capabilities.webShare ? "default" : "secondary"}>
                {capabilities.webShare ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};