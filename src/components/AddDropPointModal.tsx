import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDropPoints } from "@/hooks/useDropPoints";
import { useToast } from "@/hooks/use-toast";

interface AddDropPointModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  coordinates?: { x: number; y: number };
  floor?: number;
}

const DROP_POINT_TYPES = [
  { value: 'data', label: 'Data' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'camera', label: 'Camera' },
  { value: 'mdf_idf', label: 'MDF/IDF' },
  { value: 'access_control', label: 'Access Control' },
  { value: 'av', label: 'A/V' },
  { value: 'other', label: 'Other' },
];

export const AddDropPointModal = ({ 
  open, 
  onOpenChange, 
  locationId, 
  coordinates,
  floor = 1
}: AddDropPointModalProps) => {
  const [formData, setFormData] = useState({
    point_type: 'data',
    cable_count: 1,
    label: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addDropPoint } = useDropPoints(locationId);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const dropPointData = {
        location_id: locationId,
        point_type: formData.point_type,
        label: formData.label.trim() || null,
        cable_count: formData.cable_count,
        notes: formData.notes.trim() || null,
        floor: floor,
        x_coordinate: coordinates?.x || 50,
        y_coordinate: coordinates?.y || 50,
        status: 'planned',
        type_specific_data: {},
        room: null,
        cable_id: null,
        patch_panel_port: null,
        switch_port: null,
        vlan: null,
        ip_address: null,
        mac_address: null,
        installed_by: null,
        installed_date: null,
        tested_by: null,
        tested_date: null,
        test_results: null,
      } as any;

      await addDropPoint(dropPointData);

      toast({
        title: "Success",
        description: "Drop point added successfully",
      });

      // Reset form
      setFormData({
        point_type: 'data',
        cable_count: 1,
        label: '',
        notes: '',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding drop point:", error);
      toast({
        title: "Error",
        description: "Failed to add drop point",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      point_type: 'data',
      cable_count: 1,
      label: '',
      notes: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Drop Point</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type - First Field */}
          <div className="space-y-2">
            <Label htmlFor="point_type">Type *</Label>
            <Select
              value={formData.point_type}
              onValueChange={(value) => setFormData({ ...formData, point_type: value })}
            >
              <SelectTrigger id="point_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DROP_POINT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Number of Cables */}
          <div className="space-y-2">
            <Label htmlFor="cable_count">Number of Cables</Label>
            <Input
              id="cable_count"
              type="number"
              min="1"
              value={formData.cable_count}
              onChange={(e) => setFormData({ ...formData, cable_count: parseInt(e.target.value) || 1 })}
            />
          </div>

          {/* Label - Optional */}
          <div className="space-y-2">
            <Label htmlFor="label">Label (Optional)</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., DP-101"
            />
          </div>

          {/* Notes - Optional */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Coordinate Info */}
          {coordinates && (
            <div className="text-xs text-muted-foreground">
              Position: {coordinates.x.toFixed(1)}%, {coordinates.y.toFixed(1)}%
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Drop Point"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};