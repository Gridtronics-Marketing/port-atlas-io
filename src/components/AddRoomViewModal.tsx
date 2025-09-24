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
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
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
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const { capturePhoto, selectFromGallery, loading: photoLoading } = usePhotoCapture();
  const { addRoomView } = useRoomViews();
  const { employee: currentEmployee } = useCurrentEmployee();
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  const { toast } = useToast();

  const isAdmin = hasRole('admin');
  const canAddRoomView = currentEmployee?.id || isAdmin;

  // Show photo options when modal opens with coordinates - but only if no photo yet
  useEffect(() => {
    if (open && coordinates && !capturedPhoto && !showPhotoOptions) {
      // Add a small delay to prevent conflicts with other modal operations
      const timer = setTimeout(() => {
        setShowPhotoOptions(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, coordinates, capturedPhoto, showPhotoOptions]);

  const handlePhotoCapture = async () => {
    if (!canAddRoomView) {
      toast({
        title: "Employee Profile Required",
        description: "You need an employee profile to add room views. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    setShowPhotoOptions(false);

    try {
      const photo = await capturePhoto(
        'room_view',
        description || 'Room view photo',
        undefined,
        locationId,
        undefined,
        currentEmployee?.id || user?.id
      );

      if (photo) {
        setCapturedPhoto(photo.url);
      } else {
        console.log('Photo capture returned null - user likely cancelled');
        setShowPhotoOptions(true); // Show options again if cancelled
      }
    } catch (error) {
      console.error('Photo capture error in modal:', error);
      setShowPhotoOptions(true); // Show options again on error
      toast({
        title: "Camera Error", 
        description: "Unable to access camera. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const handleGallerySelect = async () => {
    if (!canAddRoomView) {
      toast({
        title: "Employee Profile Required",
        description: "You need an employee profile to add room views. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    setShowPhotoOptions(false);

    const photo = await selectFromGallery(
      'room_view',
      description || 'Room view photo',
      undefined,
      locationId,
      undefined,
      currentEmployee?.id || user?.id
    );

    if (photo) {
      setCapturedPhoto(photo.url);
    } else {
      setShowPhotoOptions(true); // Show options again if cancelled
    }
  };

  const handleAutoSubmit = async (photoUrl: string) => {
    if (!coordinates || !canAddRoomView) {
      toast({
        title: "Employee Profile Required",
        description: "You need an employee profile to add room views. Please contact your administrator.",
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
        employee_id: currentEmployee?.id || null,
      });

      // Reset form and close
      handleClose();
      
      toast({
        title: "Success",
        description: "Room view added successfully!",
      });
    } catch (error) {
      console.error('Error adding room view:', error);
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!coordinates || !capturedPhoto || !canAddRoomView) {
      toast({
        title: "Employee Profile Required", 
        description: "You need an employee profile to add room views. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    await handleAutoSubmit(capturedPhoto);
  };

  const handleClose = () => {
    // Force cleanup of any stuck camera modals
    const existingModal = document.querySelector('[data-camera-modal="true"]');
    if (existingModal) {
      existingModal.remove();
    }
    
    setRoomName('');
    setDescription('');
    setCapturedPhoto(null);
    setShowPhotoOptions(false);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Room View</DialogTitle>
        </DialogHeader>

        {showPhotoOptions ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <Camera className="h-16 w-16 text-blue-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose Photo Source</h3>
              <p className="text-sm text-muted-foreground">
                Select how you'd like to add a photo for this room view
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
              <Button
                onClick={handlePhotoCapture}
                disabled={photoLoading}
                className="h-16 text-lg"
                size="lg"
              >
                <Camera className="h-6 w-6 mr-3" />
                Take Photo with Camera
              </Button>
              <Button
                variant="outline"
                onClick={handleGallerySelect}
                disabled={photoLoading}
                className="h-16 text-lg"
                size="lg"
              >
                <Upload className="h-6 w-6 mr-3" />
                Upload from Gallery
              </Button>
            </div>
            <Button variant="ghost" onClick={handleClose} className="mt-4">
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
              <Button variant="outline" onClick={() => {
                setCapturedPhoto(null);
                setShowPhotoOptions(true);
              }} className="flex-1">
                Change Photo
              </Button>
              <Button
                onClick={() => handleAutoSubmit(capturedPhoto)}
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
              <p className="text-muted-foreground">No photo selected</p>
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