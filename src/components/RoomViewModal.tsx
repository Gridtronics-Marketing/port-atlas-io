import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Save, X } from 'lucide-react';
import { RoomView, useRoomViews } from '@/hooks/useRoomViews';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RoomViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomView: RoomView | null;
  locationId: string;
}

export const RoomViewModal = ({ open, onOpenChange, roomView, locationId }: RoomViewModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    room_name: '',
    description: ''
  });
  
  const { updateRoomView, deleteRoomView } = useRoomViews(locationId);
  const { toast } = useToast();

  if (!roomView) return null;

  const handleEdit = () => {
    setEditData({
      room_name: roomView.room_name || '',
      description: roomView.description || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateRoomView(roomView.id, editData);
      setIsEditing(false);
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
    setEditData({
      room_name: roomView.room_name || '',
      description: roomView.description || ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{roomView.room_name || 'Room View'}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Floor {roomView.floor}</Badge>
              {!isEditing ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
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
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Display */}
          <div className="relative">
            <img
              src={roomView.photo_url}
              alt={roomView.room_name || 'Room view'}
              className="w-full max-h-96 object-contain rounded-lg border bg-muted"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>

          {/* Details */}
          <div className="space-y-3">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="room_name">Room Name</Label>
                  <Input
                    id="room_name"
                    value={editData.room_name}
                    onChange={(e) => setEditData(prev => ({ ...prev, room_name: e.target.value }))}
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <>
                {roomView.room_name && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Room Name</h4>
                    <p className="text-sm">{roomView.room_name}</p>
                  </div>
                )}
                {roomView.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm">{roomView.description}</p>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-muted-foreground mb-1">Captured By</h4>
                <p>
                  {roomView.employee?.first_name} {roomView.employee?.last_name}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-muted-foreground mb-1">Date Captured</h4>
                <p>{format(new Date(roomView.created_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-muted-foreground mb-1">Position</h4>
                <p>
                  X: {roomView.x_coordinate.toFixed(1)}%, Y: {roomView.y_coordinate.toFixed(1)}%
                </p>
              </div>

              <div>
                <h4 className="font-medium text-muted-foreground mb-1">Floor</h4>
                <p>Floor {roomView.floor}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};