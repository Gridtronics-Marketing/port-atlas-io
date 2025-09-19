import { useState } from 'react';
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

  const { capturePhoto, selectFromGallery, loading: photoLoading } = usePhotoCapture();
  const { addRoomView } = useRoomViews();
  const { employee: currentEmployee } = useCurrentEmployee();
  const { toast } = useToast();

  const handlePhotoCapture = async () => {
    if (!currentEmployee?.id) {
      toast({
        title: "Error",
        description: "Employee information required",
        variant: "destructive",
      });
      return;
    }

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

  const handleSubmit = async () => {
    if (!coordinates || !capturedPhoto || !currentEmployee?.id) {
      toast({
        title: "Error",
        description: "All fields are required",
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
        description: description || undefined,
        photo_url: capturedPhoto,
        employee_id: currentEmployee.id,
      });

      // Reset form
      setRoomName('');
      setDescription('');
      setCapturedPhoto(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding room view:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRoomName('');
    setDescription('');
    setCapturedPhoto(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Room View</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Photo Capture</Label>
            {!capturedPhoto ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handlePhotoCapture}
                  disabled={photoLoading}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <Camera className="h-6 w-6 mb-1" />
                  Take Photo
                </Button>
                <Button
                  onClick={handleGallerySelect}
                  disabled={photoLoading}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <Upload className="h-6 w-6 mb-1" />
                  From Gallery
                </Button>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={capturedPhoto}
                  alt="Captured room view"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  onClick={() => setCapturedPhoto(null)}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {coordinates && (
            <div className="text-sm text-muted-foreground">
              Position: {coordinates.x.toFixed(1)}%, {coordinates.y.toFixed(1)}%
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!capturedPhoto || submitting || photoLoading}
            className="flex-1"
          >
            {submitting ? 'Adding...' : 'Add Room View'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};