import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, Camera, RotateCcw, Check, ChevronRight, Smartphone, AlertCircle, Grid3X3 } from 'lucide-react';
import { useDeviceOrientation, isPointingAtAngle } from '@/hooks/useDeviceOrientation';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/use-toast';

// 8 target angles for complete room coverage (every 45 degrees)
const TARGET_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const ANGLE_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const ANGLE_TOLERANCE = 20;

interface CapturedPhoto {
  url: string;
  angle: number;
  timestamp: Date;
}

interface GuidedPanoramaCaptureProps {
  locationId: string;
  onComplete: (photos: CapturedPhoto[]) => void;
  onCancel: () => void;
}

export const GuidedPanoramaCapture: React.FC<GuidedPanoramaCaptureProps> = ({
  locationId,
  onComplete,
  onCancel,
}) => {
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [overlayHidden, setOverlayHidden] = useState(false);

  const initRef = useRef(false);
  const manualModeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    orientation,
    isSupported,
    permissionGranted,
    requestPermission,
    startTracking,
    stopTracking,
    isTracking,
    error: orientationError
  } = useDeviceOrientation();

  const { capturePhoto } = usePhotoCapture();
  const { employee } = useCurrentEmployee();
  const { hasRole } = useUserRoles();
  const { toast } = useToast();

  const isAdmin = hasRole('admin');
  const currentTarget = TARGET_ANGLES[currentTargetIndex];
  const progress = (capturedPhotos.length / TARGET_ANGLES.length) * 100;

  const isAtTarget = !manualMode && orientation.alpha !== null &&
    isPointingAtAngle(orientation.alpha, currentTarget, ANGLE_TOLERANCE);

  // Init tracking once on mount - stable refs prevent re-trigger
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (!isSupported) {
      setManualMode(true);
      return;
    }

    const init = async () => {
      if (!permissionGranted) {
        await requestPermission();
      }
      startTracking();
    };
    init();

    // Fallback: if no valid alpha after 5s, switch to manual
    manualModeTimerRef.current = setTimeout(() => {
      // We check the DOM-level ref isn't giving us data
      setManualMode(prev => {
        // Will be overridden if we get orientation data
        return prev;
      });
    }, 5000);

    return () => {
      stopTracking();
      if (manualModeTimerRef.current) clearTimeout(manualModeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-disable manual mode fallback timer if we get valid orientation data
  useEffect(() => {
    if (orientation.alpha !== null && manualModeTimerRef.current) {
      clearTimeout(manualModeTimerRef.current);
      manualModeTimerRef.current = null;
      setManualMode(false);
    }
  }, [orientation.alpha]);

  // If orientation never arrives after 5s and we haven't gotten data, enable manual
  useEffect(() => {
    if (!isSupported) {
      setManualMode(true);
      return;
    }

    const fallback = setTimeout(() => {
      if (orientation.alpha === null) {
        setManualMode(true);
      }
    }, 5000);

    return () => clearTimeout(fallback);
  }, [isSupported, orientation.alpha]);

  // Find next uncaptured angle
  const findNextTarget = useCallback(() => {
    const capturedAngles = capturedPhotos.map(p => p.angle);
    for (let i = 0; i < TARGET_ANGLES.length; i++) {
      const angle = TARGET_ANGLES[i];
      if (!capturedAngles.some(ca => Math.abs(ca - angle) < ANGLE_TOLERANCE)) {
        setCurrentTargetIndex(i);
        return;
      }
    }
    setCurrentTargetIndex(TARGET_ANGLES.length);
  }, [capturedPhotos]);

  // Handle photo capture - hide overlay during web camera modal
  const handleCapture = async (angleOverride?: number) => {
    if (isCapturing) return;

    const captureAngle = angleOverride ?? currentTarget;
    setIsCapturing(true);
    setOverlayHidden(true);

    try {
      const result = await capturePhoto(
        `360° capture - ${captureAngle}°`,
        'room_view',
        undefined,
        locationId,
        undefined,
        employee?.id,
        isAdmin,
        false
      );

      if (result && typeof result === 'object' && 'url' in result) {
        const newPhoto: CapturedPhoto = {
          url: result.url,
          angle: captureAngle,
          timestamp: new Date(),
        };

        setCapturedPhotos(prev => {
          const updated = [...prev, newPhoto];
          // Find next target after state updates
          setTimeout(() => findNextTarget(), 100);
          return updated;
        });

        toast({
          title: `Photo ${capturedPhotos.length + 1} of ${TARGET_ANGLES.length}`,
          description: `Captured at ${captureAngle}° (${ANGLE_LABELS[TARGET_ANGLES.indexOf(captureAngle)] || ''})`,
        });
      }
    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: 'Capture Failed',
        description: 'Failed to capture photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
      setOverlayHidden(false);
    }
  };

  const handleComplete = () => {
    if (capturedPhotos.length === 0) {
      toast({
        title: 'No Photos',
        description: 'Please capture at least one photo before completing.',
        variant: 'destructive',
      });
      return;
    }
    onComplete(capturedPhotos);
  };

  const handleReset = () => {
    setCapturedPhotos([]);
    setCurrentTargetIndex(0);
    toast({ title: 'Reset', description: 'All captured photos have been cleared.' });
  };

  const getRotationIndicatorStyle = () => {
    if (orientation.alpha === null) return {};
    return { transform: `rotate(${-orientation.alpha}deg)` };
  };

  const isAngleCaptured = (angle: number) =>
    capturedPhotos.some(p => Math.abs(p.angle - angle) < ANGLE_TOLERANCE);

  // Instructions overlay
  if (showInstructions) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-2xl font-bold">Guided 360° Capture</h2>

          <div className="space-y-4 text-left text-muted-foreground">
            <p className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm">1</span>
              <span>Hold your phone upright and rotate slowly in place</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm">2</span>
              <span>{isSupported ? 'Follow the compass guide to each target angle' : 'Select a direction and tap capture'}</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm">3</span>
              <span>Tap the capture button when aligned with each target</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm">4</span>
              <span>8 photos will capture the complete room view</span>
            </p>
          </div>

          {!isSupported && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">
                Device orientation is not supported. You can capture photos manually by selecting each direction.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => setShowInstructions(false)} className="flex-1">
              Start Capture
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Hide overlay while camera modal is active
  if (overlayHidden) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background/90 backdrop-blur-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">360° Capture</h3>
            <p className="text-sm text-muted-foreground">
              {capturedPhotos.length} of {TARGET_ANGLES.length} photos
              {manualMode && ' • Manual mode'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!manualMode && isSupported && (
              <Button variant="outline" size="sm" onClick={() => setManualMode(true)}>
                <Grid3X3 className="w-4 h-4 mr-2" />
                Manual
              </Button>
            )}
            {manualMode && isSupported && orientation.alpha !== null && (
              <Button variant="outline" size="sm" onClick={() => setManualMode(false)}>
                Compass
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="mt-3" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto">
        {manualMode ? (
          /* Manual Mode: Grid of angle buttons */
          <div className="w-full max-w-sm space-y-4">
            <p className="text-center text-muted-foreground text-sm mb-4">
              Tap a direction, then capture the photo facing that way
            </p>
            <div className="grid grid-cols-4 gap-3">
              {TARGET_ANGLES.map((angle, index) => {
                const captured = isAngleCaptured(angle);
                return (
                  <Button
                    key={angle}
                    variant={captured ? 'default' : currentTargetIndex === index ? 'default' : 'outline'}
                    className={`flex flex-col h-20 ${captured ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                    onClick={() => {
                      if (!captured) {
                        setCurrentTargetIndex(index);
                        handleCapture(angle);
                      }
                    }}
                    disabled={captured || isCapturing}
                  >
                    {captured ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <>
                        <span className="text-lg font-bold">{ANGLE_LABELS[index]}</span>
                        <span className="text-xs opacity-70">{angle}°</span>
                      </>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Compass Mode */
          <>
            <div className="relative w-64 h-64 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-muted">
                {TARGET_ANGLES.map((angle, index) => {
                  const isCaptured = isAngleCaptured(angle);
                  const isTarget = index === currentTargetIndex;
                  const radians = (angle - 90) * (Math.PI / 180);
                  const x = 50 + 45 * Math.cos(radians);
                  const y = 50 + 45 * Math.sin(radians);

                  return (
                    <div
                      key={angle}
                      className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                        isCaptured
                          ? 'bg-green-500 text-white'
                          : isTarget
                            ? 'bg-primary text-primary-foreground animate-pulse ring-4 ring-primary/30'
                            : 'bg-muted text-muted-foreground'
                      }`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      {isCaptured ? <Check className="w-4 h-4" /> : ANGLE_LABELS[index]}
                    </div>
                  );
                })}
              </div>

              {isTracking && orientation.alpha !== null && (
                <div
                  className="absolute inset-4 transition-transform duration-100"
                  style={getRotationIndicatorStyle()}
                >
                  <div className="w-full h-full flex flex-col items-center">
                    <div className={`w-0 h-0 border-l-[12px] border-r-[12px] border-b-[24px] border-l-transparent border-r-transparent transition-colors ${
                      isAtTarget ? 'border-b-green-500' : 'border-b-primary'
                    }`} />
                  </div>
                </div>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold">
                  {orientation.alpha !== null ? `${Math.round(orientation.alpha)}°` : '--'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {capturedPhotos.length < TARGET_ANGLES.length
                    ? `Target: ${ANGLE_LABELS[currentTargetIndex]} (${currentTarget}°)`
                    : 'Complete!'}
                </p>
              </div>
            </div>

            {isAtTarget && capturedPhotos.length < TARGET_ANGLES.length && (
              <Badge variant="default" className="mb-4 bg-green-500 animate-pulse">
                <Check className="w-3 h-3 mr-1" />
                Aligned! Tap to capture
              </Badge>
            )}
          </>
        )}

        {orientationError && (
          <Badge variant="destructive" className="mb-4">
            <AlertCircle className="w-3 h-3 mr-1" />
            {orientationError}
          </Badge>
        )}

        {/* Captured Photos Preview */}
        {capturedPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 max-w-full px-4 mt-4">
            {capturedPhotos.map((photo, index) => (
              <div key={index} className="relative shrink-0">
                <img
                  src={photo.url}
                  alt={`Capture ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border-2 border-green-500"
                />
                <Badge
                  variant="secondary"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs px-1.5"
                >
                  {ANGLE_LABELS[TARGET_ANGLES.indexOf(photo.angle)] || `${photo.angle}°`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-background/90 backdrop-blur-sm border-t p-6">
        <div className="flex gap-4 justify-center">
          {capturedPhotos.length < TARGET_ANGLES.length ? (
            !manualMode && (
              <Button
                size="lg"
                className={`w-20 h-20 rounded-full ${isAtTarget ? 'bg-green-500 hover:bg-green-600' : ''}`}
                onClick={() => handleCapture()}
                disabled={isCapturing}
              >
                <Camera className="w-8 h-8" />
              </Button>
            )
          ) : (
            <Button
              size="lg"
              onClick={handleComplete}
              className="px-8"
            >
              <Check className="w-5 h-5 mr-2" />
              Complete ({capturedPhotos.length} photos)
            </Button>
          )}
        </div>

        {capturedPhotos.length > 0 && capturedPhotos.length < TARGET_ANGLES.length && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleComplete}
          >
            Finish with {capturedPhotos.length} photos
          </Button>
        )}
      </div>
    </div>
  );
};
