import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, User, Calendar, MapPin, Hash, Camera, Upload, Maximize2 } from 'lucide-react';
import { RoomView } from '@/hooks/useRoomViews';
import { useRoomViews } from '@/hooks/useRoomViews';
import { useRoomViewPhotos, RoomViewPhoto } from '@/hooks/useRoomViewPhotos';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useToast } from '@/hooks/use-toast';
import { PhotoGallery } from '@/components/PhotoGallery';
import { SignedImage } from '@/components/ui/signed-image';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Json } from '@/integrations/supabase/types';

interface RoomViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomView: RoomView | null;
  locationId: string;
}

export const RoomViewModal: React.FC<RoomViewModalProps> = ({
  open,
  onOpenChange,
  roomView,
  locationId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<RoomView>>({});
  const [activeTab, setActiveTab] = useState('details');
  const { updateRoomView, deleteRoomView } = useRoomViews(locationId);
  const { photos, loading: photosLoading, addPhoto, updatePhoto, deletePhoto } = useRoomViewPhotos(roomView?.id);
  const { capturePhoto, selectFromGallery } = usePhotoCapture();
  const { employee } = useCurrentEmployee();
  const { hasRole } = useUserRoles();
  const { toast } = useToast();
  const isAdmin = hasRole('admin');

  if (!roomView) return null;

  const handleEdit = () => {
    setEditData({
      room_name: roomView.room_name || '',
      description: roomView.description || '',
      ceiling_height: roomView.ceiling_height ?? null,
      ceiling_height_unit: roomView.ceiling_height_unit || 'ft'
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateRoomView(roomView.id, editData);
      toast({
        title: "Success",
        description: "Room view updated successfully",
      });
    } catch (error) {
      console.error('Error updating room view:', error);
      toast({
        title: "Error",
        description: "Failed to update room view",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoomView(roomView.id);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Room view deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting room view:', error);
      toast({
        title: "Error",  
        description: "Failed to delete room view",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handlePhotoCapture = async (isPanoramic: boolean = false) => {
    if (!roomView?.id) {
      toast({
        title: "Error",
        description: "Room view ID is missing. Please close and reopen this view.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await capturePhoto(
        `${isPanoramic ? 'Panoramic ' : ''}${roomView.room_name || 'Room View'}`,
        'room_view',
        undefined,
        locationId,
        undefined,
        employee?.id,
        isAdmin,
        isPanoramic
      );
      if (result && typeof result === 'object' && 'url' in result) {
        await addPhoto({
          room_view_id: roomView.id,
          photo_url: result.url,
          description: `${isPanoramic ? 'Panoramic ' : ''}${roomView.room_name || 'Room View'}`,
          employee_id: employee?.id || null,
          photo_type: isPanoramic ? 'panoramic' : 'standard',
          storage_bucket: 'room-views',
        });
        toast({
          title: 'Success',
          description: `${isPanoramic ? 'Panoramic photo' : 'Photo'} captured successfully`,
        });
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Error",
        description: "Failed to add photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGallerySelect = async (isPanoramic: boolean = false) => {
    if (!roomView?.id) {
      toast({
        title: "Error",
        description: "Room view ID is missing. Please close and reopen this view.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await selectFromGallery(
        `${isPanoramic ? 'Panoramic ' : ''}${roomView.room_name || 'Room View'}`,
        'room_view',
        undefined,
        locationId,
        undefined,
        employee?.id,
        isAdmin,
        isPanoramic
      );
      if (result && typeof result === 'object' && 'url' in result) {
        await addPhoto({
          room_view_id: roomView.id,
          photo_url: result.url,
          description: `${isPanoramic ? 'Panoramic ' : ''}${roomView.room_name || 'Room View'}`,
          employee_id: employee?.id || null,
          photo_type: isPanoramic ? 'panoramic' : 'standard',
          storage_bucket: 'room-views',
        });
        toast({
          title: 'Success',
          description: `${isPanoramic ? 'Panoramic photo' : 'Photo'} uploaded successfully`,
        });
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      await deletePhoto(photoId, photoUrl);
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleUpdatePhoto = async (photoId: string, updates: { annotation_data?: string; annotation_metadata?: Record<string, any>; description?: string }) => {
    try {
      await updatePhoto(photoId, updates);
    } catch (error) {
      console.error('Error updating photo:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto lg:max-w-[95vw] lg:w-[95vw] lg:h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Room View Details</span>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Room View</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this room view? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Room Name and Ceiling Height */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="room_name" className="text-sm font-medium">
                  Room Name
                </Label>
                {isEditing ? (
                  <Input
                    id="room_name"
                    value={editData.room_name || ''}
                    onChange={(e) => setEditData({ ...editData, room_name: e.target.value })}
                    placeholder="Enter room name"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">
                    {roomView?.room_name || 'Not specified'}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="ceiling_height" className="text-sm font-medium">
                  Ceiling Height
                </Label>
                {isEditing ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="ceiling_height"
                      type="number"
                      step="0.1"
                      min="0"
                      value={editData.ceiling_height ?? ''}
                      onChange={(e) => setEditData({ ...editData, ceiling_height: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="e.g., 9.5"
                      className="flex-1"
                    />
                    <Select 
                      value={editData.ceiling_height_unit || 'ft'} 
                      onValueChange={(value) => setEditData({ ...editData, ceiling_height_unit: value })}
                    >
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
                ) : (
                  <p className="mt-1 text-sm">
                    {roomView?.ceiling_height != null 
                      ? `${roomView.ceiling_height} ${roomView.ceiling_height_unit || 'ft'}`
                      : 'Not specified'}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Enter description"
                  className="mt-1"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-sm">
                  {roomView?.description || 'No description'}
                </p>
              )}
            </div>

            {/* Original Photo */}
            <div>
              <Label className="text-sm font-medium">Original Photo</Label>
              <div className="mt-2">
                <SignedImage
                  bucket="room-views"
                  path={roomView?.photo_url}
                  alt="Room view"
                  className="w-full max-w-md h-48 object-cover rounded-lg border"
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Captured by</p>
                  <p className="text-sm text-muted-foreground">
                    {roomView?.employee 
                      ? `${roomView.employee.first_name} ${roomView.employee.last_name}`
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date captured</p>
                  <p className="text-sm text-muted-foreground">
                    {roomView?.created_at 
                      ? new Date(roomView.created_at).toLocaleDateString()
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Position</p>
                  <p className="text-sm text-muted-foreground">
                    X: {roomView?.x_coordinate || 0}, Y: {roomView?.y_coordinate || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Floor</p>
                  <p className="text-sm text-muted-foreground">
                    Floor {roomView?.floor || 1}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Room Photos</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button onClick={() => handlePhotoCapture(false)} size="sm">
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
              <Button onClick={() => handleGallerySelect(false)} variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              <Button onClick={() => handlePhotoCapture(true)} variant="secondary" size="sm">
                <Maximize2 className="w-4 h-4 mr-2" />
                Take Panoramic
              </Button>
              <Button onClick={() => handleGallerySelect(true)} variant="outline" size="sm">
                <Maximize2 className="w-4 h-4 mr-2" />
                Upload Panoramic
              </Button>
            </div>

            <PhotoGallery
              photos={photos}
              onDeletePhoto={handleDeletePhoto}
              onUpdatePhoto={handleUpdatePhoto}
              loading={photosLoading}
              emptyMessage="No additional photos for this room view. Take or upload photos to document the space."
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Room View Created</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Created by: {roomView?.employee ? `${roomView.employee.first_name} ${roomView.employee.last_name}` : 'Unknown'}</p>
                  <p>Date: {roomView?.created_at ? new Date(roomView.created_at).toLocaleString() : 'Unknown'}</p>
                  <p>Location: Floor {roomView?.floor}, Position ({roomView?.x_coordinate}, {roomView?.y_coordinate})</p>
                </div>
              </div>
              
              {roomView?.updated_at && roomView.updated_at !== roomView.created_at && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Last Updated</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>Date: {new Date(roomView.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};