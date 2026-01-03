import { useState, useEffect, useCallback, useRef } from 'react';
import Dexie, { Table } from 'dexie';
import { supabase } from '@/integrations/supabase/client';

// Unified interfaces
interface SyncQueueItem {
  id?: number;
  tableName: string;
  recordId: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: number; // 0 = pending, 1 = synced
  retryCount: number;
}

interface OfflineRecord {
  tableName: string;
  recordId: string;
  data: any;
  pendingSync: boolean;
  lastModified: number;
}

interface MediaQueueItem {
  id?: number;
  tableName: string;
  recordId: string;
  blob: Blob;
  fileName: string;
  metadata: any;
  queuedAt: number;
  attempts: number;
}

interface OfflineSession {
  userId: string;
  email: string;
  sessionData: any;
  lastLogin: number;
  dataDownloadedAt: number;
  expiresAt: number;
}

interface BulkDataCache {
  tableName: string;
  data: any[];
  lastFetched: number;
  totalRecords: number;
}

// Unified Dexie database
class UnifiedOfflineDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem>;
  offlineData!: Table<OfflineRecord>;
  mediaQueue!: Table<MediaQueueItem>;
  offlineSessions!: Table<OfflineSession>;
  bulkDataCache!: Table<BulkDataCache>;

  constructor() {
    super('PortAtlasUnifiedOfflineDB');
    this.version(1).stores({
      syncQueue: '++id, tableName, recordId, operation, timestamp, synced',
      offlineData: '[tableName+recordId], tableName, recordId, pendingSync, lastModified',
      mediaQueue: '++id, tableName, recordId, queuedAt, attempts',
      offlineSessions: 'userId, email, lastLogin, expiresAt',
      bulkDataCache: 'tableName, lastFetched, totalRecords',
    });
  }
}

const db = new UnifiedOfflineDatabase();

// Tables to cache for offline access
const CACHEABLE_TABLES = [
  'clients',
  'projects',
  'locations',
  'employees',
  'work_orders',
  'equipment',
  'backbone_cables',
  'distribution_frames',
  'cable_junction_boxes',
  'drop_points',
  'drop_point_photos',
  'maintenance_schedules',
  'contracts',
  'device_ports',
  'network_devices',
  'canvas_drawings',
  'room_view_photos',
  'daily_logs',
];

interface SilentOptions {
  silent?: boolean;
}

