import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RotateCcw, Clock } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, syncInProgress, pendingCount, syncPendingChanges } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return (
      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isOnline ? "secondary" : "destructive"}
        className={isOnline ? "bg-amber-100 text-amber-800 border-amber-200" : ""}
      >
        {isOnline ? (
          <Wifi className="h-3 w-3 mr-1" />
        ) : (
          <WifiOff className="h-3 w-3 mr-1" />
        )}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>

      {pendingCount > 0 && (
        <>
          <Badge variant="outline" className="bg-background">
            <Clock className="h-3 w-3 mr-1" />
            {pendingCount} pending
          </Badge>

          {isOnline && !syncInProgress && (
            <Button
              size="sm"
              variant="outline"
              onClick={syncPendingChanges}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Sync Now
            </Button>
          )}

          {syncInProgress && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
              Syncing...
            </Badge>
          )}
        </>
      )}
    </div>
  );
};