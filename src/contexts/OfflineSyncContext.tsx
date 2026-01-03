import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUnifiedOfflineSync } from '@/hooks/useUnifiedOfflineSync';

interface OfflineSyncContextType {
  isOnline: boolean;
  pendingCount: number;
  syncInProgress: boolean;
  downloadInProgress: boolean;
  lastDataRefresh: Date | null;
  getOfflineData: <T = any>(tableName: string, filter?: any) => Promise<T[]>;
  queueOperation: (
    tableName: string,
    recordId: string,
    operation: 'insert' | 'update' | 'delete',
    data: any
  ) => Promise<void>;
  queueMediaUpload: (
    tableName: string,
    recordId: string,
    blob: Blob,
    fileName: string,
    metadata?: any
  ) => Promise<string>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export const useOfflineSyncContext = () => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSyncContext must be used within OfflineSyncProvider');
  }
  return context;
};

interface OfflineSyncProviderProps {
  children: ReactNode;
}

export const OfflineSyncProvider: React.FC<OfflineSyncProviderProps> = ({ children }) => {
  const { user, session } = useAuth();
  const hasInitialized = useRef(false);
  
  const {
    isOnline,
    pendingCount,
    syncInProgress,
    downloadInProgress,
    lastDataRefresh,
    downloadAllData,
    getOfflineData,
    queueOperation,
    queueMediaUpload,
    syncPendingChanges,
    storeOfflineSession,
  } = useUnifiedOfflineSync();

  // Auto-download data on login when online
  useEffect(() => {
    if (user && session && isOnline && !hasInitialized.current) {
      hasInitialized.current = true;
      
      // Store offline session for offline authentication
      storeOfflineSession(user.id, user.email || '', { session });
      
      // Silently download data in background
      downloadAllData({ silent: true });
    }
    
    // Reset initialization flag when user logs out
    if (!user) {
      hasInitialized.current = false;
    }
  }, [user, session, isOnline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncInProgress) {
      syncPendingChanges({ silent: true });
    }
  }, [isOnline, pendingCount]);

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        pendingCount,
        syncInProgress,
        downloadInProgress,
        lastDataRefresh,
        getOfflineData,
        queueOperation,
        queueMediaUpload,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};
