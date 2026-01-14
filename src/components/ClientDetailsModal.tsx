import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, User, Mail, Phone, MapPin, Calendar, ExternalLink, Loader2, Edit, Plus, Trash2, Map, Navigation, Users, Globe, Copy, Settings } from "lucide-react";
import { CreateClientPortalModal } from "@/components/CreateClientPortalModal";
import { openNavigation } from "@/lib/navigation-utils";
import { Client } from "@/hooks/useClients";
import { useClientLocations } from "@/hooks/useClientLocations";
import { useLocations } from "@/hooks/useLocations";
import { LocationMap } from "@/components/LocationMap";
import { MultiLocationMap } from "@/components/MultiLocationMap";
import { LocationDetailsModal } from "@/components/LocationDetailsModal";
import { AddLocationModal } from "@/components/AddLocationModal";
import { type Location } from "@/hooks/useLocations";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useNavigate } from "react-router-dom";

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEditClient?: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
  onRefreshClient?: () => void;
}

export const ClientDetailsModal = ({ client, isOpen, onClose, onEditClient, onDeleteClient, onRefreshClient }: ClientDetailsModalProps) => {
  const { locations, loading: locationsLoading, refetch: refetchLocations } = useClientLocations(client?.id);
  const { deleteLocation, updateLocation } = useLocations();
  const { toast } = useToast();
  const { isSuperAdmin, userOrgRole } = useOrganization();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);

  // Check if user can manage portals (super admin, owner, or admin)
  const canManagePortal = isSuperAdmin || userOrgRole === 'owner' || userOrgRole === 'admin';

  const copyPortalUrl = () => {
    if (client?.linked_organization?.slug) {
      const url = `${window.location.origin}/p/${client.linked_organization.slug}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Copied",
        description: "Portal URL copied to clipboard",
      });
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      await deleteLocation(locationId);
      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
      refetchLocations();
      setSelectedLocation(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    }
  };

  const handleEditLocation = async (location: Location) => {
    try {
      await updateLocation(location.id, location);
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
      refetchLocations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    }
  };

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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditMode(!isEditMode)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                {isEditMode ? 'Cancel Edit' : 'Edit'}
              </Button>
            </div>
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

          {/* Client Portal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Client Portal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.linked_organization_id && client.linked_organization ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-success text-success-foreground">
                      Active
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {client.linked_organization.name}
                    </span>
                  </div>

                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-2">Portal URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono truncate">
                        {window.location.origin}/p/{client.linked_organization.slug}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyPortalUrl}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/p/${client.linked_organization!.slug}`, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Portal
                    </Button>
                    {canManagePortal && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPortalModalOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Invite User
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onClose();
                            navigate('/admin/client-portals');
                          }}
                          className="flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Manage Portal
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    No client portal has been created yet.
                  </p>
                  {canManagePortal ? (
                    <Button
                      onClick={() => setIsPortalModalOpen(true)}
                      disabled={!client.contact_email}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Create Portal
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Contact an administrator to set up portal access.
                    </p>
                  )}
                  {canManagePortal && !client.contact_email && (
                    <p className="text-xs text-amber-600 mt-2">
                      Add a contact email to enable portal creation.
                    </p>
                  )}
                </div>
              )}
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Managed Locations
                  {locations.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {locations.length}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      List
                    </Button>
                    <Button
                      variant={viewMode === 'map' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('map')}
                      className="h-8 px-3"
                      disabled={locations.length === 0}
                    >
                      <Map className="h-4 w-4 mr-1" />
                      Map
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddLocationModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Location</span>
                  </Button>
                </div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddLocationModalOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Location
                  </Button>
                </div>
              ) : viewMode === 'map' ? (
                <div className="space-y-4">
                  <MultiLocationMap
                    locations={locations}
                    onLocationClick={(location) => setSelectedLocation(location)}
                    height="h-[500px]"
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    Click on map pins to view location details
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {locations.map((location) => (
                    <div 
                      key={location.id} 
                      className="border rounded-lg p-4 space-y-3 bg-card"
                    >
                      <div className="flex items-start gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedLocation(location)}>
                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-base truncate">{location.name}</h4>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {location.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm line-clamp-1">
                            {location.address}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {location.floors} floor{location.floors !== 1 ? 's' : ''}
                            </span>
                            {location.total_square_feet && (
                              <span>{location.total_square_feet.toLocaleString()} sq ft</span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {location.drop_points_count || 0} drops
                            </span>
                          </div>
                        </div>
                      </div>
                      {(location.latitude && location.longitude) && (
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openNavigation({
                              latitude: location.latitude!,
                              longitude: location.longitude!,
                              address: location.address,
                              name: location.name
                            })}
                            className="flex-1"
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Navigate
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Button - Only show in edit mode */}
          {isEditMode && onDeleteClient && (
            <div className="flex justify-center pt-4">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Client
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
      
      <LocationDetailsModal
        location={selectedLocation}
        open={!!selectedLocation}
        onOpenChange={(open) => !open && setSelectedLocation(null)}
        onEditLocation={handleEditLocation}
        onDeleteLocation={handleDeleteLocation}
        onLocationUpdate={refetchLocations}
      />

      <AddLocationModal
        open={isAddLocationModalOpen}
        onOpenChange={(open) => {
          setIsAddLocationModalOpen(open);
          if (!open) {
            refetchLocations();
          }
        }}
        preSelectedClientId={client.id}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you would like to delete this client?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client "{client.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDeleteClient) {
                  onDeleteClient(client.id);
                  setShowDeleteDialog(false);
                  onClose();
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateClientPortalModal
        open={isPortalModalOpen}
        onOpenChange={setIsPortalModalOpen}
        client={client}
        onSuccess={() => {
          toast({ title: "Success", description: "Portal created and invitation sent!" });
          onRefreshClient?.();
        }}
      />
    </Dialog>
  );
};