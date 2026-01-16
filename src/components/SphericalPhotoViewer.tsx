import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Move, RotateCcw, Pen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Viewer } from '@photo-sphere-viewer/core';
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';
import '@photo-sphere-viewer/core/index.css';

interface SphericalPhotoViewerProps {
  photoUrl: string;
  description?: string;
  photoId?: string;
  onAnnotationClick?: () => void;
  hasAnnotations?: boolean;
  onClose: () => void;
}

export const SphericalPhotoViewer: React.FC<SphericalPhotoViewerProps> = ({
  photoUrl,
  description,
  photoId,
  onAnnotationClick,
  hasAnnotations,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
  const [gyroscopeAvailable, setGyroscopeAvailable] = useState(false);
  const [permissionNeeded, setPermissionNeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Photo Sphere Viewer
    const viewer = new Viewer({
      container: containerRef.current,
      panorama: photoUrl,
      plugins: [
        [GyroscopePlugin, {
          absolutePosition: false,
          moveMode: 'smooth',
        }],
      ],
      navbar: false,
      defaultYaw: 0,
      defaultPitch: 0,
      touchmoveTwoFingers: false,
      mousewheelCtrlKey: false,
      loadingTxt: 'Loading 360° photo...',
    });

    viewerRef.current = viewer;

    // Check if gyroscope is available
    viewer.addEventListener('ready', async () => {
      const gyroPlugin = viewer.getPlugin(GyroscopePlugin);
      
      if (gyroPlugin) {
        try {
          // Check if gyroscope is supported
          const isSupported = await (gyroPlugin as any).isSupported?.();
          setGyroscopeAvailable(isSupported !== false);
          
          // Check if permission is needed (iOS 13+)
          if ('DeviceOrientationEvent' in window && 'requestPermission' in DeviceOrientationEvent) {
            setPermissionNeeded(true);
          }
        } catch (err) {
          console.log('Gyroscope check error:', err);
          setGyroscopeAvailable(false);
        }
      }
    });

    // Handle loading errors by catching promises
    viewer.setPanorama(photoUrl).catch((err) => {
      console.error('Photo Sphere Viewer error:', err);
      setError('Failed to load 360° photo. The image may not be in the correct format.');
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      document.body.style.overflow = '';
    };
  }, [photoUrl]);

  // Toggle gyroscope control
  const toggleGyroscope = async () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const gyroPlugin = viewer.getPlugin(GyroscopePlugin);
    if (!gyroPlugin) return;

    try {
      if (gyroscopeEnabled) {
        await (gyroPlugin as any).stop?.();
        setGyroscopeEnabled(false);
      } else {
        // Request permission on iOS 13+ if needed
        if (permissionNeeded && 'requestPermission' in DeviceOrientationEvent) {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission !== 'granted') {
            setError('Motion permission denied. Please enable motion access in your device settings.');
            return;
          }
        }
        
        await (gyroPlugin as any).start?.();
        setGyroscopeEnabled(true);
      }
    } catch (err) {
      console.error('Gyroscope toggle error:', err);
      setError('Failed to enable gyroscope control. Your device may not support this feature.');
    }
  };

  // Reset view to default position
  const resetView = () => {
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.animate({
        yaw: 0,
        pitch: 0,
        speed: '2rpm',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/90 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">
                {description || '360° Photo'}
              </h3>
              <Badge variant="secondary" className="shrink-0">360°</Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Move className="w-4 h-4 shrink-0" />
              Drag to look around
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {gyroscopeAvailable && (
              <Button
                variant={gyroscopeEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={toggleGyroscope}
                className="gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {gyroscopeEnabled ? 'Gyro On' : 'Use Gyroscope'}
                </span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            {photoId && onAnnotationClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAnnotationClick}
              >
                <Pen className="w-4 h-4 mr-2" />
                {hasAnnotations ? 'Edit' : 'Annotate'}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Viewer Container */}
      <div 
        ref={containerRef} 
        className="w-full h-full pt-20"
        style={{ minHeight: '100vh' }}
      />

      {/* Error Message */}
      {error && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <div className="bg-destructive/90 text-destructive-foreground p-4 rounded-lg text-center">
            <p className="text-sm">{error}</p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-2"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Gyroscope Hint */}
      {gyroscopeEnabled && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
            <Smartphone className="w-3 h-3 mr-1 animate-pulse" />
            Move your device to look around
          </Badge>
        </div>
      )}
    </div>
  );
};
