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
      console.log('📱 Checking camera permissions...');
      
      // Improved mobile/web detection
      const hasCapacitor = !!(window as any).Capacitor;
      const capacitorPlatform = hasCapacitor ? (window as any).Capacitor.getPlatform() : null;
      const isWeb = !hasCapacitor || capacitorPlatform === 'web';
      
      console.log('🔍 Platform detection:', { 
        hasCapacitor, 
        capacitorPlatform, 
        isWeb, 
        userAgent: navigator.userAgent 
      });
      
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
    employeeId?: string,
    isAdmin?: boolean,
    isPanoramic?: boolean
  ): Promise<CapturedPhoto | null> => {
    console.log('🔄 Starting photo capture:', { description, category, employeeId, locationId, projectId, workOrderId, isAdmin, isPanoramic });
    
    // Validate employee ID - must be provided or user must be admin
    if (!employeeId && !isAdmin) {
      console.error('❌ Employee ID is required for photo capture');
      toast({
        title: 'Employee Required',
        description: 'Valid employee record is required to capture photos',
        variant: 'destructive',
      });
      return null;
    }
    
    console.log('👤 Using employee ID:', employeeId);
    
    console.log('📱 Starting photo capture process...');
    setLoading(true);

    try {
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        console.log('❌ Camera permission not available, aborting photo capture');
        return null;
      }

      console.log('✅ Camera permission OK, opening camera...');
      
      // Improved platform detection
      const hasCapacitor = !!(window as any).Capacitor;
      const capacitorPlatform = hasCapacitor ? (window as any).Capacitor.getPlatform() : null;
      const isWeb = !hasCapacitor || capacitorPlatform === 'web';
      
      console.log('🔍 Using platform:', { isWeb, hasCapacitor, capacitorPlatform });
      let image: any;
      
      if (isWeb) {
        // Use enhanced HTML5 camera for web that handles the entire process
        return await captureWebPhotoWithProcessing(description, category, projectId, locationId, workOrderId, employeeId, isPanoramic);
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
      
      // Upload to Supabase Storage - use room-views bucket for room_view category
      const bucketName = category === 'room_view' ? 'room-views' : 'floor-plans';
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
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
      const { data: urlData, error: signedUrlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(`photos/${filename}`, 3600);

      // Store photo metadata in daily_logs table with photos array
      const photoMetadata = {
        url: urlData?.signedUrl || '',
        filename,
        category,
        description,
        captured_at: new Date().toISOString(),
      };

      // Create a daily log entry to store the photo
      console.log('💾 Creating daily log entry with photo...');
      
      const logEntry = {
        employee_id: employeeId || null,
        project_id: projectId || undefined,
        location_id: locationId || undefined,
        work_order_id: workOrderId || undefined,
        log_date: new Date().toISOString().split('T')[0],
        work_description: `${isPanoramic ? 'Panoramic photo' : 'Photo'} captured${isAdmin && !employeeId ? ' by Admin' : ''}: ${category}${description ? ` - ${description}` : ''}`,
        photos: [urlData?.signedUrl || ''],
        hours_worked: 0,
      };
      
      console.log('📝 Daily log entry data:', logEntry);
      
      const { data: logData, error: logError } = await supabase
        .from('daily_logs')
        .insert(logEntry)
        .select()
        .single();

      if (logError) {
        console.error('❌ Daily log creation error:', logError);
        console.error('❌ Full error details:', JSON.stringify(logError, null, 2));
        
        // More specific error handling
        if (logError.code === '23502') {
          console.error('❌ Missing required field in daily_logs');
        } else if (logError.code === '23503') {
          console.error('❌ Foreign key constraint violation');
        }
        
        throw new Error(`Database error: ${logError.message}`);
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
    employeeId?: string,
    isAdmin?: boolean,
    isPanoramic?: boolean
  ): Promise<CapturedPhoto | null> => {
    console.log('🔄 Starting gallery selection:', { description, category, employeeId, locationId, projectId, workOrderId, isAdmin, isPanoramic });
    
    // Validate employee ID - must be provided or user must be admin
    if (!employeeId && !isAdmin) {
      console.error('❌ Employee ID is required for gallery selection');
      toast({
        title: 'Employee Required',
        description: 'Valid employee record is required to select photos',
        variant: 'destructive',
      });
      return null;
    }
    
    console.log('👤 Using employee ID for gallery:', employeeId);

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
      
      // Upload to Supabase Storage - use room-views bucket for room_view category
      const bucketName = category === 'room_view' ? 'room-views' : 'floor-plans';
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(`photos/${filename}`, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(`photos/${filename}`, 3600);

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
          work_description: `${isPanoramic ? 'Panoramic photo' : 'Photo'} selected from gallery${isAdmin && !employeeId ? ' by Admin' : ''}: ${category}${description ? ` - ${description}` : ''}`,
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
        employee_id: employeeId, // Now guaranteed to be valid
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

  // Enhanced web camera capture function that handles the entire process
  const captureWebPhotoWithProcessing = async (
    description: string = '',
    category: string = 'progress',
    projectId?: string,
    locationId?: string,
    workOrderId?: string,
    employeeId?: string,
    isPanoramic?: boolean
  ): Promise<CapturedPhoto | null> => {
    return new Promise((resolve, reject) => {
      // Detect if we're on mobile or desktop
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const facingMode = isMobile ? 'environment' : 'user'; // Use back camera on mobile, front on desktop
      
      console.log(`📱 Platform detection: ${isMobile ? 'Mobile' : 'Desktop'}, using ${facingMode} camera`);
      // Create video element
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      let isVideoReady = false;
      let stream: MediaStream | null = null;
      let countdownInterval: NodeJS.Timeout;
      
      // Create camera modal with high z-index to appear above dialogs
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
      modal.setAttribute('data-camera-modal', 'true');
      
      // Prevent modal from closing parent dialogs
      modal.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
      });
      
      video.style.cssText = `
        max-width: 90vw;
        max-height: 70vh;
        border-radius: 8px;
      `;
      
      // Status message
      const statusMsg = document.createElement('div');
      statusMsg.textContent = 'Initializing camera...';
      statusMsg.style.cssText = `
        margin: 20px;
        font-size: 16px;
        color: #ccc;
        text-align: center;
      `;
      
      // Panoramic mode indicator
      const panoramicBadge = document.createElement('div');
      if (isPanoramic) {
        panoramicBadge.textContent = '📷 PANORAMIC MODE';
        panoramicBadge.style.cssText = `
          position: absolute;
          top: 70px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 193, 7, 0.9);
          color: black;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          backdrop-filter: blur(4px);
          z-index: 10;
        `;
      }
      
      // Loading spinner
      const spinner = document.createElement('div');
      spinner.style.cssText = `
        width: 20px;
        height: 20px;
        border: 2px solid #333;
        border-top: 2px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 10px auto;
        display: none;
      `;
      
      // Add CSS animation for spinner
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      // Buttons (initially disabled)
      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Capture Photo';
      captureBtn.disabled = true;
      captureBtn.style.cssText = `
        margin: 10px;
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
        margin: 10px;
        padding: 12px 24px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: not-allowed;
        opacity: 0.6;
      `;
      
      // Enhanced cleanup function
      const cleanup = () => {
        try {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          if (modal.parentNode) {
            document.body.removeChild(modal);
          }
          if (style.parentNode) {
            document.head.removeChild(style);
          }
          document.removeEventListener('keydown', escapeHandler);
          clearTimeout(forceCloseTimeout);
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
        // Clear countdown if it exists
        if (countdownInterval) {
          clearInterval(countdownInterval);
        }
      };

      // Escape key handler for emergency exit
      const escapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          console.log('Escape pressed, force closing camera modal');
          cleanup();
          reject(new Error('User cancelled photo capture with Escape key'));
        }
      };

      // Remove the countdown - it was causing premature timeouts
      const countdownElement = document.createElement('div');
      countdownElement.style.cssText = `
        position: absolute;
        top: 70px;
        right: 20px;
        background: rgba(255,255,255,0.1);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        backdrop-filter: blur(4px);
      `;
      countdownElement.textContent = 'Ready';

      // Force cleanup timeout (extended to 5 minutes - only for emergency)
      let forceCloseTimeout = setTimeout(() => {
        console.log('⏰ Force closing camera modal after 5 minutes (emergency timeout)');
        clearInterval(countdownInterval);
        cleanup();
        reject(new Error('Camera modal emergency timeout'));
      }, 300000); // 5 minutes

      // Add escape listener immediately
      document.addEventListener('keydown', escapeHandler);
      
      // Update status and show processing
      const updateStatus = (message: string, showSpinner: boolean = false) => {
        statusMsg.textContent = message;
        spinner.style.display = showSpinner ? 'block' : 'none';
      };
      
      // Enable buttons when camera is ready
      const enableButtons = () => {
        isVideoReady = true;
        updateStatus('Camera ready - You can now capture or cancel');
        statusMsg.style.color = '#28a745';
        
        captureBtn.disabled = false;
        captureBtn.style.cssText = `
          margin: 10px;
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          opacity: 1;
          pointer-events: auto;
          touch-action: manipulation;
          user-select: none;
          transition: all 0.2s ease;
        `;
        
        // Add hover effect
        captureBtn.addEventListener('mouseenter', () => {
          captureBtn.style.background = '#0056b3';
          captureBtn.style.transform = 'scale(1.05)';
        });
        captureBtn.addEventListener('mouseleave', () => {
          captureBtn.style.background = '#007bff';
          captureBtn.style.transform = 'scale(1)';
        });
        
        cancelBtn.disabled = false;
        cancelBtn.style.cssText = `
          margin: 10px;
          padding: 12px 24px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          opacity: 1;
          pointer-events: auto;
          touch-action: manipulation;
          user-select: none;
          transition: all 0.2s ease;
        `;
        
        // Add hover effect
        cancelBtn.addEventListener('mouseenter', () => {
          cancelBtn.style.background = '#c82333';
          cancelBtn.style.transform = 'scale(1.05)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
          cancelBtn.style.background = '#dc3545';
          cancelBtn.style.transform = 'scale(1)';
        });
      };
      
      // Process the captured photo
      const processPhoto = async (dataUrl: string) => {
        try {
          // Disable buttons during processing
          captureBtn.disabled = true;
          cancelBtn.disabled = true;
          
          updateStatus('Processing image...', true);
          
          // Convert dataUrl to blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          
          updateStatus('Uploading to storage...', true);
          
          // Generate filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `${category}-${timestamp}.jpg`;
          
          // Select the correct bucket based on category
          const bucketName = category === 'room_view' ? 'room-views' : 'floor-plans';
          console.log(`📦 Uploading to bucket: ${bucketName} (category: ${category})`);
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(`photos/${filename}`, blob, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (uploadError) {
            console.error(`❌ Upload error to ${bucketName}:`, uploadError);
            throw uploadError;
          }

          const { data: urlData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(`photos/${filename}`, 3600);

          updateStatus('Saving photo record...', true);

          // Create daily log entry
          const { data: logData, error: logError } = await supabase
            .from('daily_logs')
            .insert({
              employee_id: employeeId, // Now guaranteed to be valid
              project_id: projectId || undefined,
              location_id: locationId || undefined,
              work_order_id: workOrderId || undefined,
              log_date: new Date().toISOString().split('T')[0],
              work_description: `${isPanoramic ? 'Panoramic photo' : 'Photo'} captured: ${category}${description ? ` - ${description}` : ''}`,
              photos: [urlData.publicUrl],
              hours_worked: 0,
            })
            .select()
            .single();

          if (logError) {
            throw logError;
          }

          updateStatus('Photo saved successfully!', false);
          statusMsg.style.color = '#28a745';

          const capturedPhoto: CapturedPhoto = {
            id: uploadData.id || crypto.randomUUID(),
            url: urlData.publicUrl,
            filename,
            category,
            description,
            project_id: projectId,
            location_id: locationId,
            work_order_id: workOrderId,
            employee_id: employeeId, // Now guaranteed to be valid
            created_at: new Date().toISOString(),
          };

          // Show success message briefly then close
          setTimeout(() => {
            cleanup();
            resolve(capturedPhoto);
          }, 1500);

        } catch (error) {
          console.error('❌ Photo processing error:', {
            error,
            category,
            bucket: category === 'room_view' ? 'room-views' : 'floor-plans',
            employeeId,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
          updateStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, false);
          statusMsg.style.color = '#dc3545';
          
          // Re-enable cancel button for retry/exit
          cancelBtn.disabled = false;
          cancelBtn.textContent = 'Close';
          cancelBtn.onclick = () => {
            cleanup();
            reject(error);
          };
        }
      };
      
      // Create header with close button
      const header = document.createElement('div');
      header.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 10;
      `;
      
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✕';
      closeBtn.style.cssText = `
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      closeBtn.onclick = () => {
        cleanup();
        reject(new Error('User closed camera modal'));
      };
      header.appendChild(closeBtn);

      // Instructions
      const instructions = document.createElement('div');
      instructions.textContent = 'Press ESC to close';
      instructions.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        font-size: 12px;
        color: #ccc;
        opacity: 0.7;
      `;

      // Build modal structure
      modal.appendChild(header);
      modal.appendChild(instructions);
      if (isPanoramic) {
        modal.appendChild(panoramicBadge);
      }
      modal.appendChild(countdownElement);
      modal.appendChild(video);
      modal.appendChild(statusMsg);
      modal.appendChild(spinner);
      const btnContainer = document.createElement('div');
      btnContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 20px;
      `;
      btnContainer.appendChild(captureBtn);
      btnContainer.appendChild(cancelBtn);
      modal.appendChild(btnContainer);
      document.body.appendChild(modal);
      
      // Set up timeout for camera initialization
      const initTimeout = setTimeout(() => {
        if (!isVideoReady) {
          cleanup();
          reject(new Error('Camera initialization timed out. Please try again.'));
        }
      }, 10000);
      
      // Get camera stream with panoramic constraints
      const constraints = isPanoramic ? {
        video: {
          facingMode: facingMode,
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          aspectRatio: { ideal: 16/9 }
        }
      } : {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 4/3 }
        }
      };
      
      console.log(`📷 Camera constraints:`, constraints);
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(mediaStream => {
          stream = mediaStream;
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
          
          // Enhanced capture button event handling
          const handleCapture = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📸 Capture button clicked/touched');
            
            if (!isVideoReady || video.readyState < video.HAVE_CURRENT_DATA) {
              console.log('📸 Video not ready, ignoring capture');
              return;
            }
            
            console.log('📸 Processing capture...');
            // Clear the emergency timeout since user is actively using the camera
            clearTimeout(forceCloseTimeout);
            if (countdownInterval) {
              clearInterval(countdownInterval);
            }
            
            // Visual feedback
            captureBtn.style.background = '#28a745';
            captureBtn.textContent = 'Capturing...';
            captureBtn.disabled = true;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context?.drawImage(video, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            // Stop camera stream but keep modal open for processing
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
            video.style.display = 'none'; // Hide video preview
            
            // Start processing
            processPhoto(dataUrl);
          };
          
          // Enhanced cancel button event handling
          const handleCancel = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Cancel button clicked/touched');
            // Clear timeouts on cancel
            clearTimeout(forceCloseTimeout);
            if (countdownInterval) {
              clearInterval(countdownInterval);
            }
            cleanup();
            reject(new Error('User cancelled photo capture'));
          };
          
          // Add multiple event listeners for cross-platform support
          captureBtn.addEventListener('click', handleCapture);
          captureBtn.addEventListener('touchstart', handleCapture, { passive: false });
          captureBtn.addEventListener('touchend', (e) => e.preventDefault());
          
          cancelBtn.addEventListener('click', handleCancel);
          cancelBtn.addEventListener('touchstart', handleCancel, { passive: false });
          cancelBtn.addEventListener('touchend', (e) => e.preventDefault());
          
          // Also keep onclick as fallback
          captureBtn.onclick = handleCapture;
          cancelBtn.onclick = handleCancel;
        })
        .catch(error => {
          console.error('❌ Camera stream initialization error:', {
            error,
            name: error.name,
            message: error.message,
            category,
            platform: isMobile ? 'Mobile' : 'Desktop',
            facingMode: facingMode,
            isPanoramic,
            constraints
          });
          clearTimeout(initTimeout);
          cleanup();
          reject(new Error(`Camera access failed: ${error.message}`));
        });
    });
  };

  // Legacy web camera capture function (kept for compatibility)
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