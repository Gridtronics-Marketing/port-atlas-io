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
      
      // Check if we're in a web environment
      const isWeb = !(window as any).Capacitor || (window as any).Capacitor.getPlatform() === 'web';
      
      if (isWeb) {
        console.log('Web environment detected, checking browser camera permissions...');
        
        // Check if we're in a secure context (HTTPS)
        if (!window.isSecureContext) {
          console.error('Camera requires HTTPS in web browsers');
          toast({
            title: 'Security Error',
            description: 'Camera access requires a secure connection (HTTPS). Please use HTTPS or try on a mobile device.',
            variant: 'destructive',
          });
          return false;
        }
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('getUserMedia not available');
          toast({
            title: 'Browser Not Supported',
            description: 'Your browser does not support camera access. Please try a different browser or mobile device.',
            variant: 'destructive',
          });
          return false;
        }
        
        // Test browser camera access
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Stop the stream immediately after testing
          stream.getTracks().forEach(track => track.stop());
          console.log('Browser camera access confirmed');
          return true;
        } catch (webError) {
          console.error('Browser camera access denied:', webError);
          toast({
            title: 'Camera Permission Denied',
            description: 'Please allow camera access in your browser settings and refresh the page.',
            variant: 'destructive',
          });
          return false;
        }
      } else {
        // Native environment (iOS/Android)
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
      }
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
    description: string = '',
    category: string = 'progress',
    projectId?: string,
    locationId?: string,
    workOrderId?: string,
    employeeId?: string
  ): Promise<CapturedPhoto | null> => {
    console.log('🔄 Starting photo capture:', { description, category, employeeId, locationId, projectId, workOrderId });
    
    if (!employeeId) {
      console.log('❌ No employee ID, allowing admin users to continue');
      // Allow admins to capture photos without employee ID
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
      
      // Check if we're in web environment and use appropriate method
      const isWeb = !(window as any).Capacitor || (window as any).Capacitor.getPlatform() === 'web';
      let image: any;
      
      if (isWeb) {
        // Use HTML5 camera for web
        image = await captureWebPhoto();
      } else {
        // Use Capacitor Camera for native
        const cameraPromise = Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Camera operation timed out')), 30000); // 30 second timeout
        });

        image = await Promise.race([cameraPromise, timeoutPromise]) as any;
      }
      
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

      // Create a daily log entry to store the photo
      console.log('💾 Creating daily log entry with photo...');
      
      const { data: logData, error: logError } = await supabase
        .from('daily_logs')
        .insert({
          employee_id: employeeId || null, // Allow null for admin users without employee records
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
        console.error('❌ Daily log creation error:', logError);
        throw logError;
      }
      
      console.log('✅ Daily log created successfully:', logData);

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
    description: string = '',
    category: string = 'progress',
    projectId?: string,
    locationId?: string,
    workOrderId?: string,
    employeeId?: string
  ): Promise<CapturedPhoto | null> => {
    console.log('🔄 Starting gallery selection:', { description, category, employeeId, locationId, projectId, workOrderId });
    
    if (!employeeId) {
      console.log('❌ No employee ID, allowing admin users to continue');
      // Allow admins to select photos without employee ID
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

      // Create a daily log entry for gallery photos too
      console.log('💾 Creating daily log entry from gallery...');
      
      const { data: logData, error: logError } = await supabase
        .from('daily_logs')
        .insert({
          employee_id: employeeId || null,
          project_id: projectId || undefined,
          location_id: locationId || undefined, 
          work_order_id: workOrderId || undefined,
          log_date: new Date().toISOString().split('T')[0],
          work_description: `Photo selected from gallery: ${category}${description ? ` - ${description}` : ''}`,
          photos: [urlData.publicUrl],
          hours_worked: 0,
        })
        .select()
        .single();

      if (logError) {
        console.error('❌ Gallery photo log creation error:', logError);
        throw logError;
      }
      
      console.log('✅ Gallery photo log created:', logData);

      const capturedPhoto: CapturedPhoto = {
        id: uploadData.id || crypto.randomUUID(),
        url: urlData.publicUrl,
        filename,
        category,
        description,
        project_id: projectId,
        location_id: locationId,
        work_order_id: workOrderId,
        employee_id: employeeId || null,
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

  // Web camera capture function
  const captureWebPhoto = async (): Promise<{ dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      // Create video element
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      let isVideoReady = false;
      
      // Create camera modal
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: system-ui;
      `;
      
      video.style.cssText = `
        max-width: 90vw;
        max-height: 70vh;
        border-radius: 8px;
      `;
      
      // Loading message
      const loadingMsg = document.createElement('div');
      loadingMsg.textContent = 'Initializing camera...';
      loadingMsg.style.cssText = `
        margin: 20px;
        font-size: 16px;
        color: #ccc;
      `;
      
      // Buttons (initially disabled)
      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Capture Photo';
      captureBtn.disabled = true;
      captureBtn.style.cssText = `
        margin: 20px;
        padding: 12px 24px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: not-allowed;
        opacity: 0.6;
      `;
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.disabled = true;
      cancelBtn.style.cssText = `
        margin: 20px;
        padding: 12px 24px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: not-allowed;
        opacity: 0.6;
      `;
      
      // Function to enable buttons when camera is ready
      const enableButtons = () => {
        isVideoReady = true;
        loadingMsg.textContent = 'Camera ready - You can now capture or cancel';
        loadingMsg.style.color = '#28a745';
        
        captureBtn.disabled = false;
        captureBtn.style.cssText = `
          margin: 20px;
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          opacity: 1;
        `;
        
        cancelBtn.disabled = false;
        cancelBtn.style.cssText = `
          margin: 20px;
          padding: 12px 24px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          opacity: 1;
        `;
      };
      
      // Build modal structure
      modal.appendChild(video);
      modal.appendChild(loadingMsg);
      const btnContainer = document.createElement('div');
      btnContainer.appendChild(captureBtn);
      btnContainer.appendChild(cancelBtn);
      modal.appendChild(btnContainer);
      document.body.appendChild(modal);
      
      // Set up timeout for camera initialization
      const initTimeout = setTimeout(() => {
        if (!isVideoReady) {
          // Cleanup and reject
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
          }
          document.body.removeChild(modal);
          reject(new Error('Camera initialization timed out. Please try again.'));
        }
      }, 10000); // 10 second timeout
      
      // Get camera stream
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          video.srcObject = stream;
          video.play();
          
          // Listen for video ready events
          video.addEventListener('loadeddata', () => {
            clearTimeout(initTimeout);
            enableButtons();
          });
          
          // Fallback: check readiness periodically
          const readyCheck = setInterval(() => {
            if (video.readyState >= video.HAVE_CURRENT_DATA) {
              clearInterval(readyCheck);
              clearTimeout(initTimeout);
              enableButtons();
            }
          }, 500);
          
          captureBtn.onclick = () => {
            if (!isVideoReady || video.readyState < video.HAVE_CURRENT_DATA) {
              return; // Button should be disabled, but extra safety check
            }
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context?.drawImage(video, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            // Stop camera stream
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(modal);
            
            resolve({ dataUrl });
          };
          
          cancelBtn.onclick = () => {
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(modal);
            clearTimeout(initTimeout);
            reject(new Error('User cancelled photo capture'));
          };
        })
        .catch(error => {
          clearTimeout(initTimeout);
          document.body.removeChild(modal);
          reject(error);
        });
    });
  };

  return {
    loading,
    capturePhoto,
    selectFromGallery,
    checkCameraPermission,
  };
}