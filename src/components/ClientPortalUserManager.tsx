import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Users, 
  MoreVertical, 
  Loader2, 
  Mail, 
  KeyRound, 
  UserMinus, 
  Send 
} from 'lucide-react';
import { toast } from 'sonner';

interface PortalUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
  joined_at: string;
}

interface Portal {
  id: string;
  name: string;
  slug: string;
  user_count: number;
  client_id?: string | null;
}

interface ClientPortalUserManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portal: Portal;
  onUpdate: () => void;
}

export const ClientPortalUserManager = ({
  open,
  onOpenChange,
  portal,
  onUpdate
}: ClientPortalUserManagerProps) => {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Use client_id if available (new model), otherwise fall back to portal.id (old model)
  const clientId = portal.client_id || portal.id;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch client portal users from the new table
      const { data: portalUsers, error } = await supabase
        .from('client_portal_users')
        .select('id, user_id, role, created_at')
        .eq('client_id', clientId);

      if (error) throw error;

      // Get user emails from profiles
      const userIds = portalUsers?.map(m => m.user_id) || [];
      
      if (userIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const userData: PortalUser[] = (portalUsers || []).map(pu => {
        const profile = profiles?.find(p => p.id === pu.user_id);
        return {
          id: pu.id,
          user_id: pu.user_id,
          email: profile?.email || 'Unknown',
          role: pu.role,
          joined_at: pu.created_at,
        };
      });

      setUsers(userData);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, clientId]);

  const handleInviteUser = async () => {
    if (!inviteEmail) return;

    setInviting(true);
    try {
      // Get the client's organization_id for the parent org
      const { data: client } = await supabase
        .from('clients')
        .select('organization_id')
        .eq('id', clientId)
        .single();

      if (!client) {
        throw new Error('Client not found');
      }

      const response = await supabase.functions.invoke('invite-client-user', {
        body: {
          clientId: clientId,
          clientName: portal.name,
          inviteEmail,
          userRole: 'member',
          parentOrganizationId: client.organization_id
        }
      });

      if (response.error) throw response.error;

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      fetchUsers();
      onUpdate();
    } catch (err: any) {
      console.error('Error inviting user:', err);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      // Delete from client_portal_users table
      const { error } = await supabase
        .from('client_portal_users')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('User removed from portal');
      setShowRemoveDialog(false);
      setSelectedUser(null);
      fetchUsers();
      onUpdate();
    } catch (err: any) {
      console.error('Error removing user:', err);
      toast.error('Failed to remove user');
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const response = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId: selectedUser.user_id,
          email: selectedUser.email,
        }
      });

      if (response.error) throw response.error;

      toast.success(`Password reset email sent to ${selectedUser.email}`);
      setShowResetDialog(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      toast.error('Failed to send password reset email');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'member': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Portal Users
            </DialogTitle>
            <DialogDescription>
              Manage users for {portal.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invite User */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter email to invite..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10"
                  type="email"
                />
              </div>
              <Button onClick={handleInviteUser} disabled={inviting || !inviteEmail}>
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Invite
                  </>
                )}
              </Button>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No users in this portal yet.</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.joined_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setShowResetDialog(true);
                              }}>
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowRemoveDialog(true);
                                }}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove User Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUser?.email} from this portal? 
              They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              disabled={processing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Remove User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Send a password reset email to {selectedUser?.email}? 
              They will receive a link to create a new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Send Reset Email'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};