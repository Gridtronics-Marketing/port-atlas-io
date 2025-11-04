import { useState, useEffect, useCallback } from 'react';
import Dexie, { Table } from 'dexie';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QueuedPhoto {
  id: string;
  dropPointId: string;
  photoBlob: Blob;
  fileName: string;
  description?: string;
  photoType?: string;
  metadata?: any;
  queuedAt: Date;
  attempts: number;
  lastAttempt?: Date;
}

class OfflinePhotoDatabase extends Dexie {
  photoQueue!: Table<QueuedPhoto, string>;

  constructor() {
    super('OfflinePhotoQueue');
    this.version(1).stores({
      photoQueue: 'id, dropPointId, queuedAt, attempts'
    });
  }
}

const db = new OfflinePhotoDatabase();

export const useOfflinePhotoQueue = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Syncing queued photos...",
      });
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're Offline",
        description: "Photos will be queued for upload when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check queue size on mount
    updateQueueSize();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateQueueSize = useCallback(async () => {
    const count = await db.photoQueue.count();
    setQueueSize(count);
  }, []);

  const queuePhoto = useCallback(async (
    dropPointId: string,
    photoBlob: Blob,
    fileName: string,
    description?: string,
    photoType?: string,
    metadata?: any
  ) => {
    try {
      const queuedPhoto: QueuedPhoto = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dropPointId,
        photoBlob,
        fileName,
        description,
        photoType,
        metadata,
        queuedAt: new Date(),
        attempts: 0,
      };

      await db.photoQueue.add(queuedPhoto);
      await updateQueueSize();

      toast({
        title: "Photo Queued",
        description: "Photo will be uploaded when connection is restored.",
      });

      // Try to sync immediately if online
      if (isOnline) {
        syncQueue();
      }

      return queuedPhoto.id;
    } catch (error) {
      console.error('Error queueing photo:', error);
      throw error;
    }
  }, [isOnline, updateQueueSize, toast]);

  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      const queuedPhotos = await db.photoQueue.toArray();
      
      if (queuedPhotos.length === 0) {
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const photo of queuedPhotos) {
        try {
          // Update attempt count
          await db.photoQueue.update(photo.id, {
            attempts: photo.attempts + 1,
            lastAttempt: new Date(),
          });

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('room-views')
            .upload(photo.fileName, photo.photoBlob, {
              contentType: photo.photoBlob.type,
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('room-views')
            .getPublicUrl(photo.fileName);

          // Get current user
          const { data: { user } } = await supabase.auth.getUser();

          // Save to database
          const { error: dbError } = await supabase
            .from('drop_point_photos')
            .insert({
              drop_point_id: photo.dropPointId,
              photo_url: publicUrl,
              description: photo.description,
              photo_type: photo.photoType || 'standard',
              annotation_metadata: photo.metadata || {},
              employee_id: user?.id,
            });

          if (dbError) throw dbError;

          // Remove from queue on success
          await db.photoQueue.delete(photo.id);
          successCount++;

        } catch (error) {
          console.error('Error uploading queued photo:', error);
          failCount++;

          // Remove from queue if too many failed attempts
          if (photo.attempts >= 5) {
            await db.photoQueue.delete(photo.id);
            console.log(`Removed photo ${photo.id} after 5 failed attempts`);
          }
        }
      }

      await updateQueueSize();

      if (successCount > 0) {
        toast({
          title: "Photos Synced",
          description: `Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}.`,
        });
      }

      if (failCount > 0) {
        toast({
          title: "Some Photos Failed",
          description: `${failCount} photo${failCount > 1 ? 's' : ''} could not be uploaded and will retry later.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error syncing photo queue:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updateQueueSize, toast]);

  const clearQueue = useCallback(async () => {
    await db.photoQueue.clear();
    await updateQueueSize();
    toast({
      title: "Queue Cleared",
      description: "All queued photos have been removed.",
    });
  }, [updateQueueSize, toast]);

  const getQueuedPhotos = useCallback(async () => {
    return await db.photoQueue.toArray();
  }, []);

  return {
    isOnline,
    queueSize,
    isSyncing,
    queuePhoto,
    syncQueue,
    clearQueue,
    getQueuedPhotos,
  };
};
