import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useServiceRequests } from "@/hooks/useServiceRequests";

interface ClientServiceRequestButtonProps {
  locationId: string;
  requestType: "new_drop_point" | "new_room_view" | "new_project";
  buttonLabel: string;
}

const REQUEST_TITLES: Record<string, string> = {
  new_drop_point: "Request: New Drop Point",
  new_room_view: "Request: New Room View",
  new_project: "Request: New Project",
};

export const ClientServiceRequestButton = ({
  locationId,
  requestType,
  buttonLabel,
}: ClientServiceRequestButtonProps) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const { createServiceRequest } = useServiceRequests();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createServiceRequest({
        title: REQUEST_TITLES[requestType],
        description,
        request_type: requestType,
        priority,
        location_id: locationId,
      });
      setOpen(false);
      setDescription("");
      setPriority("medium");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{REQUEST_TITLES[requestType]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what you need..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !description.trim()}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
