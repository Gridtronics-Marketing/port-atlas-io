import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Link, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/hooks/useClients';

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
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(client.contact_email || '');
  const [userRole, setUserRole] = useState<'admin' | 'member' | 'viewer'>('admin');

  // Check if client has any portal users
  const [hasPortalUsers, setHasPortalUsers] = useState(false);
  const [checkingPortalUsers, setCheckingPortalUsers] = useState(true);

  useEffect(() => {
    const checkPortalUsers = async () => {
      if (!open || !client.id) return;
      
      setCheckingPortalUsers(true);
      const { data, error } = await supabase
        .from('client_portal_users')
        .select('id')
        .eq('client_id', client.id)
        .limit(1);
      
      setHasPortalUsers(!error && data && data.length > 0);
      setCheckingPortalUsers(false);
    };

    checkPortalUsers();
  }, [open, client.id]);

  // Reset email when modal opens
  useEffect(() => {
    if (open) {
      setInviteEmail(client.contact_email || '');
    }
  }, [open, client]);

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

    const parentOrgId = client.organization_id;
    
    if (!parentOrgId) {
      toast.error('Client has no organization assigned');
      return;
    }

    setLoading(true);

    try {
      const response = await supabase.functions.invoke('invite-client-user', {
        body: {
          clientId: client.id,
          clientName: client.name,
          inviteEmail,
          userRole,
          parentOrganizationId: parentOrgId
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send invitation');
      }

      const result = response.data;
      
      if (!result.success || result.results[0]?.status === 'failed') {
        throw new Error(result.results[0]?.error || 'Failed to send invitation');
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const clientSlug = client.slug || generateSlug(client.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasPortalUsers ? (
              <>
                <UserPlus className="h-5 w-5" />
                Invite User to Portal
              </>
            ) : (
              <>
                <Building2 className="h-5 w-5" />
                Create Portal Access
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasPortalUsers 
              ? `Send a login invitation to join ${client.name}'s portal`
              : `Send a login invitation to ${client.name} - no separate organization will be created`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Card */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {hasPortalUsers ? 'Invitation Details' : 'Portal Access Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>Client: <strong>{client.name}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <span>Portal URL: <code className="bg-background px-1 rounded">/p/{clientSlug}</code></span>
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
                  <SelectItem value="admin">Admin (Manage portal users)</SelectItem>
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
            <Button onClick={handleSubmit} disabled={loading || !inviteEmail || checkingPortalUsers}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};