import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWAUpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const { toast } = useToast();

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW Registered: ', registration);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onOfflineReady() {
      toast({
        title: "App Ready Offline",
        description: "The app is now ready to work offline.",
      });
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setUpdateAvailable(true);
    }
  }, [needRefresh]);

  useEffect(() => {
    if (offlineReady) {
      toast({
        title: "App Ready",
        description: "App is ready to work offline.",
      });
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady, toast]);

  const handleUpdate = async () => {
    try {
      await updateServiceWorker(true);
      setUpdateAvailable(false);
      setNeedRefresh(false);
      
      toast({
        title: "Update Applied",
        description: "The app has been updated successfully.",
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update Error",
        description: "Unable to update the app. Please refresh manually.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    setNeedRefresh(false);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 md:left-auto left-1/2 md:transform-none -translate-x-1/2 md:translate-x-0 z-50 max-w-sm shadow-lg border-primary/20 bg-background/95 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm">Update Available</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          A new version of Port Atlas is available with improvements and bug fixes
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button 
            onClick={handleUpdate}
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Now
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDismiss}
            className="flex-1"
          >
            Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};