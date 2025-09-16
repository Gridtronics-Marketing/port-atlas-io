import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react";
import { Client } from "@/hooks/useClients";

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientDetailsModal = ({ client, isOpen, onClose }: ClientDetailsModalProps) => {
  if (!client) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "Pending":
        return "bg-warning text-warning-foreground";
      case "Inactive":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Client Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {client.name}
                </span>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Person */}
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Contact Person</p>
                    <p className="text-foreground">
                      {client.contact_name || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground">
                      {client.contact_email || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Phone</p>
                    <p className="text-foreground">
                      {client.contact_phone || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Added</p>
                    <p className="text-foreground">
                      {new Date(client.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground mb-1">Business Address</p>
                <p className="text-foreground">
                  {client.address || "Not specified"}
                </p>
              </div>
              
              {client.billing_address && (
                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-1">Billing Address</p>
                  <p className="text-foreground">
                    {client.billing_address}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Record Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-1">Created</p>
                  <p className="text-foreground">
                    {new Date(client.created_at).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-foreground">
                    {new Date(client.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};