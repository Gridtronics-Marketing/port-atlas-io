import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, Search, MoreVertical, Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrphanedOrganizationsCleanup } from '@/components/OrphanedOrganizationsCleanup';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, Organization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OrgWithStats extends Organization {
  member_count?: number;
}

const AdminOrganizations: React.FC = () => {
  const { isSuperAdmin, switchOrganization, refreshOrganizations } = useOrganization();
  const [organizations, setOrganizations] = useState<OrgWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgWithStats | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;

      // Fetch member counts for each org
      const orgsWithStats: OrgWithStats[] = await Promise.all(
        (orgs || []).map(async (org) => {
          const { count } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);
          
          return { ...org, member_count: count || 0 } as OrgWithStats;
        })
      );

      setOrganizations(orgsWithStats);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  // useEffect MUST be before any conditional returns
  useEffect(() => {
    if (isSuperAdmin) {
      fetchOrganizations();
    }
  }, [isSuperAdmin]);

  // Redirect if not super admin - AFTER all hooks
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  };

  const handleCreateOrg = async () => {
    if (!formData.name || !formData.slug) return;

    setIsSubmitting(true);
    try {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', formData.slug)
        .maybeSingle();

      if (existingOrg) {
        toast.error('This slug is already taken');
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          slug: formData.slug,
        });

      if (error) throw error;

      toast.success('Organization created successfully');
      setShowCreateDialog(false);
      setFormData({ name: '', slug: '' });
      fetchOrganizations();
      refreshOrganizations();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOrg = async () => {
    if (!selectedOrg || !formData.name) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: formData.name })
        .eq('id', selectedOrg.id);

      if (error) throw error;

      toast.success('Organization updated successfully');
      setShowEditDialog(false);
      setSelectedOrg(null);
      setFormData({ name: '', slug: '' });
      fetchOrganizations();
      refreshOrganizations();
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast.error(error.message || 'Failed to update organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrg = async (org: OrgWithStats) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', org.id);

      if (error) throw error;

      toast.success('Organization deleted successfully');
      fetchOrganizations();
      refreshOrganizations();
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      toast.error(error.message || 'Failed to delete organization');
    }
  };

  const handleViewOrg = async (org: OrgWithStats) => {
    await switchOrganization(org.id);
    toast.success(`Switched to ${org.name}`);
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Organizations
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all organizations in the platform
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary">
              {organizations.length} organizations
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading organizations...
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No organizations found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {org.member_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.is_active ? 'default' : 'secondary'}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(org.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewOrg(org)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Switch to
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedOrg(org);
                              setFormData({ name: org.name, slug: org.slug });
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteOrg(org)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

      {/* Orphaned Organizations Cleanup Tool */}
      <OrphanedOrganizationsCleanup />

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ 
                  name: e.target.value, 
                  slug: generateSlug(e.target.value) 
                })}
                placeholder="e.g., Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                placeholder="e.g., acme-corp"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrg} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Slug cannot be changed</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditOrg} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrganizations;
