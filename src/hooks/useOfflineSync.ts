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
  synced: boolean;
}

interface OfflineData {
  tableName: string;
  recordId: string;
  data: any;
  lastModified: number;
}

class OfflineDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem>;
  offlineData!: Table<OfflineData>;

  constructor() {
    super('FieldTechOfflineDB');
    this.version(1).stores({
      syncQueue: '++id, tableName, recordId, operation, timestamp, synced',
      offlineData: '[tableName+recordId], tableName, recordId, lastModified'
    });
  }
}

const db = new OfflineDatabase();

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count on mount
    updatePendingCount();

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
        synced: false
      });

      // Store offline data for reads
      if (operation !== 'delete') {
        await db.offlineData.put({
          tableName,
          recordId,
          data,
          lastModified: Date.now()
        });
      } else {
        await db.offlineData.delete([tableName, recordId]);
      }

      await updatePendingCount();

      if (isOnline) {
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

  const getOfflineData = async (tableName: string): Promise<any[]> => {
    try {
      const items = await db.offlineData.where('tableName').equals(tableName).toArray();
      return items.map(item => ({ id: item.recordId, ...item.data }));
    } catch (error) {
      console.error('Error getting offline data:', error);
      return [];
    }
  };

  const syncPendingChanges = async () => {
    if (syncInProgress || !isOnline) return;

    setSyncInProgress(true);
    
    try {
      const pendingItems = await db.syncQueue.where('synced').equals(0).toArray();
      
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
          await db.syncQueue.update(item.id!, { synced: true });
        } catch (error) {
          console.error(`Error syncing ${item.operation} for ${item.tableName}:`, error);
          // Don't mark as synced if there was an error
        }
      }

      await updatePendingCount();
      
      if (pendingItems.length > 0) {
        toast({
          title: "Sync Complete",
          description: `${pendingItems.length} changes synced successfully.`,
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

  const clearSyncedItems = async () => {
    try {
      await db.syncQueue.where('synced').equals(1).delete();
      await updatePendingCount();
    } catch (error) {
      console.error('Error clearing synced items:', error);
    }
  };

  return {
    isOnline,
    syncInProgress,
    pendingCount,
    queueOperation,
    getOfflineData,
    syncPendingChanges,
    clearSyncedItems,
  };
};