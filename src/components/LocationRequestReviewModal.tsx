import { useState } from "react";
import {
  MapPin,
  Building2,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

interface LocationRequest {
  id: string;
  service_request_id: string | null;
  client_id: string;
  organization_id: string;
  name: string;
  address: string;
  building_type: string | null;
  floors: number | null;
  access_instructions: string | null;
  contact_onsite: string | null;
  contact_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
}

interface LocationRequestReviewModalProps {
  open: boolean;
  onClose: () => void;
  locationRequest: LocationRequest | null;
  serviceRequestId: string;
  onSuccess: () => void;
}

export const LocationRequestReviewModal = ({
  open,
  onClose,
  locationRequest,
  serviceRequestId,
  onSuccess,
}: LocationRequestReviewModalProps) => {
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  if (!locationRequest) return null;

  const handleApprove = async () => {
    if (!currentOrganization?.id) return;

    try {
      setProcessing(true);

      // 1. Create the real location
      const { data: newLocation, error: locError } = await supabase
        .from("locations")
        .insert({
          name: locationRequest.name,
          address: locationRequest.address,
          building_type: locationRequest.building_type,
          floors: locationRequest.floors || 1,
          access_instructions: locationRequest.access_instructions,
          contact_onsite: locationRequest.contact_onsite,
          contact_phone: locationRequest.contact_phone,
          latitude: locationRequest.latitude,
          longitude: locationRequest.longitude,
          organization_id: currentOrganization.id,
          client_id: locationRequest.client_id,
          status: "Pending",
          completion_percentage: 0,
        })
        .select()
        .single();

      if (locError) throw locError;

      // 2. Create location access grant for the client
      const { error: grantError } = await supabase
        .from("location_access_grants")
        .insert({
          location_id: newLocation.id,
          granted_client_id: locationRequest.client_id,
          granted_by: (await supabase.auth.getUser()).data.user?.id,
          access_level: "view",
          organization_id: currentOrganization.id,
        });

      if (grantError) throw grantError;

      // 3. Update location_request status
      const { error: reqError } = await supabase
        .from("location_requests")
        .update({ status: "approved" })
        .eq("id", locationRequest.id);

      if (reqError) throw reqError;

      // 4. Update service request status
      const { error: srError } = await supabase
        .from("service_requests")
        .update({
          status: "approved",
          review_notes: reviewNotes || "Location approved and created.",
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", serviceRequestId);

      if (srError) throw srError;

      toast({
        title: "Location Approved",
        description: `"${locationRequest.name}" has been created and assigned to the client.`,
      });

      setReviewNotes("");
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error approving location request:", error);
      toast({
        title: "Error",
        description: "Failed to approve location request.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);

      const { error: reqError } = await supabase
        .from("location_requests")
        .update({ status: "rejected" })
        .eq("id", locationRequest.id);

      if (reqError) throw reqError;

      const { error: srError } = await supabase
        .from("service_requests")
        .update({
          status: "rejected",
          review_notes: reviewNotes || "Location request rejected.",
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", serviceRequestId);

      if (srError) throw srError;

      toast({
        title: "Request Rejected",
        description: "The location request has been rejected.",
      });

      setReviewNotes("");
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error rejecting location request:", error);
      toast({
        title: "Error",
        description: "Failed to reject location request.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Review Location Request
          </DialogTitle>
          <DialogDescription>
            Review the submitted location details and approve or reject.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Location Details Card */}
          <Card className="border">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-lg">{locationRequest.name}</span>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{locationRequest.address}</span>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                {locationRequest.building_type && (
                  <div>
                    <span className="text-muted-foreground">Building Type</span>
                    <p className="font-medium">{locationRequest.building_type}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Floors
                  </span>
                  <p className="font-medium">{locationRequest.floors || 1}</p>
                </div>
              </div>

              {(locationRequest.contact_onsite || locationRequest.contact_phone) && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {[locationRequest.contact_onsite, locationRequest.contact_phone]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                  </div>
                </>
              )}

              {locationRequest.access_instructions && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <FileText className="h-3 w-3" /> Access Instructions
                    </span>
                    <p>{locationRequest.access_instructions}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Review Notes */}
          <div className="space-y-2">
            <Label htmlFor="review-notes">Review Notes</Label>
            <Textarea
              id="review-notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about your decision..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={processing}>
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button onClick={handleApprove} disabled={processing}>
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve & Create Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
