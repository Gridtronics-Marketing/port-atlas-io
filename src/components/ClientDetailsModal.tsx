import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, User, Mail, Phone, MapPin, Calendar, ExternalLink, Loader2, Edit, Plus, Trash2, Map, Navigation, Users, Globe, Copy, Save, MoreHorizontal, Tag, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { ConfigurableSelect } from "@/components/ui/configurable-select";
import { CreateClientPortalModal } from "@/components/CreateClientPortalModal";
import { openNavigation } from "@/lib/navigation-utils";
import { Client } from "@/hooks/useClients";
import { useClientLocations } from "@/hooks/useClientLocations";
import { useLocations } from "@/hooks/useLocations";
import { MultiLocationMap } from "@/components/MultiLocationMap";
import { LocationDetailsModal } from "@/components/LocationDetailsModal";
import { AddLocationModal } from "@/components/AddLocationModal";
import { type Location } from "@/hooks/useLocations";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClientContacts, type ClientContact } from "@/hooks/useClientContacts";
import { AddClientContactModal } from "@/components/AddClientContactModal";
import { SendClientEmailModal } from "@/components/SendClientEmailModal";
import { ClientCommunicationLog } from "@/components/ClientCommunicationLog";

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEditClient?: (client: Client) => void;
  onUpdateClient?: (id: string, updates: Partial<Client>) => Promise<any>;
  onDeleteClient?: (clientId: string) => void;
  onRefreshClient?: () => void;
}

