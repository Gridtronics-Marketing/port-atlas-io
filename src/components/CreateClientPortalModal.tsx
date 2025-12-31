import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, User, Link, Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  contact_email: string | null;
  contact_name: string | null;
  linked_organization_id: string | null;
}

interface CreateClientPortalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onSuccess?: () => void;
}

export const CreateClientPortalModal = ({
  open,
  onOpenChange,
  client,
  onSuccess
}: CreateClientPortalModalProps) => {
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState(client.name);
  const [inviteEmail, setInviteEmail] = useState(client.contact_email || '');
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | 'viewer'>('admin');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async () => {
    if (!inviteEmail) {
      toast.error('Email address is required');
      return;
    }

    if (!currentOrganization?.id) {
      toast.error('No organization context found');
      return;
    }

    setLoading(true);

    try {
      const response = await supabase.functions.invoke('invite-client-user', {
        body: {
          clientId: client.id,
          clientName: client.name,
          organizationName,
          organizationSlug: generateSlug(organizationName),
          inviteEmail,
          userRole,
          parentOrganizationId: currentOrganization.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create portal');
      }

      const result = response.data;
      
      if (!result.success || result.results[0]?.status === 'failed') {
        throw new Error(result.results[0]?.error || 'Failed to create portal');
      }

      toast.success(`Portal created! Invitation sent to ${inviteEmail}`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating portal:', error);
      toast.error(error.message || 'Failed to create portal');
    } finally {
      setLoading(false);
    }
  };

  const organizationSlug = generateSlug(organizationName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Portal Access
          </DialogTitle>
          <DialogDescription>
            Create an organization and send a login invitation to {client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Card */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">What will be created</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>Organization: <strong>{organizationName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <span>URL: <code className="bg-background px-1 rounded">{organizationSlug}</code></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>Invite sent to: <strong>{inviteEmail || '—'}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Enter organization name"
              />
              <p className="text-xs text-muted-foreground">
                Portal URL: /{organizationSlug}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Invitation Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="pl-10"
                />
              </div>
              {!client.contact_email && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  No contact email on file. Please enter one.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select value={userRole} onValueChange={(v: any) => setUserRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner (Full control)</SelectItem>
                  <SelectItem value="admin">Admin (Manage users & settings)</SelectItem>
                  <SelectItem value="member">Member (Standard access)</SelectItem>
                  <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !inviteEmail}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Create & Send Invitation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
