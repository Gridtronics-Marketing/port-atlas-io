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
import { Cable, Edit, Save, X } from 'lucide-react';
import { BackboneCable, useBackboneCables } from '@/hooks/useBackboneCables';
import { useToast } from '@/hooks/use-toast';

interface BackboneCableDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cable: BackboneCable | null;
  onSuccess?: () => void;
}

export const BackboneCableDetailsModal: React.FC<BackboneCableDetailsModalProps> = ({
  open,
  onOpenChange,
  cable,
  onSuccess
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BackboneCable>>({});
  const { updateCable } = useBackboneCables();
  const { toast } = useToast();

  React.useEffect(() => {
    if (cable) {
      setFormData({ ...cable });
    }
  }, [cable]);

  const handleSave = async () => {
    if (!cable || !formData.id) return;

    try {
      await updateCable(cable.id, formData);
      toast({
        title: "Success",
        description: "Cable details updated successfully",
      });
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cable details",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (cable) {
      setFormData({ ...cable });
    }
    setIsEditing(false);
  };

  if (!cable) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cable className="h-5 w-5" />
              Cable Details: {cable.cable_label}
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
                <Label htmlFor="cable_label">Cable Label</Label>
                {isEditing ? (
                  <Input
                    id="cable_label"
                    value={formData.cable_label || ''}
                    onChange={(e) => setFormData({ ...formData, cable_label: e.target.value })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.cable_label}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cable_type">Cable Type</Label>
                {isEditing ? (
                  <Select
                    value={formData.cable_type || ''}
                    onValueChange={(value) => setFormData({ ...formData, cable_type: value as 'fiber' | 'copper' | 'coax' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cable type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiber">Fiber</SelectItem>
                      <SelectItem value="copper">Copper</SelectItem>
                      <SelectItem value="coax">Coaxial</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`bg-${cable.cable_type === 'fiber' ? 'blue' : cable.cable_type === 'copper' ? 'orange' : 'gray'}-500`}>
                    {cable.cable_type.toUpperCase()}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cable_subtype">Cable Subtype</Label>
                {isEditing ? (
                  <Input
                    id="cable_subtype"
                    value={formData.cable_subtype || ''}
                    onChange={(e) => setFormData({ ...formData, cable_subtype: e.target.value })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.cable_subtype || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jacket_rating">Jacket Rating</Label>
                {isEditing ? (
                  <Select
                    value={formData.jacket_rating || ''}
                    onValueChange={(value) => setFormData({ ...formData, jacket_rating: value as 'plenum' | 'riser' | 'LSZH' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select jacket rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plenum">Plenum</SelectItem>
                      <SelectItem value="riser">Riser</SelectItem>
                      <SelectItem value="LSZH">LSZH</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 border rounded-md">{cable.jacket_rating || 'N/A'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Connection Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin_equipment">Origin Equipment</Label>
                {isEditing ? (
                  <Input
                    id="origin_equipment"
                    value={formData.origin_equipment || ''}
                    onChange={(e) => setFormData({ ...formData, origin_equipment: e.target.value })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.origin_equipment || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_equipment">Destination Equipment</Label>
                {isEditing ? (
                  <Input
                    id="destination_equipment"
                    value={formData.destination_equipment || ''}
                    onChange={(e) => setFormData({ ...formData, destination_equipment: e.target.value })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.destination_equipment || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin_floor">Origin Floor</Label>
                {isEditing ? (
                  <Input
                    id="origin_floor"
                    type="number"
                    value={formData.origin_floor || ''}
                    onChange={(e) => setFormData({ ...formData, origin_floor: parseInt(e.target.value) || undefined })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.origin_floor || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_floor">Destination Floor</Label>
                {isEditing ? (
                  <Input
                    id="destination_floor"
                    type="number"
                    value={formData.destination_floor || ''}
                    onChange={(e) => setFormData({ ...formData, destination_floor: parseInt(e.target.value) || undefined })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.destination_floor || 'N/A'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Capacity & Technical */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Capacity & Technical Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="strand_count">Strand Count</Label>
                {isEditing ? (
                  <Input
                    id="strand_count"
                    type="number"
                    value={formData.strand_count || ''}
                    onChange={(e) => setFormData({ ...formData, strand_count: parseInt(e.target.value) || undefined })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.strand_count || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pair_count">Pair Count</Label>
                {isEditing ? (
                  <Input
                    id="pair_count"
                    type="number"
                    value={formData.pair_count || ''}
                    onChange={(e) => setFormData({ ...formData, pair_count: parseInt(e.target.value) || undefined })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.pair_count || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity_total">Total Capacity</Label>
                {isEditing ? (
                  <Input
                    id="capacity_total"
                    type="number"
                    value={formData.capacity_total || ''}
                    onChange={(e) => setFormData({ ...formData, capacity_total: parseInt(e.target.value) || undefined })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.capacity_total || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity_used">Used Capacity</Label>
                {isEditing ? (
                  <Input
                    id="capacity_used"
                    type="number"
                    value={formData.capacity_used || ''}
                    onChange={(e) => setFormData({ ...formData, capacity_used: parseInt(e.target.value) || undefined })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.capacity_used || 0}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity_spare">Spare Capacity</Label>
                {isEditing ? (
                  <Input
                    id="capacity_spare"
                    type="number"
                    value={formData.capacity_spare || ''}
                    onChange={(e) => setFormData({ ...formData, capacity_spare: parseInt(e.target.value) || undefined })}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{cable.capacity_spare || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Utilization</Label>
                <div className="p-2 border rounded-md">
                  {cable.capacity_total ? 
                    `${Math.round((cable.capacity_used || 0) / cable.capacity_total * 100)}%` : 
                    'N/A'
                  }
                </div>
              </div>
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
              <div className="p-2 border rounded-md min-h-[60px]">{cable.notes || 'No notes'}</div>
            )}
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span> {new Date(cable.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {new Date(cable.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};