import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, RefreshCw, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OrphanedOrg {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  settings: any;
  parent_org_name?: string;
}

export const OrphanedOrganizationsCleanup: React.FC = () => {
  const [orphanedOrgs, setOrphanedOrgs] = useState<OrphanedOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrphanedOrgs = async () => {
    try {
      setLoading(true);
      
      // Get all organizations that have parentOrganizationId in settings (client portals)
      const { data: allOrgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, slug, created_at, settings')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Get all clients with linked organizations
      const { data: linkedClients, error: clientsError } = await supabase
        .from('clients')
        .select('linked_organization_id')
        .not('linked_organization_id', 'is', null);

      if (clientsError) throw clientsError;

      const linkedOrgIds = new Set(linkedClients?.map(c => c.linked_organization_id) || []);

      // Filter to find orphaned client portal organizations
      const orphaned: OrphanedOrg[] = [];
      
      for (const org of allOrgs || []) {
        const settings = org.settings as any;
        
        // Only consider orgs that are client portals (have parentOrganizationId)
        if (settings?.parentOrganizationId && !linkedOrgIds.has(org.id)) {
          // Fetch parent org name for context
          const { data: parentOrg } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', settings.parentOrganizationId)
            .single();

          orphaned.push({
            ...org,
            parent_org_name: parentOrg?.name || 'Unknown'
          });
        }
      }

      setOrphanedOrgs(orphaned);
      setSelectedIds(new Set());
    } catch (error: any) {
      console.error('Error fetching orphaned organizations:', error);
      toast.error('Failed to load orphaned organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrphanedOrgs();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(orphanedOrgs.map(org => org.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (orgId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(orgId);
    } else {
      newSelected.delete(orgId);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      
      // Delete organization members first
      const { error: membersError } = await supabase
        .from('organization_members')
        .delete()
        .in('organization_id', idsToDelete);

      if (membersError) {
        console.error('Error deleting members:', membersError);
      }

      // Delete the organizations
      const { error } = await supabase
        .from('organizations')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      toast.success(`Deleted ${idsToDelete.length} orphaned organization(s)`);
      fetchOrphanedOrgs();
    } catch (error: any) {
      console.error('Error deleting organizations:', error);
      toast.error(error.message || 'Failed to delete organizations');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteOne = async (org: OrphanedOrg) => {
    try {
      // Delete organization members first
      await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', org.id);

      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', org.id);

      if (error) throw error;

      toast.success(`Deleted "${org.name}"`);
      fetchOrphanedOrgs();
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      toast.error(error.message || 'Failed to delete organization');
    }
  };

  return (
    <Card className="border-muted-foreground/30 bg-muted/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Orphaned Client Portal Organizations</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrphanedOrgs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {selectedIds.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedIds.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Orphaned Organizations?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedIds.size} orphaned organization(s) and all associated data. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <CardDescription>
          These organizations were created as client portals but are not linked to any client. 
          They may be from failed portal creation attempts and can be safely deleted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Scanning for orphaned organizations...
          </div>
        ) : orphanedOrgs.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <p>No orphaned organizations found. Everything is clean!</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedIds.size === orphanedOrgs.length && orphanedOrgs.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent Organization</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orphanedOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(org.id)}
                      onCheckedChange={(checked) => handleSelectOne(org.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.parent_org_name}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(org.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{org.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this orphaned organization and all associated data. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteOne(org)} 
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {orphanedOrgs.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            Found {orphanedOrgs.length} orphaned organization(s)
          </p>
        )}
      </CardContent>
    </Card>
  );
};
