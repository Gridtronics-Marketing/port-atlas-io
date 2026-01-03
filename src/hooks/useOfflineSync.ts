// This file is deprecated. Use useUnifiedOfflineSync instead.
// Kept for backward compatibility.

import { useUnifiedOfflineSync } from './useUnifiedOfflineSync';

/**
 * @deprecated Use useUnifiedOfflineSync instead
 */
export const useOfflineSync = () => {
  const sync = useUnifiedOfflineSync();
  
  return {
    isOnline: sync.isOnline,
    syncInProgress: sync.syncInProgress,
    pendingCount: sync.pendingCount,
    queueOperation: sync.queueOperation,
    getOfflineData: sync.getOfflineData,
    syncPendingChanges: () => sync.syncPendingChanges({ silent: true }),
    clearSyncedItems: async () => {}, // No longer needed
  };
};
