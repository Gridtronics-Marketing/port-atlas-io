import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const OfflineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Hide indicator after brief delay when back online with no pending
      setTimeout(() => {
        if (pendingCount === 0) {
          setShowIndicator(false);
        }
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    // Listen to custom events from OfflineSyncContext
    const handlePendingUpdate = (e: CustomEvent) => {
      setPendingCount(e.detail.count || 0);
      if (e.detail.count > 0) {
        setShowIndicator(true);
      }
    };

    const handleSyncProgress = (e: CustomEvent) => {
      setSyncInProgress(e.detail.inProgress || false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-pending-update', handlePendingUpdate as EventListener);
    window.addEventListener('offline-sync-progress', handleSyncProgress as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-pending-update', handlePendingUpdate as EventListener);
      window.removeEventListener('offline-sync-progress', handleSyncProgress as EventListener);
    };
  }, [pendingCount]);

  // Don't show anything when online and synced
  if (isOnline && pendingCount === 0 && !showIndicator) {
    return null;
  }

  // Show minimal offline badge when offline
  if (!isOnline) {
    return (
      <Badge
        variant="destructive"
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5"
      >
        <WifiOff className="w-3.5 h-3.5" />
        <span>Offline</span>
        {pendingCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
            {pendingCount}
          </span>
        )}
      </Badge>
    );
  }

  // Show syncing indicator when online with pending items
  if (pendingCount > 0 || syncInProgress) {
    return (
      <Badge
        variant="secondary"
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5"
      >
        {syncInProgress ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing...</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span>{pendingCount} pending</span>
          </>
        )}
      </Badge>
    );
  }

  return null;
};
