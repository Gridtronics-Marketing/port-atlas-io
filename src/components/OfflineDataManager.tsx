import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnifiedOfflineSync } from '@/hooks/useUnifiedOfflineSync';
import { Wifi, WifiOff, Download, RefreshCw, Clock, Database, Trash2 } from 'lucide-react';

export const OfflineDataManager = () => {
  const {
    isOnline,
    syncInProgress,
    downloadInProgress,
    pendingCount,
    lastDataRefresh,
    downloadAllData,
    syncPendingChanges,
    clearAllOfflineData,
  } = useUnifiedOfflineSync();

  const formatLastRefresh = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const handleDownload = () => {
    downloadAllData({ silent: false });
  };

  const handleSync = () => {
    syncPendingChanges({ silent: false });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              Offline Data Manager
            </CardTitle>
            <CardDescription>
              Data syncs automatically when online. Manage cache and pending changes below.
            </CardDescription>
          </div>
          {pendingCount > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {pendingCount} Pending
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="flex items-center gap-2 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="font-medium">Offline</span>
              </div>
            )}
            {pendingCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {pendingCount} changes pending sync
              </span>
            )}
          </div>

          {isOnline && pendingCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncInProgress}>
              {syncInProgress ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </div>

        {/* Data Cache Status */}
        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Offline Data Cache</span>
            <span className="text-sm text-muted-foreground">
              Last updated: {formatLastRefresh(lastDataRefresh)}
            </span>
          </div>

          <div className="flex gap-2">
            {isOnline && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloadInProgress}
              >
                {downloadInProgress ? (
                  <>
                    <Download className="mr-2 h-4 w-4 animate-pulse" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download All Data
                  </>
                )}
              </Button>
            )}

            <Button variant="destructive" size="sm" onClick={clearAllOfflineData}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Data
            </Button>
          </div>
        </div>

        {/* Offline Mode Info */}
        {!isOnline && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Offline Mode Active</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Working with cached data. Changes save locally and sync automatically when back
                  online.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">How offline sync works:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Data downloads automatically when you log in</li>
            <li>Changes sync automatically when connection is restored</li>
            <li>No confirmation needed - sync happens silently in background</li>
            <li>Download manually if you need the latest data before going offline</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
