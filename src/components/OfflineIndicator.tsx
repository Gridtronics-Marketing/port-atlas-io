import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RotateCcw, Clock, Signal } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, syncInProgress, pendingCount, syncPendingChanges } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Wifi className="h-6 w-6 text-green-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-green-800">Online</span>
            <span className="text-xs text-green-600">All synced</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 shadow-lg">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
        isOnline 
          ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300' 
          : 'bg-gradient-to-r from-red-100 to-rose-100 border border-red-300 animate-pulse'
      }`}>
        <div className="relative">
          {isOnline ? (
            <Wifi className="h-6 w-6 text-amber-700" />
          ) : (
            <WifiOff className="h-6 w-6 text-red-600" />
          )}
          {!isOnline && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-semibold ${isOnline ? 'text-amber-800' : 'text-red-800'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <span className={`text-xs ${isOnline ? 'text-amber-600' : 'text-red-600'}`}>
            {isOnline ? 'Connected' : 'No connection'}
          </span>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-blue-800">{pendingCount} pending</span>
                <span className="text-xs text-blue-600">items to sync</span>
              </div>
            </div>
          </div>

          {isOnline && !syncInProgress && (
            <Button
              size="lg"
              onClick={syncPendingChanges}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary-foreground hover:from-primary/90 hover:to-primary-foreground/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">Sync Now</span>
                <span className="text-xs opacity-90">Push changes</span>
              </div>
            </Button>
          )}

          {syncInProgress && (
            <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-300 shadow-sm">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-indigo-600 animate-spin" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-indigo-800">Syncing...</span>
                  <span className="text-xs text-indigo-600">Please wait</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};