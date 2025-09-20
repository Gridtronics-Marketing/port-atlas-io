import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, User, Mail, Phone, MapPin, Calendar, ExternalLink, Loader2, Edit, Plus } from "lucide-react";
import { Client } from "@/hooks/useClients";
import { useClientLocations } from "@/hooks/useClientLocations";
import { LocationMap } from "@/components/LocationMap";
import { LocationDetailsModal } from "@/components/LocationDetailsModal";
import { useNavigate } from "react-router-dom";
import { type Location } from "@/hooks/useLocations";

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEditClient?: (client: Client) => void;
}

export const ClientDetailsModal = ({ client, isOpen, onClose, onEditClient }: ClientDetailsModalProps) => {
  const navigate = useNavigate();
  const { locations, loading: locationsLoading } = useClientLocations(client?.id);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

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
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Client Details
              </DialogTitle>
              <DialogDescription>
                Complete information for {client.name}
              </DialogDescription>
            </div>
            {onEditClient && (
              <Button
                variant="outline"
                onClick={() => onEditClient(client)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Client
              </Button>
            )}
          </div>
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

          {/* Client Locations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Client Locations
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate('/locations');
                    onClose();
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Location
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {locationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading locations...</span>
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No locations found for this client</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {locations.map((location) => (
                    <div key={location.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{location.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {location.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {location.address}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{location.floors} floor{location.floors !== 1 ? 's' : ''}</span>
                            {location.total_square_feet && (
                              <span>{location.total_square_feet.toLocaleString()} sq ft</span>
                            )}
                            <span>{location.drop_points_count || 0} drop points</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLocation(location)}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                      
                      {/* Location Map */}
                      <LocationMap
                        address={location.address}
                        latitude={location.latitude}
                        longitude={location.longitude}
                        locationName={location.name}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
      
      <LocationDetailsModal
        location={selectedLocation}
        open={!!selectedLocation}
        onOpenChange={(open) => !open && setSelectedLocation(null)}
      />
    </Dialog>
  );
};