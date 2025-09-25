import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Network, Edit, Save, X } from 'lucide-react';
import { DistributionFrame, useDistributionFrames } from '@/hooks/useDistributionFrames';
import { useToast } from '@/hooks/use-toast';

interface DistributionFrameDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frame: DistributionFrame | null;
  onSuccess?: () => void;
}

export const DistributionFrameDetailsModal: React.FC<DistributionFrameDetailsModalProps> = ({
  open,
  onOpenChange,
  frame,
  onSuccess
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<DistributionFrame>>({});
  const { updateFrame } = useDistributionFrames();
  const { toast } = useToast();

  React.useEffect(() => {
    if (frame) {
      setFormData({ ...frame });
    }
  }, [frame]);

  const handleSave = async () => {
    if (!frame || !formData.id) return;

    try {
      await updateFrame(frame.id, formData);
      toast({
        title: "Success",
        description: "Distribution frame updated successfully",
      });
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update distribution frame",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (frame) {
      setFormData({ ...frame });
    }
    setIsEditing(false);
  };

  if (!frame) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              {frame.frame_type} - Floor {frame.floor}
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frame_type">Frame Type</Label>
                {isEditing ? (
                  <Select
                    value={formData.frame_type || ''}
                    onValueChange={(value) => setFormData({ ...formData, frame_type: value as 'MDF' | 'IDF' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frame type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MDF">MDF (Main Distribution Frame)</SelectItem>
                      <SelectItem value="IDF">IDF (Intermediate Distribution Frame)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={frame.frame_type === 'MDF' ? 'default' : 'secondary'}>
                    {frame.frame_type} ({frame.frame_type === 'MDF' ? 'Main' : 'Intermediate'} Distribution Frame)
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                {isEditing ? (
                  <Input
                    id="floor"
                    type="number"
                    value={formData.floor || ''}
                    onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">Floor {frame.floor}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                {isEditing ? (
                  <Input
                    id="room"
                    value={formData.room || ''}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{frame.room || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rack_position">Rack Position</Label>
                {isEditing ? (
                  <Input
                    id="rack_position"
                    type="number"
                    value={formData.rack_position || ''}
                    onChange={(e) => setFormData({ ...formData, rack_position: parseInt(e.target.value) || undefined })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{frame.rack_position || 'N/A'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Capacity Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Capacity Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="port_count">Port Count</Label>
                {isEditing ? (
                  <Input
                    id="port_count"
                    type="number"
                    value={formData.port_count || ''}
                    onChange={(e) => setFormData({ ...formData, port_count: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{frame.port_count || 0}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Total Capacity</Label>
                {isEditing ? (
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{frame.capacity || 0}</div>
                )}
              </div>
            </div>
          </div>

          {/* Position Coordinates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Position Coordinates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="x_coordinate">X Coordinate</Label>
                {isEditing ? (
                  <Input
                    id="x_coordinate"
                    type="number"
                    step="0.01"
                    value={formData.x_coordinate || ''}
                    onChange={(e) => setFormData({ ...formData, x_coordinate: parseFloat(e.target.value) || undefined })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{frame.x_coordinate || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="y_coordinate">Y Coordinate</Label>
                {isEditing ? (
                  <Input
                    id="y_coordinate"
                    type="number"
                    step="0.01"
                    value={formData.y_coordinate || ''}
                    onChange={(e) => setFormData({ ...formData, y_coordinate: parseFloat(e.target.value) || undefined })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{frame.y_coordinate || 'N/A'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Patch Panels */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Patch Panels</h3>
            <div className="p-3 border rounded-lg">
              {frame.patch_panels && Array.isArray(frame.patch_panels) && frame.patch_panels.length > 0 ? (
                <div className="space-y-2">
                  {frame.patch_panels.map((panel: any, index: number) => (
                    <div key={index} className="text-sm">
                      Panel {index + 1}: {JSON.stringify(panel)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No patch panels configured</div>
              )}
            </div>
          </div>

          {/* Equipment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Equipment Details</h3>
            <div className="p-3 border rounded-lg">
              {frame.equipment_details && typeof frame.equipment_details === 'object' ? (
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(frame.equipment_details, null, 2)}
                </pre>
              ) : (
                <div className="text-sm text-muted-foreground">No equipment details available</div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            {isEditing ? (
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            ) : (
              <div className="p-2 border rounded-md min-h-[60px]">{frame.notes || 'No notes'}</div>
            )}
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span> {new Date(frame.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {new Date(frame.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};