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
import { X, Send, Loader2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface DraftDropPoint {
  id: string; // local temp id
  label: string;
  pointType: string;
  description: string;
  floor: number;
  x: number;
  y: number;
}

interface AddPointDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (label: string, pointType: string, description: string) => void;
  floor: number;
}

const AddPointDialog = ({ open, onClose, onAdd, floor }: AddPointDialogProps) => {
  const [label, setLabel] = useState("");
  const [pointType, setPointType] = useState("data");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd(label.trim(), pointType, description);
    setLabel("");
    setPointType("data");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Drop Point to Draft</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This point will be added to your draft on Floor {floor}. You can add more before submitting.
          </p>
          <div className="space-y-2">
            <Label>Label *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g., DP-101" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={pointType} onValueChange={setPointType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="wifi">WiFi</SelectItem>
                <SelectItem value="camera">Camera</SelectItem>
                <SelectItem value="access_control">Access Control</SelectItem>
                <SelectItem value="av">A/V</SelectItem>
                <SelectItem value="speaker">Speaker</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what's needed..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!label.trim()}>Add to Draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface SessionPanelProps {
  drafts: DraftDropPoint[];
  onRemove: (id: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}

const SessionPanel = ({ drafts, onRemove, onSubmit, onCancel, submitting }: SessionPanelProps) => {
  if (drafts.length === 0) return null;

  return (
    <div className="border rounded-lg bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{drafts.length} point{drafts.length !== 1 ? 's' : ''} drafted</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button size="sm" onClick={onSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Submit Proposal
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {drafts.map((dp) => (
          <Badge key={dp.id} variant="secondary" className="flex items-center gap-1 pr-1">
            {dp.label} ({dp.pointType})
            <button
              onClick={() => onRemove(dp.id)}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
              disabled={submitting}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

interface ClientDropPointPlacementSessionProps {
  locationId: string;
  selectedFloor: number;
  active: boolean;
  onEnd: () => void;
  onDataChange: () => void;
  drafts: DraftDropPoint[];
  setDrafts: React.Dispatch<React.SetStateAction<DraftDropPoint[]>>;
  pendingCoords: { x: number; y: number } | null;
  clearPendingCoords: () => void;
}

export const ClientDropPointPlacementSession = ({
  locationId,
  selectedFloor,
  active,
  onEnd,
  onDataChange,
  drafts,
  setDrafts,
  pendingCoords,
  clearPendingCoords,
}: ClientDropPointPlacementSessionProps) => {
  const [submitting, setSubmitting] = useState(false);
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddPoint = (label: string, pointType: string, description: string) => {
    if (!pendingCoords) return;
    setDrafts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label,
        pointType,
        description,
        floor: selectedFloor,
        x: pendingCoords.x,
        y: pendingCoords.y,
      },
    ]);
    clearPendingCoords();
  };

  const handleRemove = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleCancel = () => {
    setDrafts([]);
    clearPendingCoords();
    onEnd();
  };

  const handleSubmit = async () => {
    if (drafts.length === 0 || !currentOrganization?.id || !user?.id) return;
    setSubmitting(true);

    try {
      // 1. Insert all drop points
      const dropPointRows = drafts.map((d) => ({
        location_id: locationId,
        label: d.label,
        point_type: d.pointType,
        status: "proposed",
        floor: d.floor,
        x_coordinate: d.x,
        y_coordinate: d.y,
        notes: d.description || null,
        organization_id: currentOrganization.id,
      }));

      const { data: insertedDps, error: dpError } = await supabase
        .from("drop_points")
        .insert(dropPointRows)
        .select("id, label, point_type, floor");

      if (dpError) throw dpError;

      // 2. Create one service request
      const summary = insertedDps
        .map((dp) => `• ${dp.label} (${dp.point_type}) – Floor ${dp.floor}`)
        .join("\n");

      const { data: sr, error: srError } = await supabase
        .from("service_requests")
        .insert({
          title: `Batch Drop Point Proposal (${insertedDps.length} points)`,
          description: `Proposed drop points:\n${summary}`,
          request_type: "new_drop_points_batch",
          priority: "medium",
          location_id: locationId,
          requesting_organization_id: currentOrganization.id,
          parent_organization_id: currentOrganization.id,
          requested_by: user.id,
        })
        .select("id")
        .single();

      if (srError) throw srError;

      // 3. Link via junction table
      const links = insertedDps.map((dp) => ({
        service_request_id: sr.id,
        drop_point_id: dp.id,
      }));

      const { error: linkError } = await supabase
        .from("service_request_drop_points")
        .insert(links);

      if (linkError) throw linkError;

      // 4. Notify
      try {
        await supabase.functions.invoke("notify-service-request", {
          body: { serviceRequestId: sr.id, eventType: "created" },
        });
      } catch {
        // non-critical
      }

      toast({
        title: "Proposal Submitted",
        description: `${insertedDps.length} drop point(s) submitted as one proposal.`,
      });

      setDrafts([]);
      onEnd();
      onDataChange();
    } catch (error) {
      console.error("Error submitting batch proposal:", error);
      toast({
        title: "Error",
        description: "Failed to submit proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!active) return null;

  return (
    <>
      <SessionPanel
        drafts={drafts}
        onRemove={handleRemove}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting}
      />

      <AddPointDialog
        open={!!pendingCoords}
        onClose={clearPendingCoords}
        onAdd={handleAddPoint}
        floor={selectedFloor}
      />
    </>
  );
};
