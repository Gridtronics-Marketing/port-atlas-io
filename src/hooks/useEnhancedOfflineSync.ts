// This file is deprecated. Use useUnifiedOfflineSync instead.
// Kept for backward compatibility - re-exports from unified sync.

import { useUnifiedOfflineSync } from './useUnifiedOfflineSync';

/**
 * @deprecated Use useUnifiedOfflineSync instead
 */
export const useEnhancedOfflineSync = () => {
  const sync = useUnifiedOfflineSync();
  
  return {
    isOnline: sync.isOnline,
    offlineMode: !sync.isOnline,
    syncInProgress: sync.syncInProgress,
    downloadInProgress: sync.downloadInProgress,
    pendingCount: sync.pendingCount,
    lastDataRefresh: sync.lastDataRefresh,
    storeOfflineSession: sync.storeOfflineSession,
    isOfflineSessionValid: sync.isOfflineSessionValid,
    clearOfflineSession: sync.clearAllOfflineData,
    downloadAllData: () => sync.downloadAllData({ silent: false }),
    getOfflineData: sync.getOfflineData,
    queueOperation: sync.queueOperation,
    syncPendingChanges: () => sync.syncPendingChanges({ silent: false }),
    refreshOfflineData: () => sync.downloadAllData({ silent: false }),
    clearAllOfflineData: sync.clearAllOfflineData,
  };
};
