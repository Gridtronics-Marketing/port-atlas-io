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
      console.log('Checking camera permissions...');
      
      const permission = await Camera.checkPermissions();
      console.log('Current camera permission status:', permission);
      
      if (permission.camera !== 'granted') {
        console.log('Camera permission not granted, requesting...');
        
        toast({
          title: 'Camera Permission',
          description: 'Please allow camera access when prompted',
        });
        
        const requested = await Camera.requestPermissions();
        console.log('Camera permission request result:', requested);
        
        if (requested.camera === 'granted') {
          console.log('Camera permission granted');
          return true;
        } else if (requested.camera === 'denied') {
          console.log('Camera permission denied by user');
          toast({
            title: 'Permission Denied',
            description: 'Camera access was denied. Please enable it in your device settings to take photos.',
            variant: 'destructive',
          });
          return false;
        } else {
          console.log('Camera permission in unknown state:', requested.camera);
          toast({
            title: 'Permission Issue',
            description: 'Unable to access camera. Please check your device settings.',
            variant: 'destructive',
          });
          return false;
        }
      }
      
      console.log('Camera permission already granted');
      return true;
    } catch (error) {
      console.error('Error checking camera permission:', error);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check if camera is available on this device.',
        variant: 'destructive',
      });
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

    console.log('Starting photo capture process...');
    setLoading(true);

    try {
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        console.log('Camera permission not available, aborting photo capture');
        return null;
      }

      console.log('Camera permission OK, opening camera...');
      
      // Add timeout for camera operations
      const cameraPromise = Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Camera operation timed out')), 30000); // 30 second timeout
      });

      const image = await Promise.race([cameraPromise, timeoutPromise]) as any;
      
      console.log('Photo captured, processing image...');

      if (!image.dataUrl) {
        throw new Error('No image data received from camera');
      }

      // Convert dataUrl to blob
      const response = await fetch(image.dataUrl);
      const blob = await response.blob();
      
      console.log('Image converted to blob, uploading to storage...');
      
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

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('Photo uploaded successfully:', uploadData);

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
        console.log('Creating daily log entry...');
        
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

        if (logError) {
          console.error('Daily log creation error:', logError);
          throw logError;
        }
        
        console.log('Daily log created:', logData);
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

      console.log('Photo capture complete:', capturedPhoto);
      return capturedPhoto;
    } catch (error) {
      console.error('Error capturing photo:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to capture photo';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Camera operation timed out. Please try again.';
        } else if (error.message.includes('User cancelled')) {
          errorMessage = 'Photo capture was cancelled';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Camera permission is required to take photos';
        } else if (error.message.includes('No image data')) {
          errorMessage = 'No photo data received. Please try again.';
        }
      }
      
      toast({
        title: 'Camera Error',
        description: errorMessage,
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