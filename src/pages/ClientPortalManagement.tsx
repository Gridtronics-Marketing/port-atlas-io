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

interface ClientPortal {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  client_name: string | null;
  client_id: string | null;
  user_count: number;
}

const ClientPortalManagement = () => {
  const { isSuperAdmin, currentOrganization } = useOrganization();
  const [portals, setPortals] = useState<ClientPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortal, setSelectedPortal] = useState<ClientPortal | null>(null);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('portals');
  
  const { invitations, loading: invitationsLoading, pendingCount, fetchInvitations } = useClientInvitations();

  const fetchPortals = async () => {
    setLoading(true);
    try {
      // Fetch organizations that are client portals (have parent org in settings)
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          created_at,
          settings
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter to only client portals (those with parent org)
      const clientOrgs = (orgs || []).filter(org => {
        const settings = org.settings as Record<string, unknown> | null;
        return settings?.parentOrganizationId || settings?.isClientPortal;
      });

      // Fetch clients linked to these orgs
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, linked_organization_id')
        .in('linked_organization_id', clientOrgs.map(o => o.id));

      // Fetch user counts per org
      const { data: members } = await supabase
        .from('organization_members')
        .select('organization_id')
        .in('organization_id', clientOrgs.map(o => o.id));

      // Build portal data
      const portalData: ClientPortal[] = clientOrgs.map(org => {
        const client = clients?.find(c => c.linked_organization_id === org.id);
        const userCount = members?.filter(m => m.organization_id === org.id).length || 0;

        return {
          id: org.id,
          name: org.name,
          slug: org.slug || '',
          status: 'active',
          created_at: org.created_at,
          client_name: client?.name || null,
          client_id: client?.id || null,
          user_count: userCount,
        };
      });

      setPortals(portalData);
    } catch (err: any) {
      console.error('Error fetching portals:', err);
      toast.error('Failed to load client portals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  const handleCopyUrl = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Portal URL copied to clipboard');
  };

  const handleDeletePortal = async () => {
    if (!selectedPortal) return;

    setDeleting(true);
    try {
      // Delete organization members first
      await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', selectedPortal.id);

      // Unlink client
      if (selectedPortal.client_id) {
        await supabase
          .from('clients')
          .update({ linked_organization_id: null })
          .eq('id', selectedPortal.client_id);
      }

      // Delete organization
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', selectedPortal.id);

      if (error) throw error;

      toast.success('Portal deleted successfully');
      setShowDeleteDialog(false);
      setSelectedPortal(null);
      fetchPortals();
    } catch (err: any) {
      console.error('Error deleting portal:', err);
      toast.error('Failed to delete portal');
    } finally {
      setDeleting(false);
    }
  };

  const filteredPortals = portals.filter(portal =>
    portal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    portal.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    portal.slug.toLowerCase().includes(searchQuery.toLowerCase())
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
    fetchPortals();
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
            Manage all client portal organizations and their users
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
            Portals
            <Badge variant="secondary" className="ml-1">{portals.length}</Badge>
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
                    All Client Portals
                  </CardTitle>
                  <CardDescription>
                    {portals.length} portal{portals.length !== 1 ? 's' : ''} configured
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search portals..."
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
              ) : filteredPortals.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Client Portals</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No portals match your search.' : 'Create a client portal from the Clients page.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Portal Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>URL Slug</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPortals.map((portal) => (
                      <TableRow key={portal.id}>
                        <TableCell className="font-medium">{portal.name}</TableCell>
                        <TableCell>{portal.client_name || '—'}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">/p/{portal.slug}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {portal.user_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={portal.status === 'active' ? 'default' : 'secondary'}>
                            {portal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(portal.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCopyUrl(portal.slug)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Portal URL
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/p/${portal.slug}`, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Portal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedPortal(portal);
                                setShowUserManager(true);
                              }}>
                                <Users className="h-4 w-4 mr-2" />
                                Manage Users
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedPortal(portal);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Portal
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

      {/* User Manager Modal */}
      {selectedPortal && (
        <ClientPortalUserManager
          open={showUserManager}
          onOpenChange={setShowUserManager}
          portal={selectedPortal}
          onUpdate={fetchPortals}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client Portal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the portal "{selectedPortal?.name}"? 
              This will remove all {selectedPortal?.user_count} user(s) and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePortal}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Portal
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
