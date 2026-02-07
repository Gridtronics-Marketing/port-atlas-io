import { useState } from "react";
import { MapPin, Plus, Minus, Building2, Phone, FileText } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/hooks/useAuth";

interface AddServiceLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess?: () => void;
}

export const AddServiceLocationModal = ({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: AddServiceLocationModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { createServiceRequest } = useServiceRequests();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    building_type: "",
    floors: 1,
    access_instructions: "",
    contact_onsite: "",
    contact_phone: "",
    description: "",
    priority: "medium",
  });

  const [coordinates, setCoordinates] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zipCode: "",
      building_type: "",
      floors: 1,
      access_instructions: "",
      contact_onsite: "",
      contact_phone: "",
      description: "",
      priority: "medium",
    });
    setCoordinates({ latitude: null, longitude: null });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.street1.trim() || !formData.city.trim() || !formData.state.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Street Address, City, State).",
        variant: "destructive",
      });
      return;
    }

    if (!currentOrganization?.id || !user?.id) {
      toast({
        title: "Error",
        description: "Unable to submit request. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const addressParts = [
        formData.street1.trim(),
        formData.street2.trim(),
        formData.city.trim(),
        formData.state.trim(),
        formData.zipCode.trim(),
      ].filter(Boolean);
      const fullAddress = addressParts.join(", ");

      // 1. Create the service request
      const serviceRequest = await createServiceRequest({
        title: `Request: New Service Location - ${formData.name}`,
        description: formData.description || `New location request: ${formData.name} at ${fullAddress}`,
        request_type: "new_location",
        priority: formData.priority,
      });

      if (!serviceRequest) throw new Error("Failed to create service request");

      // 2. Create the location_request row
      const { error } = await supabase.from("location_requests").insert({
        service_request_id: serviceRequest.id,
        client_id: clientId,
        organization_id: currentOrganization.id,
        name: formData.name.trim(),
        address: fullAddress,
        building_type: formData.building_type.trim() || null,
        floors: formData.floors,
        access_instructions: formData.access_instructions.trim() || null,
        contact_onsite: formData.contact_onsite.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      if (error) throw error;

      toast({
        title: "Location Request Submitted",
        description: "Your service location request has been submitted for review.",
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting location request:", error);
      toast({
        title: "Error",
        description: "Failed to submit location request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustFloors = (increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      floors: increment ? prev.floors + 1 : Math.max(1, prev.floors - 1),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col bg-card border overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-6 w-6 text-primary" />
            Request New Service Location
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit a request for a new service location. Your provider will review and schedule a walk-through.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-4">
            {/* Location Details */}
            <Card className="shadow-soft border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loc_name">Location Name *</Label>
                  <Input
                    id="loc_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Main Office Building"
                  />
                </div>

                <div className="space-y-2">
                  <AddressAutocomplete
                    label="Street Address *"
                    value={formData.street1}
                    onChange={(value) => setFormData({ ...formData, street1: value })}
                    onAddressSelect={(address) => {
                      setFormData((prev) => ({
                        ...prev,
                        street1: address.street || "",
                        city: address.city || "",
                        state: address.state || "",
                        zipCode: address.zip || "",
                      }));
                      if (address.latitude && address.longitude) {
                        setCoordinates({
                          latitude: address.latitude,
                          longitude: address.longitude,
                        });
                      }
                    }}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loc_street2">Suite / Unit</Label>
                  <Input
                    id="loc_street2"
                    value={formData.street2}
                    onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                    placeholder="Suite, floor, unit"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loc_city">City *</Label>
                    <Input
                      id="loc_city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loc_state">State *</Label>
                    <Input
                      id="loc_state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loc_zip">ZIP Code</Label>
                    <Input
                      id="loc_zip"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loc_type">Building Type</Label>
                    <Select
                      value={formData.building_type}
                      onValueChange={(v) => setFormData({ ...formData, building_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Mixed-Use">Mixed-Use</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Number of Floors</Label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="icon" onClick={() => adjustFloors(false)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold w-12 text-center">{formData.floors}</span>
                    <Button type="button" variant="outline" size="icon" onClick={() => adjustFloors(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Access */}
            <Card className="shadow-soft border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  Onsite Contact & Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loc_contact">Onsite Contact</Label>
                    <Input
                      id="loc_contact"
                      value={formData.contact_onsite}
                      onChange={(e) => setFormData({ ...formData, contact_onsite: e.target.value })}
                      placeholder="Contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loc_phone">Contact Phone</Label>
                    <Input
                      id="loc_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc_access">Access Instructions</Label>
                  <Textarea
                    id="loc_access"
                    value={formData.access_instructions}
                    onChange={(e) => setFormData({ ...formData, access_instructions: e.target.value })}
                    placeholder="e.g. Check in at front desk, parking in rear lot"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card className="shadow-soft border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loc_desc">Additional Notes</Label>
                  <Textarea
                    id="loc_desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe any specifics about this location or the services you need..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
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
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Location Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
