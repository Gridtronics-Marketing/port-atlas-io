import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, X, Maximize2 } from 'lucide-react';
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
  onSuccess?: () => void;
}

export const AddRoomViewModal = ({
  open,
  onOpenChange,
  locationId,
  coordinates,
  floor,
  onSuccess,
}: AddRoomViewModalProps) => {
  const [roomName, setRoomName] = useState('');
  const [ceilingHeight, setCeilingHeight] = useState<number | null>(null);
  const [ceilingHeightUnit, setCeilingHeightUnit] = useState('ft');
  const [description, setDescription] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isPanoramic, setIsPanoramic] = useState(false);

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

  // Auto-submit when photo is captured for coordinates-based flow
  useEffect(() => {
    if (capturedPhoto && coordinates && coordinates.x >= 0 && coordinates.y >= 0 && !submitting) {
      console.log('📍 Auto-submitting room view with coordinates:', coordinates);
      // Small delay to ensure state is properly set
      setTimeout(() => {
        handleAutoSubmit(capturedPhoto);
      }, 100);
    }
  }, [capturedPhoto, coordinates, submitting]);

  const handlePhotoCapture = async (e: React.MouseEvent, panoramic: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📸 Photo capture button clicked');
    
    if (!canAddRoomView) {
      toast({
        title: "Employee Profile Required",
        description: "You need an employee profile to add room views. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    setShowPhotoOptions(false);
    setIsPanoramic(panoramic);

    try {
      console.log('📸 Starting photo capture...');
      const photo = await capturePhoto(
        description || 'Room view photo',
        'room_view',
        undefined,
        locationId,
        undefined,
        currentEmployee?.id,
        isAdmin,
        panoramic
      );

      if (photo) {
        console.log('📸 Photo captured successfully:', photo.url);
        setCapturedPhoto(photo.url);
      } else {
        console.log('📸 Photo capture returned null - user likely cancelled');
        setShowPhotoOptions(true); // Show options again if cancelled
      }
    } catch (error) {
      console.error('📸 Photo capture error in modal:', error);
      setShowPhotoOptions(true); // Show options again on error
      toast({
        title: "Camera Error", 
        description: "Unable to access camera. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const handleGallerySelect = async (e: React.MouseEvent, panoramic: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖼️ Gallery select button clicked');
    
    if (!canAddRoomView) {
      toast({
        title: "Employee Profile Required",
        description: "You need an employee profile to add room views. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    setShowPhotoOptions(false);
    setIsPanoramic(panoramic);

    try {
      console.log('🖼️ Starting gallery selection...');
      const photo = await selectFromGallery(
        description || 'Room view photo',
        'room_view',
        undefined,
        locationId,
        undefined,
        currentEmployee?.id,
        isAdmin,
        panoramic
      );

      if (photo) {
        console.log('🖼️ Photo selected successfully:', photo.url);
        setCapturedPhoto(photo.url);
      } else {
        console.log('🖼️ Gallery selection cancelled or failed');
        setShowPhotoOptions(true); // Show options again if cancelled
      }
    } catch (error) {
      console.error('🖼️ Gallery selection error:', error);
      setShowPhotoOptions(true);
      toast({
        title: "Gallery Error",
        description: "Unable to access gallery. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAutoSubmit = async (photoUrl: string) => {
    if (!canAddRoomView) {
      toast({
        title: "Employee Profile Required",
        description: "You need an employee profile to add room views. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Handle both coordinate-based and manual room view creation
      const roomViewData = {
        location_id: locationId,
        floor,
        x_coordinate: coordinates?.x || 50, // Default position if no coordinates
        y_coordinate: coordinates?.y || 50,
        room_name: roomName || `Room View ${Date.now()}`,
        ceiling_height: ceilingHeight,
        ceiling_height_unit: ceilingHeightUnit,
        description: description || 'Room view',
        photo_url: photoUrl,
        employee_id: currentEmployee?.id || null,
      };
      
      console.log('Adding room view with data:', roomViewData);
      await addRoomView(roomViewData);

      toast({
        title: "Success",
        description: "Room view added successfully!",
      });

      // Wait for parent refresh to complete before closing modal
      if (onSuccess) {
        await Promise.resolve(onSuccess());
      }

      // Small delay to ensure parent component updates before modal closes
      setTimeout(() => {
        handleClose();
      }, 300);
      
    } catch (error) {
      console.error('Error adding room view:', error);
      toast({
        title: "Error",
        description: "Failed to add room view. Please try again.",
        variant: "destructive",
      });
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
    setCeilingHeight(null);
    setCeilingHeightUnit('ft');
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
              <h3 className="text-lg font-semibold mb-2">Choose Photo Type & Source</h3>
              <p className="text-sm text-muted-foreground">
                Select whether you want a standard or panoramic photo
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
              <Button
                onClick={(e) => handlePhotoCapture(e, false)}
                disabled={photoLoading}
                className="h-14"
              >
                <Camera className="h-5 w-5 mr-2" />
                Take Standard Photo
              </Button>
              <Button
                variant="outline"
                onClick={(e) => handleGallerySelect(e, false)}
                disabled={photoLoading}
                className="h-14"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Standard Photo
              </Button>
              <Button
                onClick={(e) => handlePhotoCapture(e, true)}
                disabled={photoLoading}
                className="h-14"
              >
                <Maximize2 className="h-5 w-5 mr-2" />
                Take Panoramic Photo
              </Button>
              <Button
                variant="outline"
                onClick={(e) => handleGallerySelect(e, true)}
                disabled={photoLoading}
                className="h-14"
              >
                <Maximize2 className="h-5 w-5 mr-2" />
                Upload Panoramic Photo
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

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="ceilingHeight">Ceiling Height (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="ceilingHeight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={ceilingHeight ?? ''}
                    onChange={(e) => setCeilingHeight(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="e.g., 9.5"
                    className="flex-1"
                  />
                  <Select value={ceilingHeightUnit} onValueChange={setCeilingHeightUnit}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="cm">cm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
              }} className="flex-1" disabled={submitting}>
                Change Photo
              </Button>
              <Button
                onClick={() => handleAutoSubmit(capturedPhoto)}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Adding Room View...' : 'Add Room View'}
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