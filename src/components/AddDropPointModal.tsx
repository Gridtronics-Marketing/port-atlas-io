import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDropPoints } from "@/hooks/useDropPoints";
import { useDistributionFrames } from "@/hooks/useDistributionFrames";
import { useToast } from "@/hooks/use-toast";
import { CableNameFields } from "@/components/CableNameFields";
import { MdfIdfConnectionFields, MdfIdfConnection } from "@/components/MdfIdfConnectionFields";

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
  { value: 'mdf', label: 'MDF' },
  { value: 'idf', label: 'IDF' },
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
    cable_count: '',
    label: '',
    notes: '',
  });
  const [cableNames, setCableNames] = useState<Record<number, string>>({});
  const [mdfConnections, setMdfConnections] = useState<MdfIdfConnection[]>([{ frame_id: "", port: "", notes: "" }]);
  const [cableCountError, setCableCountError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addDropPoint, dropPoints } = useDropPoints(locationId);
  const { frames, loading: framesLoading } = useDistributionFrames(locationId);

  // Get MDF/IDF drop points at this location for the connection dropdown
  const mdfIdfDropPoints = dropPoints
    .filter(dp => ['mdf', 'idf'].includes(dp.point_type as string))
    .map(dp => ({ id: dp.id, label: dp.label, point_type: dp.point_type as string, floor: dp.floor, room: dp.room }));
  const { toast } = useToast();

  const parsedCableCount = formData.cable_count === '' ? 0 : parseInt(formData.cable_count);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cableCount = formData.cable_count === '' ? 0 : parseInt(formData.cable_count);
    if (cableCount < 1) {
      setCableCountError('Number of cables must be at least 1');
      return;
    }
    setCableCountError('');

    setIsSubmitting(true);
    try {
      // Build type_specific_data with cable names and MDF connections
      const typeSpecificData: Record<string, any> = {};

      // Store cable names if more than 1 cable
      if (cableCount > 1) {
        const names: Record<number, string> = {};
        for (let i = 0; i < cableCount; i++) {
          if (cableNames[i]?.trim()) {
            names[i] = cableNames[i].trim();
          }
        }
        if (Object.keys(names).length > 0) {
          typeSpecificData.cable_names = names;
        }
      }

      // Store MDF/IDF connections
      const validConnections = mdfConnections.filter(c => c.frame_id.trim() || c.port.trim());
      if (validConnections.length > 0) {
        typeSpecificData.mdf_idf_connections = validConnections;
      }

      const dropPointData = {
        location_id: locationId,
        point_type: formData.point_type,
        label: formData.label.trim() || null,
        cable_count: cableCount,
        notes: formData.notes.trim() || null,
        floor: floor,
        x_coordinate: coordinates?.x || 50,
        y_coordinate: coordinates?.y || 50,
        status: 'planned',
        type_specific_data: typeSpecificData,
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

      toast({ title: "Success", description: "Drop point added successfully" });

      // Reset form
      setFormData({ point_type: 'data', cable_count: '', label: '', notes: '' });
      setCableNames({});
      setMdfConnections([{ frame_id: "", port: "", notes: "" }]);
      setCableCountError('');
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding drop point:", error);
      toast({ title: "Error", description: "Failed to add drop point", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ point_type: 'data', cable_count: '', label: '', notes: '' });
    setCableNames({});
    setMdfConnections([{ frame_id: "", port: "", notes: "" }]);
    setCableCountError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Drop Point</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="point_type">Type *</Label>
            <Select
              value={formData.point_type}
              onValueChange={(value) => setFormData({ ...formData, point_type: value })}
            >
              <SelectTrigger id="point_type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DROP_POINT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Number of Cables */}
          <div className="space-y-2">
            <Label htmlFor="cable_count">Number of Cables</Label>
            <Input
              id="cable_count"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.cable_count}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d+$/.test(value)) {
                  const num = parseInt(value);
                  if (value === '' || (num >= 0 && num <= 20)) {
                    setFormData({ ...formData, cable_count: value });
                    setCableCountError('');
                  }
                }
              }}
              placeholder="1"
              className={cableCountError ? 'border-destructive' : ''}
            />
            {cableCountError && <p className="text-sm text-destructive">{cableCountError}</p>}
          </div>

          {/* Per-cable name fields when count > 1 */}
          <CableNameFields
            cableCount={parsedCableCount}
            cableNames={cableNames}
            onChange={setCableNames}
          />

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label (Optional)</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., DP-101"
            />
          </div>

          {/* MDF/IDF Connection */}
          <MdfIdfConnectionFields
            connections={mdfConnections}
            onChange={setMdfConnections}
            frames={frames}
            framesLoading={framesLoading}
            currentFloor={floor}
            mdfIdfDropPoints={mdfIdfDropPoints}
          />

          {/* Notes */}
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
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Drop Point"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
