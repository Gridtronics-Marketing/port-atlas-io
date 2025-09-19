import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RoomView } from '@/hooks/useRoomViews';
import { format } from 'date-fns';

interface RoomViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomView: RoomView | null;
}

export const RoomViewModal = ({ open, onOpenChange, roomView }: RoomViewModalProps) => {
  if (!roomView) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{roomView.room_name || 'Room View'}</span>
            <Badge variant="secondary">Floor {roomView.floor}</Badge>
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
            {roomView.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{roomView.description}</p>
              </div>
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