export const ClientDetailsModal = ({ client, isOpen, onClose, onEditClient, onUpdateClient, onDeleteClient, onRefreshClient }: ClientDetailsModalProps) => {
  const { locations, loading: locationsLoading, refetch: refetchLocations } = useClientLocations(client?.id);
  const { deleteLocation, updateLocation } = useLocations();
  const { contacts, loading: contactsLoading, addContact, updateContact, deleteContact: deleteClientContact } = useClientContacts(client?.id);
  const { toast } = useToast();
  const { isSuperAdmin, userOrgRole } = useOrganization();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [portalUsersCount, setPortalUsersCount] = useState(0);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    billing_address: string;
    status: 'Active' | 'Inactive' | 'Pending';
  }>({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    billing_address: '',
    status: 'Active',
  });

  useEffect(() => {
    if (client) {
      setEditForm({
        name: client.name || '',
        contact_name: client.contact_name || '',
        contact_email: client.contact_email || '',
        contact_phone: client.contact_phone || '',
        address: client.address || '',
        billing_address: client.billing_address || '',
        status: client.status || 'Active',
      });
    }
  }, [client, isEditMode]);

  useEffect(() => {
    const fetchPortalUsers = async () => {
      if (!client?.id) return;
      const { count } = await supabase
        .from('client_portal_users')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id);
      setPortalUsersCount(count || 0);
    };
    fetchPortalUsers();
  }, [client?.id, isPortalModalOpen]);

  const hasActivePortal = portalUsersCount > 0 || (client?.linked_organization_id && client?.linked_organization);
  const portalSlug = client?.slug || client?.linked_organization?.slug;

  const handleSave = async () => {
    if (!client || !onUpdateClient) return;
    if (!editForm.name.trim()) {
      toast({ title: "Error", description: "Client name is required", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateClient(client.id, editForm);
      setIsEditMode(false);
      onRefreshClient?.();
    } catch (error) {
      // toast handled by hook
    } finally {
      setIsSaving(false);
    }
  };

  const canManagePortal = isSuperAdmin || userOrgRole === 'owner' || userOrgRole === 'admin';

  const copyPortalUrl = () => {
    if (portalSlug) {
      const url = `${window.location.origin}/p/${portalSlug}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Copied", description: "Portal URL copied to clipboard" });
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      await deleteLocation(locationId);
      toast({ title: "Success", description: "Location deleted successfully" });
      refetchLocations();
      setSelectedLocation(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete location", variant: "destructive" });
    }
  };

  const handleEditLocation = async (location: Location) => {
    try {
      await updateLocation(location.id, location);
      toast({ title: "Success", description: "Location updated successfully" });
      refetchLocations();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update location", variant: "destructive" });
    }
  };

  if (!client) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-success text-success-foreground";
      case "Pending": return "bg-warning text-warning-foreground";
      case "Inactive": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none sm:w-[95vw] sm:h-[95vh] sm:max-w-[95vw] sm:max-h-[95vh] overflow-y-auto sm:rounded-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{client.name}</DialogTitle>
          <DialogDescription>Client details for {client.name}</DialogDescription>
        </DialogHeader>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              {isEditMode ? (
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="text-xl font-semibold h-8 max-w-xs"
                />
              ) : (
                <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
              )}
              {isEditMode ? (
                <ConfigurableSelect
                  category="client_statuses"
                  value={editForm.status}
                  onValueChange={(v) => setEditForm(f => ({ ...f, status: v as 'Active' | 'Inactive' | 'Pending' }))}
                  placeholder="Status"
                />
              ) : (
                <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            )}
            {client.contact_email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${client.contact_email}`}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsEditMode(!isEditMode)}>
              <Edit className="h-4 w-4 mr-1" />
              {isEditMode ? 'Cancel' : 'Edit'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border">
                {onDeleteClient && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Client
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column — Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Properties Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Properties
                  {locations.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">{locations.length}</Badge>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {locations.length > 0 && (
                    <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="h-7 px-2 text-xs"
                      >
                        List
                      </Button>
                      <Button
                        variant={viewMode === 'map' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('map')}
                        className="h-7 px-2 text-xs"
                      >
                        Map
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddLocationModalOpen(true)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Property
                  </Button>
                </div>
              </div>

              {locationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading properties…</span>
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <MapPin className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">No properties yet</p>
                  <Button variant="outline" size="sm" onClick={() => setIsAddLocationModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Property
                  </Button>
                </div>
              ) : viewMode === 'map' ? (
                <div className="space-y-2">
                  <MultiLocationMap
                    locations={locations}
                    onLocationClick={(location) => setSelectedLocation(location)}
                    height="h-[400px]"
                  />
                  <p className="text-xs text-muted-foreground text-center">Click pins to view details</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Floors</TableHead>
                        <TableHead>Drops</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations.map((location) => (
                        <TableRow
                          key={location.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedLocation(location)}
                        >
                          <TableCell className="font-medium">{location.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {location.address || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{location.floors}</TableCell>
                          <TableCell className="text-muted-foreground">{location.drop_points_count || 0}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{location.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Contacts Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Contacts
                  {contacts.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">{contacts.length}</Badge>
                  )}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingContact(null); setIsContactModalOpen(true); }}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Contact
                </Button>
              </div>

              {contactsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : contacts.length === 0 && !client.contact_name ? (
                <div className="text-center py-6 border border-dashed border-border rounded-lg">
                  <User className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No contacts added yet</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="w-[50px]">Edit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">{contact.name}</TableCell>
                          <TableCell className="text-muted-foreground">{contact.phone || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{contact.email || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{contact.role || "—"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => { setEditingContact(contact); setIsContactModalOpen(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Show legacy contact if no contacts in new table */}
                      {contacts.length === 0 && client.contact_name && (
                        <TableRow>
                          <TableCell className="font-medium">{client.contact_name}</TableCell>
                          <TableCell className="text-muted-foreground">{client.contact_phone || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{client.contact_email || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">—</TableCell>
                          <TableCell>—</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Overview Placeholder */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Active Work", count: 0 },
                  { label: "Requests", count: 0 },
                  { label: "Quotes", count: 0 },
                  { label: "Invoices", count: 0 },
                ].map((item) => (
                  <div key={item.label} className="border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column — Sidebar */}
          <div className="lg:col-span-2 space-y-5">
            {/* Contact Info Card */}
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {isEditMode ? (
                  <>
                    <AddressAutocomplete
                      label="Business Address"
                      value={editForm.address}
                      onChange={(v) => setEditForm(f => ({ ...f, address: v }))}
                      placeholder="Start typing an address..."
                    />
                    <AddressAutocomplete
                      label="Billing Address"
                      value={editForm.billing_address}
                      onChange={(v) => setEditForm(f => ({ ...f, billing_address: v }))}
                      placeholder="Start typing an address..."
                    />
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Business Address</p>
                      <p className="text-foreground">{client.address || "Not specified"}</p>
                    </div>
                    {client.billing_address && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Billing Address</p>
                        <p className="text-foreground">{client.billing_address}</p>
                      </div>
                    )}
                    {client.contact_email && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Email</p>
                        <a href={`mailto:${client.contact_email}`} className="text-primary hover:underline">{client.contact_email}</a>
                      </div>
                    )}
                    {client.contact_phone && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Phone</p>
                        <a href={`tel:${client.contact_phone}`} className="text-primary hover:underline">{client.contact_phone}</a>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Created</p>
                      <p className="text-foreground">{new Date(client.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Last Updated</p>
                      <p className="text-foreground">{new Date(client.updated_at).toLocaleDateString()}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tags Placeholder */}
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  Tags
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" disabled>
                    <Plus className="h-3 w-3 mr-1" />
                    New Tag
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  No tags
                </div>
              </CardContent>
            </Card>

            {/* Client Portal Card */}
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Client Portal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasActivePortal && portalSlug ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-success text-success-foreground text-xs">Active</Badge>
                      <span className="text-xs text-muted-foreground">
                        {portalUsersCount} user{portalUsersCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <code className="flex-1 bg-muted px-2 py-1 rounded text-xs font-mono truncate">
                        /p/{portalSlug}
                      </code>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyPortalUrl}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs h-7 flex-1" onClick={() => window.open(`/p/${portalSlug}`, '_blank')}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                      {canManagePortal && (
                        <Button variant="outline" size="sm" className="text-xs h-7 flex-1" onClick={() => setIsPortalModalOpen(true)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Invite
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-xs text-muted-foreground mb-2">No portal created yet</p>
                    {canManagePortal ? (
                      <Button size="sm" className="text-xs h-7" onClick={() => setIsPortalModalOpen(true)} disabled={!client.contact_email}>
                        <Users className="h-3 w-3 mr-1" />
                        Create Portal
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">Contact an admin to set up access.</p>
                    )}
                    {canManagePortal && !client.contact_email && (
                      <p className="text-xs text-warning mt-1">Add an email first.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
          if (!open) refetchLocations();
        }}
        preSelectedClientId={client.id}
      />

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

      <AddClientContactModal
        isOpen={isContactModalOpen}
        onClose={() => { setIsContactModalOpen(false); setEditingContact(null); }}
        onSave={async (data) => {
          if (editingContact) {
            await updateContact(editingContact.id, data);
          } else {
            await addContact(data);
          }
        }}
        existingContact={editingContact}
      />
    </Dialog>
  );
};
