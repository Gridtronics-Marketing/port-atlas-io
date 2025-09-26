import { useState, useEffect } from 'react';
import Dexie, { Table } from 'dexie';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncQueueItem {
  id?: number;
  tableName: string;
  recordId: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: number; // 0 = false, 1 = true for Dexie compatibility
}

interface OfflineData {
  tableName: string;
  recordId: string;
  data: any;
  lastModified: number;
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

class EnhancedOfflineDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem>;
  offlineData!: Table<OfflineData>;
  offlineSessions!: Table<OfflineSession>;
  bulkDataCache!: Table<BulkDataCache>;

  constructor() {
    super('EnhancedFieldTechOfflineDB');
    this.version(1).stores({
      syncQueue: '++id, tableName, recordId, operation, timestamp, synced',
      offlineData: '[tableName+recordId], tableName, recordId, lastModified',
      offlineSessions: 'userId, email, lastLogin, expiresAt',
      bulkDataCache: 'tableName, lastFetched, totalRecords'
    });
  }
}

const db = new EnhancedOfflineDatabase();

// Tables to cache for offline access
const CACHEABLE_TABLES = [
  'clients', 'projects', 'locations', 'employees', 
  'work_orders', 'equipment', 'backbone_cables', 
  'distribution_frames', 'cable_junction_boxes',
  'drop_points', 'maintenance_schedules', 'contracts',
  'device_ports', 'network_devices'
];

