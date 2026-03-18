import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { Loader2, Phone, MapPin, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CreateServiceRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RequestMode = "quick" | "detailed" | null;

export function CreateServiceRequestModal({
  open,
  onOpenChange,
}: CreateServiceRequestModalProps) {
  const { createServiceRequest } = useServiceRequests();
  
  let accessibleLocations: { id: string; name: string }[] = [];
  let locationsLoading = false;
  try {
    const portalData = useClientPortalData();
    accessibleLocations = portalData.accessibleLocations || [];
    locationsLoading = portalData.loading;
  } catch (e) {
    console.error("Failed to load client portal data:", e);
  }

  const [requestMode, setRequestMode] = useState<RequestMode>(null);
  const [loading, setLoading] = useState(false);
  const [quickForm, setQuickForm] = useState({
    title: "",
    description: "",
    priority: "medium",
  });
  const [detailedForm, setDetailedForm] = useState({
    title: "",
    description: "",
    request_type: "service_addition",
    priority: "medium",
    location_id: "",
  });

  const resetAndClose = () => {
    setRequestMode(null);
    setQuickForm({ title: "", description: "", priority: "medium" });
    setDetailedForm({ title: "", description: "", request_type: "service_addition", priority: "medium", location_id: "" });
    onOpenChange(false);
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.description.trim()) return;
    setLoading(true);
    const result = await createServiceRequest({
      title: quickForm.title.trim() || "Callback Request",
      description: quickForm.description,
      request_type: "callback",
      priority: quickForm.priority,
    });
    setLoading(false);
    if (result) resetAndClose();
  };

  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedForm.title.trim()) return;
    setLoading(true);
    const result = await createServiceRequest({
      title: detailedForm.title,
      description: detailedForm.description || undefined,
      request_type: detailedForm.request_type,
      priority: detailedForm.priority,
      location_id: detailedForm.location_id || undefined,
    });
    setLoading(false);
    if (result) resetAndClose();
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setRequestMode(null);
      setQuickForm({ title: "", description: "", priority: "medium" });
      setDetailedForm({ title: "", description: "", request_type: "service_addition", priority: "medium", location_id: "" });
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {/* Mode Selection */}
        {requestMode === null && (
          <>
            <DialogHeader>
              <DialogTitle>New Service Request</DialogTitle>
              <DialogDescription>
                How would you like to submit your request?
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setRequestMode("quick")}
              >
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <Phone className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Quick Request</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Request a callback or send a quick message
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setRequestMode("detailed")}
              >
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <MapPin className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Detailed Request</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select a location and specify exactly what you need
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Quick Request Form */}
        {requestMode === "quick" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRequestMode(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>Quick Request</DialogTitle>
              </div>
              <DialogDescription>
                Send a quick message or request a callback from your service provider.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quick-title">Subject (Optional)</Label>
                <Input
                  id="quick-title"
                  value={quickForm.title}
                  onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                  placeholder='e.g., "Please call me back"'
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-desc">Message *</Label>
                <Textarea
                  id="quick-desc"
                  value={quickForm.description}
                  onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })}
                  placeholder="Describe what you need help with..."
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-priority">Priority</Label>
                <Select value={quickForm.priority} onValueChange={(v) => setQuickForm({ ...quickForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetAndClose}>Cancel</Button>
                <Button type="submit" disabled={loading || !quickForm.description.trim()}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {/* Detailed Request Form */}
        {requestMode === "detailed" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRequestMode(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>Detailed Request</DialogTitle>
              </div>
              <DialogDescription>
                Provide details about your service request including location.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDetailedSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="detail-title">Title *</Label>
                <Input
                  id="detail-title"
                  value={detailedForm.title}
                  onChange={(e) => setDetailedForm({ ...detailedForm, title: e.target.value })}
                  placeholder="Brief description of your request"
                  required
                />
              </div>

              {locationsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading locations...
                </div>
              ) : accessibleLocations.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="detail-location">Location</Label>
                  <Select
                    value={detailedForm.location_id}
                    onValueChange={(v) => setDetailedForm({ ...detailedForm, location_id: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific location</SelectItem>
                      {accessibleLocations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Request Type</Label>
                  <Select
                    value={detailedForm.request_type}
                    onValueChange={(v) => setDetailedForm({ ...detailedForm, request_type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_addition">Service Addition</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="change_request">Change Request</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="new_drop_point">New Drop Point</SelectItem>
                      <SelectItem value="new_room_view">New Room View</SelectItem>
                      <SelectItem value="new_project">New Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={detailedForm.priority}
                    onValueChange={(v) => setDetailedForm({ ...detailedForm, priority: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail-desc">Description</Label>
                <Textarea
                  id="detail-desc"
                  value={detailedForm.description}
                  onChange={(e) => setDetailedForm({ ...detailedForm, description: e.target.value })}
                  placeholder="Provide additional details about your request..."
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetAndClose}>Cancel</Button>
                <Button type="submit" disabled={loading || !detailedForm.title.trim()}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
