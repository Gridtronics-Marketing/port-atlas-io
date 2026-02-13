import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Refs for stable callback access
  const permissionGrantedRef = useRef(false);
  const isSupportedRef = useRef(false);
  const isTrackingRef = useRef(false);
  const listenerHandleRef = useRef<any>(null);
  const webListenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);

  // Keep refs in sync with state
  useEffect(() => { permissionGrantedRef.current = permissionGranted; }, [permissionGranted]);
  useEffect(() => { isSupportedRef.current = isSupported; }, [isSupported]);
  useEffect(() => { isTrackingRef.current = isTracking; }, [isTracking]);

  // Check support on mount
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const hasWebOrientation = typeof DeviceOrientationEvent !== 'undefined';

    const supported = isNative || hasWebOrientation;
    setIsSupported(supported);
    isSupportedRef.current = supported;

    // On Android and older iOS, permission is granted by default
    if (hasWebOrientation && !('requestPermission' in DeviceOrientationEvent)) {
      setPermissionGranted(true);
      permissionGrantedRef.current = true;
    }
  }, []);

  // Stable requestPermission - no deps that change
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        setPermissionGranted(true);
        permissionGrantedRef.current = true;
        return true;
      }

      if ('requestPermission' in DeviceOrientationEvent) {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        const granted = permission === 'granted';
        setPermissionGranted(granted);
        permissionGrantedRef.current = granted;
        if (!granted) {
          setError('Motion permission denied');
        }
        return granted;
      }

      setPermissionGranted(true);
      permissionGrantedRef.current = true;
      return true;
    } catch (err) {
      console.error('Error requesting motion permission:', err);
      setError('Failed to request motion permission');
      return false;
    }
  }, []);

  // Stable startTracking - reads refs instead of state
  const startTracking = useCallback(async () => {
    if (!isSupportedRef.current) {
      setError('Device orientation not supported');
      return;
    }

    if (!permissionGrantedRef.current) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        const { Motion } = await import('@capacitor/motion');
        listenerHandleRef.current = await Motion.addListener('orientation', (event) => {
          setOrientation({
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
          });
        });
      } else {
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
      isTrackingRef.current = true;
      setError(null);
    } catch (err) {
      console.error('Error starting orientation tracking:', err);
      setError('Failed to start orientation tracking');
    }
  }, [requestPermission]);

  // Stable stopTracking
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
    isTrackingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTrackingRef.current) {
        const isNative = Capacitor.isNativePlatform();
        if (isNative && listenerHandleRef.current) {
          listenerHandleRef.current.remove();
          listenerHandleRef.current = null;
        }
        if (!isNative && webListenerRef.current) {
          window.removeEventListener('deviceorientation', webListenerRef.current, true);
          webListenerRef.current = null;
        }
      }
    };
  }, []);

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

  const current = ((currentAlpha % 360) + 360) % 360;
  const target = ((targetAngle % 360) + 360) % 360;

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
