import { useState } from "react";
import { Wrench, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useServiceRequests, type ServiceRequest } from "@/hooks/useServiceRequests";
import { useEmployees } from "@/hooks/useEmployees";
import { useProjects } from "@/hooks/useProjects";

interface ConvertToWorkOrderModalProps {
  serviceRequest: ServiceRequest | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConvertToWorkOrderModal = ({
  serviceRequest,
  open,
  onClose,
  onSuccess,
}: ConvertToWorkOrderModalProps) => {
  const { toast } = useToast();
  const { addWorkOrder } = useWorkOrders();
  const { updateServiceRequest } = useServiceRequests();
  const { employees } = useEmployees();
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    work_type: "installation",
    assigned_to: "",
    project_id: "",
  });

  // Initialize form when service request changes
  useState(() => {
    if (serviceRequest) {
      setFormData({
        title: serviceRequest.title,
        description: `Service Request: ${serviceRequest.description || ""}\n\nRequested by: ${serviceRequest.requesting_organization?.name || "Client"}`,
        priority: mapPriority(serviceRequest.priority),
        work_type: mapRequestType(serviceRequest.request_type),
        assigned_to: "",
      });
    }
  });

  const mapPriority = (priority: string): string => {
    switch (priority) {
      case "urgent":
        return "urgent";
      case "high":
        return "high";
      case "medium":
        return "medium";
      case "low":
        return "low";
      default:
        return "medium";
    }
  };

  const mapRequestType = (requestType: string): string => {
    switch (requestType) {
      case "new_installation":
        return "installation";
      case "modification":
        return "modification";
      case "repair":
        return "repair";
      case "removal":
        return "removal";
      default:
        return "service";
    }
  };

  const handleSubmit = async () => {
    if (!serviceRequest) return;

    setLoading(true);
    try {
      // Create the work order
      const workOrder = await addWorkOrder({
        title: formData.title,
        description: formData.description,
        location_id: serviceRequest.location_id,
        priority: formData.priority,
        work_type: formData.work_type,
        status: "pending",
        assigned_to: formData.assigned_to || undefined,
      });

      if (workOrder) {
        // Link work order to service request and update status
        await updateServiceRequest(serviceRequest.id, {
          work_order_id: workOrder.id,
          status: "in_progress",
        });

        toast({
          title: "Work Order Created",
          description: `Work order "${formData.title}" has been created and linked to the service request.`,
        });

        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error creating work order:", error);
      toast({
        title: "Error",
        description: "Failed to create work order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!serviceRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Convert to Work Order
          </DialogTitle>
          <DialogDescription>
            Create a work order from this approved service request. The work order will be
            automatically linked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Work Order Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter work order title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v })}
              >
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

            <div className="space-y-2">
              <Label>Work Type</Label>
              <Select
                value={formData.work_type}
                onValueChange={(v) => setFormData({ ...formData, work_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="modification">Modification</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="removal">Removal</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign To (Optional)</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {employees
                  .filter((e) => e.status === "Active")
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {serviceRequest.location && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{serviceRequest.location.name}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.title}>
            {loading ? (
              "Creating..."
            ) : (
              <>
                Create Work Order
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
