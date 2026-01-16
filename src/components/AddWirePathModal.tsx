import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWirePaths } from '@/hooks/useWirePaths';

interface AddWirePathModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  floor: number;
  pathPoints: { x: number; y: number }[];
  onSuccess?: () => void;
}

const CABLE_TYPES = [
  { value: 'copper', label: 'Copper (Cat5e/Cat6)', color: '#f97316' },
  { value: 'fiber', label: 'Fiber Optic', color: '#22c55e' },
  { value: 'coax', label: 'Coaxial', color: '#3b82f6' },
  { value: 'speaker', label: 'Speaker Wire', color: '#a855f7' },
  { value: 'power', label: 'Power/Electrical', color: '#ef4444' },
  { value: 'hdmi', label: 'HDMI/AV', color: '#eab308' },
  { value: 'other', label: 'Other', color: '#6b7280' },
];

const PATH_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'installed', label: 'Installed' },
  { value: 'tested', label: 'Tested' },
];

export const AddWirePathModal = ({
  open,
  onOpenChange,
  locationId,
  floor,
  pathPoints,
  onSuccess,
}: AddWirePathModalProps) => {
  const { addWirePath } = useWirePaths(locationId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cable_type: 'copper',
    label: '',
    notes: '',
    color: '#f97316',
    status: 'planned',
  });

  const handleCableTypeChange = (value: string) => {
    const cableType = CABLE_TYPES.find(t => t.value === value);
    setFormData({
      ...formData,
      cable_type: value,
      color: cableType?.color || '#3b82f6',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pathPoints.length < 2) return;

    setIsSubmitting(true);
    try {
      await addWirePath({
        location_id: locationId,
        floor,
        path_points: pathPoints,
        cable_type: formData.cable_type,
        label: formData.label || undefined,
        notes: formData.notes || undefined,
        color: formData.color,
        status: formData.status,
      });
      
      onSuccess?.();
      onOpenChange(false);
      setFormData({
        cable_type: 'copper',
        label: '',
        notes: '',
        color: '#f97316',
        status: 'planned',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFormData({
      cable_type: 'copper',
      label: '',
      notes: '',
      color: '#f97316',
      status: 'planned',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Wire Path</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cable_type">Cable Type</Label>
            <Select value={formData.cable_type} onValueChange={handleCableTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select cable type" />
              </SelectTrigger>
              <SelectContent>
                {CABLE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PATH_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label (Optional)</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Main trunk to IDF-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">
                {formData.color}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this cable run..."
              rows={3}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Path has {pathPoints.length} points
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || pathPoints.length < 2}>
              {isSubmitting ? 'Adding...' : 'Add Wire Path'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
