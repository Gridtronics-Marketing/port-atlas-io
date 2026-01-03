import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedOfflineSync } from './useUnifiedOfflineSync';

interface UseOfflineDataOptions {
  tableName: string;
  filter?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  select?: string;
  dependencies?: any[];
}

export const useOfflineDataHook = <T extends { id: string }>(options: UseOfflineDataOptions) => {
  const { tableName, filter, orderBy, select = '*', dependencies = [] } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { isOnline, getOfflineData, queueOperation } = useUnifiedOfflineSync();

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // If offline, use cached data
      if (!isOnline) {
        const offlineData = await getOfflineData<T>(tableName, filter);

        // Apply ordering if specified
        if (orderBy) {
          offlineData.sort((a: any, b: any) => {
            const aVal = a[orderBy.column];
            const bVal = b[orderBy.column];

            if (aVal < bVal) return orderBy.ascending !== false ? -1 : 1;
            if (aVal > bVal) return orderBy.ascending !== false ? 1 : -1;
            return 0;
          });
        }

        setData(offlineData);
        return;
      }

      // Online mode - fetch from Supabase
      let query = (supabase as any).from(tableName).select(select);

      // Apply filters
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData(fetchedData || []);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err as Error);

      // Fallback to offline data if online fetch fails
      try {
        const fallbackData = await getOfflineData<T>(tableName, filter);
        if (fallbackData.length > 0) {
          setData(fallbackData);
        }
      } catch (offlineError) {
        console.error('Error loading offline fallback:', offlineError);
      }
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (newData: Omit<T, 'id'>) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const itemWithId = { id: tempId, ...newData } as T;

    try {
      // Optimistically update local state
      setData((prev) => [itemWithId, ...prev]);

      if (isOnline) {
        // Online mode - insert to Supabase
        const { data: insertedData, error } = await (supabase as any)
          .from(tableName)
          .insert(newData)
          .select()
          .single();

        if (error) throw error;

        // Update local state with real data
        setData((prev) => prev.map((item) => (item.id === tempId ? insertedData : item)));
      } else {
        // Offline mode - queue operation silently
        await queueOperation(tableName, tempId, 'insert', itemWithId);
      }

      return itemWithId;
    } catch (error) {
      // Revert optimistic update on error
      setData((prev) => prev.filter((item) => item.id !== tempId));
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<T>) => {
    const originalData = [...data];

    try {
      // Optimistically update local state
      setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));

      if (isOnline) {
        // Online mode - update in Supabase
        const { error } = await (supabase as any).from(tableName).update(updates).eq('id', id);

        if (error) throw error;
      } else {
        // Offline mode - queue operation silently
        await queueOperation(tableName, id, 'update', updates);
      }
    } catch (error) {
      // Revert optimistic update on error
      setData(originalData);
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    const originalData = [...data];

    try {
      // Optimistically update local state
      setData((prev) => prev.filter((item) => item.id !== id));

      if (isOnline) {
        // Online mode - delete from Supabase
        const { error } = await (supabase as any).from(tableName).delete().eq('id', id);

        if (error) throw error;
      } else {
        // Offline mode - queue operation silently
        await queueOperation(tableName, id, 'delete', {});
      }
    } catch (error) {
      // Revert optimistic update on error
      setData(originalData);
      throw error;
    }
  };

  const refetch = () => {
    fetchData();
  };

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [tableName, JSON.stringify(filter), JSON.stringify(orderBy), isOnline, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    addItem,
    updateItem,
    deleteItem,
    isOffline: !isOnline,
  };
};
