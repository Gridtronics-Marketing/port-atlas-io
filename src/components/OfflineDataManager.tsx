import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnhancedOfflineSync } from '@/hooks/useEnhancedOfflineSync';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  Clock, 
  Database,
  Trash2,
  CheckCircle 
} from 'lucide-react';

export const OfflineDataManager = () => {
  const {
    isOnline,
    offlineMode,
    syncInProgress,
    downloadInProgress,
    pendingCount,
    lastDataRefresh,
    downloadAllData,
    syncPendingChanges,
    refreshOfflineData,
    clearAllOfflineData,
  } = useEnhancedOfflineSync();

  const formatLastRefresh = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
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
              Manage offline data synchronization and caching
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {offlineMode && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Offline Mode
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {pendingCount} Pending
              </Badge>
            )}
          </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={syncPendingChanges}
              disabled={syncInProgress}
            >
              {syncInProgress ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAllData}
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
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshOfflineData}
                  disabled={downloadInProgress}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Cache
                </Button>
              </>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllOfflineData}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Data
            </Button>
          </div>
        </div>

        {/* Offline Mode Info */}
        {offlineMode && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Database className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Offline Mode Active</p>
                <p className="text-sm text-blue-700 mt-1">
                  You're working with cached data. Changes will be saved locally and synced when you're back online.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">Tips for offline work:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Download data before going offline for full functionality</li>
            <li>Changes made offline will sync automatically when reconnected</li>
            <li>Data is cached locally for 8 hours after login</li>
            <li>Refresh cache regularly to get the latest updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};