import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CapturedPhoto {
  id: string;
  url: string;
  filename: string;
  category: string;
  description?: string;
  project_id?: string;
  location_id?: string;
  work_order_id?: string;
  employee_id: string;
  created_at: string;
}

export function usePhotoCapture() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkCameraPermission = async () => {
    try {
      const permission = await Camera.checkPermissions();
      if (permission.camera !== 'granted') {
        const requested = await Camera.requestPermissions();
        return requested.camera === 'granted';
      }
      return true;
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  };

  const capturePhoto = async (
    category: string = 'progress',
    description?: string,
    projectId?: string,
    locationId?: string,
    workOrderId?: string,
    employeeId?: string
  ): Promise<CapturedPhoto | null> => {
    if (!employeeId) {
      toast({
        title: 'Error',
        description: 'Employee ID is required',
        variant: 'destructive',
      });
      return null;
    }

    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      toast({
        title: 'Permission Required',
        description: 'Camera permission is required to take photos',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (!image.dataUrl) {
        throw new Error('No image data received');
      }

      // Convert dataUrl to blob
      const response = await fetch(image.dataUrl);
      const blob = await response.blob();
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${category}-${timestamp}.jpg`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('floor-plans') // Using existing bucket
        .upload(`photos/${filename}`, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(`photos/${filename}`);

      // Store photo metadata in daily_logs table with photos array
      const photoMetadata = {
        url: urlData.publicUrl,
        filename,
        category,
        description,
        captured_at: new Date().toISOString(),
      };

      // If we have context (project, location, work order), create a daily log entry
      if (projectId || locationId || workOrderId) {
        const { data: logData, error: logError } = await supabase
          .from('daily_logs')
          .insert({
            employee_id: employeeId,
            project_id: projectId || undefined,
            location_id: locationId || undefined,
            work_order_id: workOrderId || undefined,
            log_date: new Date().toISOString().split('T')[0],
            work_description: `Photo captured: ${category}${description ? ` - ${description}` : ''}`,
            photos: [urlData.publicUrl],
            hours_worked: 0,
          })
          .select()
          .single();

        if (logError) throw logError;
      }

      const capturedPhoto: CapturedPhoto = {
        id: uploadData.id || crypto.randomUUID(),
        url: urlData.publicUrl,
        filename,
        category,
        description,
        project_id: projectId,
        location_id: locationId,
        work_order_id: workOrderId,
        employee_id: employeeId,
        created_at: new Date().toISOString(),
      };

      toast({
        title: 'Success',
        description: 'Photo captured and uploaded successfully',
      });

      return capturedPhoto;
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to capture photo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const selectFromGallery = async (
    category: string = 'progress',
    description?: string,
    projectId?: string,
    locationId?: string,
    workOrderId?: string,
    employeeId?: string
  ): Promise<CapturedPhoto | null> => {
    if (!employeeId) {
      toast({
        title: 'Error',
        description: 'Employee ID is required',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (!image.dataUrl) {
        throw new Error('No image data received');
      }

      // Convert dataUrl to blob
      const response = await fetch(image.dataUrl);
      const blob = await response.blob();
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${category}-${timestamp}.jpg`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(`photos/${filename}`, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(`photos/${filename}`);

      const capturedPhoto: CapturedPhoto = {
        id: uploadData.id || crypto.randomUUID(),
        url: urlData.publicUrl,
        filename,
        category,
        description,
        project_id: projectId,
        location_id: locationId,
        work_order_id: workOrderId,
        employee_id: employeeId,
        created_at: new Date().toISOString(),
      };

      toast({
        title: 'Success',
        description: 'Photo selected and uploaded successfully',
      });

      return capturedPhoto;
    } catch (error) {
      console.error('Error selecting photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to select photo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    capturePhoto,
    selectFromGallery,
    checkCameraPermission,
  };
}