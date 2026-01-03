// This file is deprecated. Media uploads are now handled by useUnifiedOfflineSync.
// Kept for backward compatibility.

import { useUnifiedOfflineSync } from './useUnifiedOfflineSync';

/**
 * @deprecated Use useUnifiedOfflineSync.queueMediaUpload instead
 */
export const useOfflinePhotoQueue = () => {
  const sync = useUnifiedOfflineSync();

  return {
    isOnline: sync.isOnline,
    queueSize: sync.pendingCount,
    isSyncing: sync.syncInProgress,
    queuePhoto: async (
      dropPointId: string,
      photoBlob: Blob,
      fileName: string,
      description?: string,
      photoType?: string,
      metadata?: any
    ) => {
      return sync.queueMediaUpload('drop_point_photos', dropPointId, photoBlob, fileName, {
        drop_point_id: dropPointId,
        description,
        photo_type: photoType || 'standard',
        annotation_metadata: metadata || {},
      });
    },
    syncQueue: () => sync.syncPendingChanges({ silent: true }),
    clearQueue: sync.clearAllOfflineData,
    getQueuedPhotos: async () => [],
  };
};
