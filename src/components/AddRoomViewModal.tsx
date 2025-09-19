import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, X } from 'lucide-react';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';
import { useRoomViews } from '@/hooks/useRoomViews';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useToast } from '@/hooks/use-toast';

interface AddRoomViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  coordinates?: { x: number; y: number };
  floor: number;
}

export const AddRoomViewModal = ({
  open,
  onOpenChange,
  locationId,
  coordinates,
  floor,
}: AddRoomViewModalProps) => {
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [autoCapturing, setAutoCapturing] = useState(false);

  const { capturePhoto, selectFromGallery, loading: photoLoading } = usePhotoCapture();
  const { addRoomView } = useRoomViews();
  const { employee: currentEmployee } = useCurrentEmployee();
  const { toast } = useToast();

  // Auto-trigger camera when modal opens
  useEffect(() => {
    if (open && coordinates && !autoCapturing && !capturedPhoto) {
      setAutoCapturing(true);
      handlePhotoCapture();
    }
  }, [open, coordinates]);

  const handlePhotoCapture = async () => {
    if (!currentEmployee?.id) {
      toast({
        title: "Error",
        description: "Employee information required",
        variant: "destructive",
      });
      return;
    }

        try {
          const photo = await capturePhoto(
            'room_view',
            description || 'Room view photo',
            undefined,
            locationId,
            undefined,
            currentEmployee.id
          );

          if (photo) {
            setCapturedPhoto(photo.url);
            setAutoCapturing(false);
            // Auto-submit if we have coordinates and a photo
            if (coordinates) {
              await handleAutoSubmit(photo.url);
            }
          } else {
            console.log('Photo capture returned null - user likely cancelled or permission denied');
            setAutoCapturing(false);
            // If user cancels camera, close modal
            onOpenChange(false);
          }
        } catch (error) {
          console.error('Photo capture error in modal:', error);
          setAutoCapturing(false);
          toast({
            title: "Camera Error", 
            description: "Unable to access camera. Please check permissions and try again.",
            variant: "destructive",
          });
        }
  };

  const handleGallerySelect = async () => {
    if (!currentEmployee?.id) {
      toast({
        title: "Error",
        description: "Employee information required",
        variant: "destructive",
      });
      return;
    }

    const photo = await selectFromGallery(
      'room_view',
      description || 'Room view photo',
      undefined,
      locationId,
      undefined,
      currentEmployee.id
    );

    if (photo) {
      setCapturedPhoto(photo.url);
    }
  };

  const handleAutoSubmit = async (photoUrl: string) => {
    if (!coordinates || !currentEmployee?.id) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await addRoomView({
        location_id: locationId,
        floor,
        x_coordinate: coordinates.x,
        y_coordinate: coordinates.y,
        room_name: roomName || undefined,
        description: description || 'Room view',
        photo_url: photoUrl,
        employee_id: currentEmployee.id,
      });

      // Reset form and close
      handleClose();
    } catch (error) {
      console.error('Error adding room view:', error);
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!coordinates || !capturedPhoto || !currentEmployee?.id) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    await handleAutoSubmit(capturedPhoto);
  };

  const handleClose = () => {
    setRoomName('');
    setDescription('');
    setCapturedPhoto(null);
    setAutoCapturing(false);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {autoCapturing ? 'Opening Camera...' : 'Room View Captured'}
          </DialogTitle>
        </DialogHeader>

        {autoCapturing ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Camera className="h-16 w-16 text-blue-600 animate-pulse" />
            <p className="text-center text-muted-foreground">
              Opening camera to capture room view...
            </p>
            <p className="text-xs text-center text-muted-foreground max-w-sm">
              If camera doesn't open, please check device permissions. Some devices may take a moment to show the camera permission dialog.
            </p>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        ) : capturedPhoto ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedPhoto}
                alt="Captured room view"
                className="w-full h-48 object-cover rounded-lg border"
              />
            </div>

            <div>
              <Label htmlFor="roomName">Room Name (Optional)</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name..."
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this view shows..."
                rows={2}
              />
            </div>

            {coordinates && (
              <div className="text-sm text-muted-foreground">
                Position: {coordinates.x.toFixed(1)}%, {coordinates.y.toFixed(1)}%
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCapturedPhoto(null)} className="flex-1">
                Retake Photo
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Adding...' : 'Add Room View'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-muted-foreground">No photo captured</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handlePhotoCapture} disabled={photoLoading} className="flex-col h-20">
                <Camera className="h-6 w-6 mb-1" />
                Take Photo
              </Button>
              <Button onClick={handleGallerySelect} disabled={photoLoading} variant="outline" className="flex-col h-20">
                <Upload className="h-6 w-6 mb-1" />
                From Gallery
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};