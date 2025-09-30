import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfigurableSelect } from '@/components/ui/configurable-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface DropPointType {
  value: string;
  label: string;
  icon: string;
  description?: string;
  isDefault: boolean;
}

const DEFAULT_TYPES: DropPointType[] = [
  { value: "data", label: "Data Port", icon: "🔌", isDefault: true },
  { value: "fiber", label: "Fiber Optic", icon: "💡", isDefault: true },
  { value: "security", label: "Security Camera", icon: "🔒", isDefault: true },
  { value: "wireless", label: "Wireless Access Point", icon: "📶", isDefault: true },
  { value: "power", label: "Power Outlet", icon: "⚡", isDefault: true },
];

export const AddDropPointModal = ({ 
  open, 
  onOpenChange, 
  locationId, 
  coordinates,
  floor = 1
}: AddDropPointModalProps) => {
  const [availableTypes, setAvailableTypes] = useState<DropPointType[]>(DEFAULT_TYPES);
  const [formData, setFormData] = useState({
    label: "",
    numberOfCables: "",
    cableType: "CAT6" as const,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addDropPoint } = useDropPoints(locationId);
  const { toast } = useToast();

  // Load available drop point types on mount
  useEffect(() => {
    const savedTypes = localStorage.getItem('custom-drop-point-types');
    if (savedTypes) {
      try {
        const customTypes = JSON.parse(savedTypes);
        setAvailableTypes([...DEFAULT_TYPES, ...customTypes]);
      } catch (error) {
        console.error("Failed to load custom drop point types:", error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const dropPointData = {
        location_id: locationId,
        label: formData.label.trim() || `DP-TBD-${Date.now().toString().slice(-6)}`,
        room: null,
        point_type: "data" as const,
        status: "planned" as const,
        cable_count: formData.numberOfCables ? parseInt(formData.numberOfCables) : 1,
        notes: `${formData.numberOfCables ? `Cables: ${formData.numberOfCables}` : 'Cables: TBD'}, Type: ${formData.cableType}${formData.notes ? `, Notes: ${formData.notes}` : ''}`,
        floor,
        x_coordinate: coordinates?.x || null,
        y_coordinate: coordinates?.y || null,
        cable_id: null,
        patch_panel_port: null,
        switch_port: null,
        vlan: null,
        ip_address: null,
        mac_address: null,
        test_results: null,
        installed_by: null,
        installed_date: null,
        tested_by: null,
        tested_date: null,
      };

      await addDropPoint(dropPointData);

      // Reset form and close modal
      setFormData({
        label: "",
        numberOfCables: "",
        cableType: "CAT6",
        notes: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add drop point:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Drop Point</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label (Optional)</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Auto-generated if left blank"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfCables">Number of Cables (Optional)</Label>
              <Input
                id="numberOfCables"
                type="number"
                min="1"
                value={formData.numberOfCables}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfCables: e.target.value }))}
                placeholder="To be determined"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cableType">Cable Type *</Label>
              <ConfigurableSelect
                category="cable_subtypes"
                value={formData.cableType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cableType: value as any }))}
                placeholder="Select cable type"
              />
            </div>
          </div>

          {coordinates && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">Position on Floor {floor}</p>
              <p className="text-muted-foreground">
                X: {coordinates.x.toFixed(1)}% • Y: {coordinates.y.toFixed(1)}%
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Installation notes, special requirements, etc."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-primary hover:bg-primary-hover"
            >
              {isSubmitting ? "Adding..." : "Add Drop Point"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};