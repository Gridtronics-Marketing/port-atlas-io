import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const OfflineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      toast({
        title: "Back Online",
        description: "Connection restored. Your data will sync automatically.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      toast({
        title: "You're Offline",
        description: "You can continue working. Changes will sync when you're back online.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Hide offline message after 5 seconds
    let timeoutId: NodeJS.Timeout;
    if (showOfflineMessage) {
      timeoutId = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showOfflineMessage, toast]);

  if (isOnline && !showOfflineMessage) {
    return null;
  }

  return (
    <Badge
      variant={isOnline ? "default" : "destructive"}
      className="fixed top-4 right-4 z-50 flex items-center gap-1"
    >
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          Offline
        </>
      )}
    </Badge>
  );
};