export const useUnifiedOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastDataRefresh, setLastDataRefresh] = useState<Date | null>(null);
  const syncLock = useRef(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    updatePendingCount();
    checkLastDataRefresh();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = useCallback(async () => {
    try {
      const syncCount = await db.syncQueue.where('synced').equals(0).count();
      const mediaCount = await db.mediaQueue.count();
      setPendingCount(syncCount + mediaCount);
    } catch (error) {
      console.error('[OfflineSync] Error updating pending count:', error);
    }
  }, []);

  const checkLastDataRefresh = useCallback(async () => {
    try {
      const cacheEntries = await db.bulkDataCache.toArray();
      if (cacheEntries.length > 0) {
        const latestRefresh = Math.max(...cacheEntries.map((c) => c.lastFetched));
        setLastDataRefresh(new Date(latestRefresh));
      }
    } catch (error) {
      console.error('[OfflineSync] Error checking last data refresh:', error);
    }
  }, []);

  const storeOfflineSession = useCallback(
    async (userId: string, email: string, sessionData: any) => {
      try {
        const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
        await db.offlineSessions.put({
          userId,
          email,
          sessionData,
          lastLogin: Date.now(),
          dataDownloadedAt: Date.now(),
          expiresAt,
        });
      } catch (error) {
        console.error('[OfflineSync] Error storing offline session:', error);
      }
    },
    []
  );

  const isOfflineSessionValid = useCallback(async (): Promise<boolean> => {
    try {
      const sessions = await db.offlineSessions.toArray();
      const validSession = sessions.find((s) => s.expiresAt > Date.now());
      return !!validSession;
    } catch (error) {
      console.error('[OfflineSync] Error checking offline session validity:', error);
      return false;
    }
  }, []);

  const downloadAllData = useCallback(
    async (options: SilentOptions = {}): Promise<boolean> => {
      if (!isOnline || downloadInProgress) {
        return false;
      }

      setDownloadInProgress(true);
      let totalDownloaded = 0;

      try {
        for (const tableName of CACHEABLE_TABLES) {
          try {
            const { data, error } = await (supabase as any)
              .from(tableName)
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1000);

            if (error) {
              console.warn(`[OfflineSync] Error downloading ${tableName}:`, error.message);
              continue;
            }

            if (data && data.length > 0) {
              // Store in bulk cache
              await db.bulkDataCache.put({
                tableName,
                data,
                lastFetched: Date.now(),
                totalRecords: data.length,
              });

              // Store individual records for querying
              for (const record of data) {
                await db.offlineData.put({
                  tableName,
                  recordId: record.id,
                  data: record,
                  pendingSync: false,
                  lastModified: Date.now(),
                });
              }

              totalDownloaded += data.length;
            }
          } catch (error) {
            console.warn(`[OfflineSync] Failed to download ${tableName}:`, error);
          }
        }

        setLastDataRefresh(new Date());
        console.log(`[OfflineSync] Downloaded ${totalDownloaded} records for offline access`);
        return true;
      } catch (error) {
        console.error('[OfflineSync] Error during bulk download:', error);
        return false;
      } finally {
        setDownloadInProgress(false);
      }
    },
    [isOnline, downloadInProgress]
  );

  const getOfflineData = useCallback(
    async <T = any>(tableName: string, filter?: any): Promise<T[]> => {
      try {
        // First try bulk cache
        const bulkCache = await db.bulkDataCache.get(tableName);
        if (bulkCache && bulkCache.data) {
          let data = bulkCache.data;

          if (filter) {
            data = data.filter((item: any) => {
              for (const [key, value] of Object.entries(filter)) {
                if (item[key] !== value) return false;
              }
              return true;
            });
          }

          return data;
        }

        // Fallback to individual records
        const items = await db.offlineData.where('tableName').equals(tableName).toArray();
        let data = items.map((item) => item.data);

        if (filter) {
          data = data.filter((item: any) => {
            for (const [key, value] of Object.entries(filter)) {
              if (item[key] !== value) return false;
            }
            return true;
          });
        }

        return data;
      } catch (error) {
        console.error('[OfflineSync] Error getting offline data:', error);
        return [];
      }
    },
    []
  );

  const queueOperation = useCallback(
    async (
      tableName: string,
      recordId: string,
      operation: 'insert' | 'update' | 'delete',
      data: any
    ) => {
      try {
        // Add to sync queue
        await db.syncQueue.add({
          tableName,
          recordId,
          operation,
          data: { ...data, updated_at: new Date().toISOString() },
          timestamp: Date.now(),
          synced: 0,
          retryCount: 0,
        });

        // Update local data immediately
        if (operation !== 'delete') {
          await db.offlineData.put({
            tableName,
            recordId,
            data: { id: recordId, ...data },
            pendingSync: true,
            lastModified: Date.now(),
          });

          // Update bulk cache
          const bulkCache = await db.bulkDataCache.get(tableName);
          if (bulkCache) {
            const updatedData = [...bulkCache.data];
            const existingIndex = updatedData.findIndex((item) => item.id === recordId);

            if (existingIndex >= 0 && operation === 'update') {
              updatedData[existingIndex] = { ...updatedData[existingIndex], ...data };
            } else if (operation === 'insert') {
              updatedData.unshift({ id: recordId, ...data });
            }

            await db.bulkDataCache.put({
              ...bulkCache,
              data: updatedData,
              totalRecords: updatedData.length,
            });
          }
        } else {
          await db.offlineData.delete([tableName, recordId]);

          const bulkCache = await db.bulkDataCache.get(tableName);
          if (bulkCache) {
            const updatedData = bulkCache.data.filter((item: any) => item.id !== recordId);
            await db.bulkDataCache.put({
              ...bulkCache,
              data: updatedData,
              totalRecords: updatedData.length,
            });
          }
        }

        await updatePendingCount();

        // Silent auto-sync if online
        if (isOnline) {
          syncPendingChanges({ silent: true });
        }
      } catch (error) {
        console.error('[OfflineSync] Error queuing operation:', error);
        throw error;
      }
    },
    [isOnline, updatePendingCount]
  );

  const queueMediaUpload = useCallback(
    async (
      tableName: string,
      recordId: string,
      blob: Blob,
      fileName: string,
      metadata?: any
    ): Promise<string> => {
      try {
        const id = await db.mediaQueue.add({
          tableName,
          recordId,
          blob,
          fileName,
          metadata: metadata || {},
          queuedAt: Date.now(),
          attempts: 0,
        });

        await updatePendingCount();

        // Silent auto-sync if online
        if (isOnline) {
          syncMediaQueue({ silent: true });
        }

        return String(id);
      } catch (error) {
        console.error('[OfflineSync] Error queuing media upload:', error);
        throw error;
      }
    },
    [isOnline, updatePendingCount]
  );

  const syncMediaQueue = useCallback(
    async (options: SilentOptions = {}) => {
      if (!isOnline) return;

      try {
        const queuedMedia = await db.mediaQueue.toArray();

        for (const media of queuedMedia) {
          try {
            // Update attempt count
            await db.mediaQueue.update(media.id!, {
              attempts: media.attempts + 1,
            });

            // Determine bucket based on table
            const bucket = media.tableName === 'drop_point_photos' ? 'room-views' : 'room-views';

            // Upload to storage
            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(media.fileName, media.blob, {
                contentType: media.blob.type,
                upsert: true,
              });

            if (uploadError) throw uploadError;

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage.from(bucket).getPublicUrl(media.fileName);

            // Insert record to database
            const { error: dbError } = await (supabase as any).from(media.tableName).insert({
              ...media.metadata,
              photo_url: publicUrl,
            });

            if (dbError) throw dbError;

            // Remove from queue on success
            await db.mediaQueue.delete(media.id!);
          } catch (error) {
            console.error(`[OfflineSync] Error syncing media ${media.id}:`, error);

            // Remove after 5 failed attempts
            if (media.attempts >= 5) {
              await db.mediaQueue.delete(media.id!);
              console.log(`[OfflineSync] Removed media ${media.id} after 5 failed attempts`);
            }
          }
        }

        await updatePendingCount();
      } catch (error) {
        console.error('[OfflineSync] Error syncing media queue:', error);
      }
    },
    [isOnline, updatePendingCount]
  );

  const syncPendingChanges = useCallback(
    async (options: SilentOptions = {}) => {
      if (syncInProgress || !isOnline || syncLock.current) return;

      syncLock.current = true;
      setSyncInProgress(true);

      try {
        // Sync data operations
        const pendingItems = await db.syncQueue
          .where('synced')
          .equals(0)
          .sortBy('timestamp');

        for (const item of pendingItems) {
          try {
            let result;

            switch (item.operation) {
              case 'insert':
                // Remove temp ID for insert, let DB generate
                const insertData = { ...item.data };
                if (insertData.id?.startsWith('temp_')) {
                  delete insertData.id;
                }
                result = await (supabase as any).from(item.tableName).insert(insertData);
                break;
              case 'update':
                result = await (supabase as any)
                  .from(item.tableName)
                  .update(item.data)
                  .eq('id', item.recordId);
                break;
              case 'delete':
                result = await (supabase as any)
                  .from(item.tableName)
                  .delete()
                  .eq('id', item.recordId);
                break;
            }

            if (result?.error) {
              console.error(`[OfflineSync] Sync error for ${item.tableName}:`, result.error);
              // Mark as synced anyway to prevent infinite retries (last-write-wins)
            }

            // Mark as synced
            await db.syncQueue.update(item.id!, { synced: 1 });

            // Clear pending flag on offline data
            await db.offlineData.update([item.tableName, item.recordId], {
              pendingSync: false,
            });
          } catch (error) {
            console.error(`[OfflineSync] Error syncing ${item.tableName}:`, error);
            
            // Increment retry count
            const newRetryCount = (item.retryCount || 0) + 1;
            if (newRetryCount >= 5) {
              // Mark as synced after 5 retries to prevent blocking
              await db.syncQueue.update(item.id!, { synced: 1 });
            } else {
              await db.syncQueue.update(item.id!, { retryCount: newRetryCount });
            }
          }
        }

        // Also sync media queue
        await syncMediaQueue(options);

        await updatePendingCount();
      } catch (error) {
        console.error('[OfflineSync] Error during sync:', error);
      } finally {
        setSyncInProgress(false);
        syncLock.current = false;
      }
    },
    [isOnline, syncInProgress, updatePendingCount, syncMediaQueue]
  );

  const clearAllOfflineData = useCallback(async () => {
    try {
      await db.offlineData.clear();
      await db.bulkDataCache.clear();
      await db.offlineSessions.clear();
      await db.syncQueue.clear();
      await db.mediaQueue.clear();
      setLastDataRefresh(null);
      setPendingCount(0);
      console.log('[OfflineSync] All offline data cleared');
    } catch (error) {
      console.error('[OfflineSync] Error clearing offline data:', error);
    }
  }, []);

  return {
    // Status
    isOnline,
    syncInProgress,
    downloadInProgress,
    pendingCount,
    lastDataRefresh,

    // Session management
    storeOfflineSession,
    isOfflineSessionValid,

    // Data management
    downloadAllData,
    getOfflineData,
    queueOperation,
    queueMediaUpload,
    syncPendingChanges,
    clearAllOfflineData,
  };
};