export const useEnhancedOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastDataRefresh, setLastDataRefresh] = useState<Date | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (offlineMode) {
        syncPendingChanges();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count and offline session on mount
    updatePendingCount();
    checkOfflineSession();
    checkLastDataRefresh();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const count = await db.syncQueue.where('synced').equals(0).count();
      setPendingCount(count);
    } catch (error) {
      console.error('Error updating pending count:', error);
    }
  };

  const checkOfflineSession = async () => {
    try {
      const sessions = await db.offlineSessions.toArray();
      const validSession = sessions.find(s => s.expiresAt > Date.now());
      setOfflineMode(!!validSession);
    } catch (error) {
      console.error('Error checking offline session:', error);
    }
  };

  const checkLastDataRefresh = async () => {
    try {
      const cacheEntries = await db.bulkDataCache.toArray();
      if (cacheEntries.length > 0) {
        const latestRefresh = Math.max(...cacheEntries.map(c => c.lastFetched));
        setLastDataRefresh(new Date(latestRefresh));
      }
    } catch (error) {
      console.error('Error checking last data refresh:', error);
    }
  };

  const storeOfflineSession = async (userId: string, email: string, sessionData: any) => {
    try {
      const expiresAt = Date.now() + (8 * 60 * 60 * 1000); // 8 hours
      await db.offlineSessions.put({
        userId,
        email,
        sessionData,
        lastLogin: Date.now(),
        dataDownloadedAt: Date.now(),
        expiresAt
      });
      setOfflineMode(true);
    } catch (error) {
      console.error('Error storing offline session:', error);
    }
  };

  const isOfflineSessionValid = async (): Promise<boolean> => {
    try {
      const sessions = await db.offlineSessions.toArray();
      const validSession = sessions.find(s => s.expiresAt > Date.now());
      return !!validSession;
    } catch (error) {
      console.error('Error checking offline session validity:', error);
      return false;
    }
  };

  const clearOfflineSession = async () => {
    try {
      await db.offlineSessions.clear();
      setOfflineMode(false);
    } catch (error) {
      console.error('Error clearing offline session:', error);
    }
  };

  const downloadAllData = async (): Promise<boolean> => {
    if (!isOnline) {
      toast({
        title: "Connection Required",
        description: "Please connect to the internet to download data for offline use.",
        variant: "destructive",
      });
      return false;
    }

    setDownloadInProgress(true);
    let totalDownloaded = 0;

    try {
      toast({
        title: "Downloading Data",
        description: "Preparing data for offline use...",
      });

      for (const tableName of CACHEABLE_TABLES) {
        try {
          const { data, error } = await (supabase as any)
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (data && data.length > 0) {
            // Store in bulk cache
            await db.bulkDataCache.put({
              tableName,
              data,
              lastFetched: Date.now(),
              totalRecords: data.length
            });

            // Also store individual records for querying
            for (const record of data) {
              await db.offlineData.put({
                tableName,
                recordId: record.id,
                data: record,
                lastModified: Date.now()
              });
            }

            totalDownloaded += data.length;
          }
        } catch (error) {
          console.error(`Error downloading ${tableName}:`, error);
          // Continue with other tables even if one fails
        }
      }

      setLastDataRefresh(new Date());
      
      toast({
        title: "Download Complete",
        description: `Downloaded ${totalDownloaded} records for offline access.`,
      });

      return true;
    } catch (error) {
      console.error('Error during bulk download:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download data for offline use.",
        variant: "destructive",
      });
      return false;
    } finally {
      setDownloadInProgress(false);
    }
  };

  const getOfflineData = async <T = any>(tableName: string, filter?: any): Promise<T[]> => {
    try {
      // First try to get from bulk cache
      const bulkCache = await db.bulkDataCache.get(tableName);
      if (bulkCache && bulkCache.data) {
        let data = bulkCache.data;
        
        // Apply basic filtering if provided
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
      let data = items.map(item => ({ id: item.recordId, ...item.data }));

      // Apply basic filtering if provided
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
      console.error('Error getting offline data:', error);
      return [];
    }
  };

  const queueOperation = async (
    tableName: string,
    recordId: string,
    operation: 'insert' | 'update' | 'delete',
    data: any
  ) => {
    try {
      await db.syncQueue.add({
        tableName,
        recordId,
        operation,
        data,
        timestamp: Date.now(),
        synced: 0
      });

      // Update local data immediately for offline access
      if (operation !== 'delete') {
        await db.offlineData.put({
          tableName,
          recordId,
          data,
          lastModified: Date.now()
        });

        // Update bulk cache if it exists
        const bulkCache = await db.bulkDataCache.get(tableName);
        if (bulkCache) {
          const updatedData = [...bulkCache.data];
          const existingIndex = updatedData.findIndex(item => item.id === recordId);
          
          if (existingIndex >= 0 && operation === 'update') {
            updatedData[existingIndex] = { ...updatedData[existingIndex], ...data };
          } else if (operation === 'insert') {
            updatedData.unshift({ id: recordId, ...data });
          }

          await db.bulkDataCache.put({
            ...bulkCache,
            data: updatedData,
            totalRecords: updatedData.length
          });
        }
      } else {
        await db.offlineData.delete([tableName, recordId]);
        
        // Update bulk cache for deletes
        const bulkCache = await db.bulkDataCache.get(tableName);
        if (bulkCache) {
          const updatedData = bulkCache.data.filter((item: any) => item.id !== recordId);
          await db.bulkDataCache.put({
            ...bulkCache,
            data: updatedData,
            totalRecords: updatedData.length
          });
        }
      }

      await updatePendingCount();

      if (isOnline && !offlineMode) {
        syncPendingChanges();
      } else {
        toast({
          title: "Saved Offline",
          description: "Changes will sync when connection is restored.",
        });
      }
    } catch (error) {
      console.error('Error queuing operation:', error);
      toast({
        title: "Error",
        description: "Failed to save changes offline.",
        variant: "destructive",
      });
    }
  };

  const syncPendingChanges = async () => {
    if (syncInProgress || (!isOnline && !offlineMode)) return;

    setSyncInProgress(true);
    
    try {
      const pendingItems = await db.syncQueue.where('synced').equals(0).toArray();
      let successCount = 0;
      
      for (const item of pendingItems) {
        try {
          let result;
          
          switch (item.operation) {
            case 'insert':
              result = await (supabase as any).from(item.tableName).insert(item.data);
              break;
            case 'update':
              result = await (supabase as any).from(item.tableName)
                .update(item.data)
                .eq('id', item.recordId);
              break;
            case 'delete':
              result = await (supabase as any).from(item.tableName)
                .delete()
                .eq('id', item.recordId);
              break;
          }

          if (result?.error) {
            throw result.error;
          }

          // Mark as synced
          await db.syncQueue.update(item.id!, { synced: 1 });
          successCount++;
        } catch (error) {
          console.error(`Error syncing ${item.operation} for ${item.tableName}:`, error);
          // Don't mark as synced if there was an error
        }
      }

      await updatePendingCount();
      
      if (successCount > 0) {
        toast({
          title: "Sync Complete",
          description: `${successCount} changes synced successfully.`,
        });
      }
    } catch (error) {
      console.error('Error during sync:', error);
      toast({
        title: "Sync Error",
        description: "Some changes could not be synced.",
        variant: "destructive",
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  const refreshOfflineData = async () => {
    if (!isOnline) {
      toast({
        title: "Connection Required",
        description: "Please connect to the internet to refresh data.",
        variant: "destructive",
      });
      return;
    }

    await downloadAllData();
  };

  const clearAllOfflineData = async () => {
    try {
      await db.offlineData.clear();
      await db.bulkDataCache.clear();
      await db.offlineSessions.clear();
      await db.syncQueue.clear();
      setOfflineMode(false);
      setLastDataRefresh(null);
      setPendingCount(0);
      
      toast({
        title: "Offline Data Cleared",
        description: "All offline data has been removed.",
      });
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  };

  return {
    // Status
    isOnline,
    offlineMode,
    syncInProgress,
    downloadInProgress,
    pendingCount,
    lastDataRefresh,
    
    // Session management
    storeOfflineSession,
    isOfflineSessionValid,
    clearOfflineSession,
    
    // Data management
    downloadAllData,
    getOfflineData,
    queueOperation,
    syncPendingChanges,
    refreshOfflineData,
    clearAllOfflineData,
  };
};