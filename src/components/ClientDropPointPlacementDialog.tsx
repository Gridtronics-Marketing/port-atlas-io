import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientDropPointPlacementDialogProps {
  open: boolean;
  onClose: () => void;
  locationId: string;
  floor: number;
  coordinates: { x: number; y: number } | null;
  onSuccess: () => void;
}

export const ClientDropPointPlacementDialog = ({
  open,
  onClose,
  locationId,
  floor,
  coordinates,
  onSuccess,
}: ClientDropPointPlacementDialogProps) => {
  const [label, setLabel] = useState("");
  const [pointType, setPointType] = useState("Data");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { createServiceRequest } = useServiceRequests();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!label.trim() || !coordinates) return;

    setSubmitting(true);
    try {
      // 1. Insert proposed drop point
      const { data: dp, error: dpError } = await supabase
        .from("drop_points")
        .insert({
          location_id: locationId,
          label: label.trim(),
          point_type: pointType,
          status: "Proposed",
          floor,
          x_coordinate: coordinates.x,
          y_coordinate: coordinates.y,
          notes: description || null,
          organization_id: currentOrganization?.id,
        })
        .select("id")
        .single();

      if (dpError) throw dpError;

      // 2. Create service request linked to it
      await createServiceRequest({
        title: `Request: New Drop Point - ${label}`,
        description: `Proposed drop point "${label}" (${pointType}) placed on Floor ${floor}.\n\nCoordinates: (${coordinates.x.toFixed(1)}%, ${coordinates.y.toFixed(1)}%)\n\n${description}`,
        request_type: "new_drop_point",
        priority: "medium",
        location_id: locationId,
        drop_point_id: dp.id,
      });

      toast({
        title: "Drop Point Proposed",
        description: "Your proposed drop point has been submitted for approval.",
      });

      setLabel("");
      setPointType("Data");
      setDescription("");
      onSuccess();
    } catch (error) {
      console.error("Error placing drop point:", error);
      toast({
        title: "Error",
        description: "Failed to place drop point. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place New Drop Point</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will create a proposed drop point (shown in grey) on Floor {floor}. 
            Your service provider will review and approve it.
          </p>
          <div className="space-y-2">
            <Label>Label *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., DP-101"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={pointType} onValueChange={setPointType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Data">Data</SelectItem>
                <SelectItem value="WiFi">WiFi</SelectItem>
                <SelectItem value="Camera">Camera</SelectItem>
                <SelectItem value="Access Control">Access Control</SelectItem>
                <SelectItem value="A/V">A/V</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's needed at this location..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !label.trim()}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
