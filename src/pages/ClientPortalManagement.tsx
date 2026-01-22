import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  Building2, 
  Search, 
  MoreVertical, 
  Users, 
  Trash2, 
  ExternalLink, 
  Loader2,
  Copy,
  RefreshCw,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { ClientPortalUserManager } from '@/components/ClientPortalUserManager';
import { PendingInvitationsManager } from '@/components/PendingInvitationsManager';
import { useClientInvitations } from '@/hooks/useClientInvitations';

interface ClientWithPortal {
  id: string;
  name: string;
  slug: string | null;
  organization_id: string;
  user_count: number;
  created_at: string;
}

const ClientPortalManagement = () => {
  const { isSuperAdmin } = useOrganization();
  const [clients, setClients] = useState<ClientWithPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientWithPortal | null>(null);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('portals');
  
  const { pendingCount, fetchInvitations } = useClientInvitations();

  const fetchClientsWithPortals = async () => {
    setLoading(true);
    try {
      // Fetch all clients that have portal users
      const { data: portalUsers, error: puError } = await supabase
        .from('client_portal_users')
        .select('client_id');

      if (puError) throw puError;

      // Get unique client IDs
      const clientIds = [...new Set(portalUsers?.map(pu => pu.client_id) || [])];
      
      if (clientIds.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      // Fetch client details
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, organization_id, created_at')
        .in('id', clientIds)
        .order('name');

      if (clientsError) throw clientsError;

      // Count users per client
      const userCounts = (portalUsers || []).reduce((acc, pu) => {
        acc[pu.client_id] = (acc[pu.client_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const clientsWithPortals: ClientWithPortal[] = (clientsData || []).map(client => ({
        id: client.id,
        name: client.name,
        slug: client.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        organization_id: client.organization_id,
        user_count: userCounts[client.id] || 0,
        created_at: client.created_at,
      }));

      setClients(clientsWithPortals);
    } catch (err: any) {
      console.error('Error fetching clients with portals:', err);
      toast.error('Failed to load client portals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsWithPortals();
  }, []);

  const handleCopyUrl = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Portal URL copied to clipboard');
  };

  const handleRevokePortalAccess = async () => {
    if (!selectedClient) return;

    setDeleting(true);
    try {
      // Delete all portal users for this client
      const { error } = await supabase
        .from('client_portal_users')
        .delete()
        .eq('client_id', selectedClient.id);

      if (error) throw error;

      toast.success('Portal access revoked successfully');
      setShowDeleteDialog(false);
      setSelectedClient(null);
      fetchClientsWithPortals();
    } catch (err: any) {
      console.error('Error revoking portal access:', err);
      toast.error('Failed to revoke portal access');
    } finally {
      setDeleting(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Only super administrators can manage client portals.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleRefresh = () => {
    fetchClientsWithPortals();
    fetchInvitations();
  };

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Client Portals
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage client portal access and users (no separate organizations)
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="portals" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Clients with Portal Access
            <Badge variant="secondary" className="ml-1">{clients.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invitations
            {pendingCount > 0 && (
              <Badge variant="default" className="ml-1 bg-amber-500 hover:bg-amber-600">{pendingCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portals">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Clients with Portal Access
                  </CardTitle>
                  <CardDescription>
                    {clients.length} client{clients.length !== 1 ? 's' : ''} with portal users
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Client Portals</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No clients match your search.' : 'Invite users from the Clients page to create portal access.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Portal URL</TableHead>
                      <TableHead>Portal Users</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">/p/{client.slug}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {client.user_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(client.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCopyUrl(client.slug || '')}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Portal URL
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/p/${client.slug}`, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Portal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedClient(client);
                                setShowUserManager(true);
                              }}>
                                <Users className="h-4 w-4 mr-2" />
                                Manage Users
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Revoke Portal Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <PendingInvitationsManager />
        </TabsContent>
      </Tabs>

      {/* User Manager Modal - now uses client-based management */}
      {selectedClient && (
        <ClientPortalUserManager
          open={showUserManager}
          onOpenChange={setShowUserManager}
          portal={{ 
            id: selectedClient.id, 
            name: selectedClient.name, 
            slug: selectedClient.slug || '',
            user_count: selectedClient.user_count,
            client_id: selectedClient.id
          }}
          onUpdate={fetchClientsWithPortals}
        />
      )}

      {/* Revoke Access Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Portal Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke portal access for "{selectedClient?.name}"? 
              This will remove all {selectedClient?.user_count} portal user(s) from this client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokePortalAccess}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke Access
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default ClientPortalManagement;