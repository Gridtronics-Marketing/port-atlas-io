import { useState, useEffect, useCallback, useRef } from 'react';
import { Motion } from '@capacitor/motion';
import { Capacitor } from '@capacitor/core';

export interface DeviceOrientation {
  alpha: number | null; // Compass heading (0-360)
  beta: number | null;  // Front-back tilt (-180 to 180)
  gamma: number | null; // Left-right tilt (-90 to 90)
}

export interface UseDeviceOrientationReturn {
  orientation: DeviceOrientation;
  isSupported: boolean;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  startTracking: () => void;
  stopTracking: () => void;
  isTracking: boolean;
  error: string | null;
}

export const useDeviceOrientation = (): UseDeviceOrientationReturn => {
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    alpha: null,
    beta: null,
    gamma: null,
  });
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const listenerHandleRef = useRef<any>(null);
  const webListenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);

  // Check if device orientation is supported
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const hasWebOrientation = typeof DeviceOrientationEvent !== 'undefined';
    
    setIsSupported(isNative || hasWebOrientation);
    
    // On Android and older iOS, permission is granted by default
    if (hasWebOrientation && !('requestPermission' in DeviceOrientationEvent)) {
      setPermissionGranted(true);
    }
  }, []);

  // Request permission (required for iOS 13+)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Capacitor Motion plugin handles permissions automatically
        setPermissionGranted(true);
        return true;
      }
      
      // Web API permission request (iOS 13+)
      if ('requestPermission' in DeviceOrientationEvent) {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        const granted = permission === 'granted';
        setPermissionGranted(granted);
        if (!granted) {
          setError('Motion permission denied');
        }
        return granted;
      }
      
      // Permission not required on this device
      setPermissionGranted(true);
      return true;
    } catch (err) {
      console.error('Error requesting motion permission:', err);
      setError('Failed to request motion permission');
      return false;
    }
  }, []);

  // Start tracking device orientation
  const startTracking = useCallback(async () => {
    if (!isSupported) {
      setError('Device orientation not supported');
      return;
    }

    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Use Capacitor Motion plugin
        listenerHandleRef.current = await Motion.addListener('orientation', (event) => {
          setOrientation({
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
          });
        });
      } else {
        // Use Web DeviceOrientation API
        const handleOrientation = (event: DeviceOrientationEvent) => {
          setOrientation({
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
          });
        };
        
        webListenerRef.current = handleOrientation;
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
      
      setIsTracking(true);
      setError(null);
    } catch (err) {
      console.error('Error starting orientation tracking:', err);
      setError('Failed to start orientation tracking');
    }
  }, [isSupported, permissionGranted, requestPermission]);

  // Stop tracking device orientation
  const stopTracking = useCallback(() => {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative && listenerHandleRef.current) {
      listenerHandleRef.current.remove();
      listenerHandleRef.current = null;
    }
    
    if (!isNative && webListenerRef.current) {
      window.removeEventListener('deviceorientation', webListenerRef.current, true);
      webListenerRef.current = null;
    }
    
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [isTracking, stopTracking]);

  return {
    orientation,
    isSupported,
    permissionGranted,
    requestPermission,
    startTracking,
    stopTracking,
    isTracking,
    error,
  };
};

// Utility to calculate if user is pointing at a target angle
export const isPointingAtAngle = (
  currentAlpha: number | null,
  targetAngle: number,
  tolerance: number = 15
): boolean => {
  if (currentAlpha === null) return false;
  
  // Normalize angles to 0-360
  const current = ((currentAlpha % 360) + 360) % 360;
  const target = ((targetAngle % 360) + 360) % 360;
  
  // Calculate the difference, accounting for wraparound
  let diff = Math.abs(current - target);
  if (diff > 180) {
    diff = 360 - diff;
  }
  
  return diff <= tolerance;
};

// Utility to get the next target angle from a list of angles
export const getNextTargetAngle = (
  currentAlpha: number | null,
  capturedAngles: number[],
  allTargetAngles: number[]
): number | null => {
  const remainingAngles = allTargetAngles.filter(
    angle => !capturedAngles.some(captured => 
      Math.abs(captured - angle) < 15 || Math.abs(captured - angle) > 345
    )
  );
  
  if (remainingAngles.length === 0 || currentAlpha === null) {
    return null;
  }
  
  // Find the closest remaining angle to current heading
  let closestAngle = remainingAngles[0];
  let minDiff = Infinity;
  
  for (const angle of remainingAngles) {
    let diff = Math.abs(currentAlpha - angle);
    if (diff > 180) diff = 360 - diff;
    if (diff < minDiff) {
      minDiff = diff;
      closestAngle = angle;
    }
  }
  
  return closestAngle;
};
