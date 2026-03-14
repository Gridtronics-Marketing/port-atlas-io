import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useUserRoles, type AppRole } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCog, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string | null;
  userFullName: string | null;
  userRolesList: string[];
  onUpdated: () => void;
  canDelete?: boolean;
}

const roleOptions = [
  { value: 'admin', label: 'Administrator', description: 'Full system access and user management' },
  { value: 'project_manager', label: 'Manager', description: 'Project oversight and team coordination' },
  { value: 'employee', label: 'Employee', description: 'Organization member with standard access' },
];

export const EditUserModal = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  userFullName,
  userRolesList,
  onUpdated,
  canDelete = false,
}: EditUserModalProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { assignRole, removeRole } = useUserRoles();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const parts = (userFullName || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(userEmail || '');
      setPhone('');
      // Pick the primary role from the simplified 3-role set
      const primaryRole = userRolesList.find(r => ['admin', 'project_manager', 'employee'].includes(r)) || '';
      setSelectedRole(primaryRole);

      // Fetch phone from employees table
      if (userId) {
        supabase
          .from('employees')
          .select('phone, first_name, last_name')
          .eq('user_id', userId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setPhone(data.phone || '');
              if (data.first_name) setFirstName(data.first_name);
              if (data.last_name) setLastName(data.last_name);
            }
          });
      }
    }
  }, [isOpen, userId, userEmail, userFullName, userRolesList]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const fullName = `${firstName} ${lastName}`.trim();

      // Update profile
      await supabase
        .from('profiles')
        .update({ full_name: fullName || null })
        .eq('id', userId);

      // Update employee record if exists
      await supabase
        .from('employees')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
        })
        .eq('user_id', userId);

      // Handle role change
      if (selectedRole) {
        const currentSimpleRoles = userRolesList.filter(r => ['admin', 'project_manager', 'employee'].includes(r));
        // Remove old roles not matching
        for (const oldRole of currentSimpleRoles) {
          if (oldRole !== selectedRole) {
            await removeRole(userId, oldRole as AppRole);
          }
        }
        // Add new role if not already assigned
        if (!userRolesList.includes(selectedRole)) {
          await assignRole(userId, selectedRole as AppRole);
        }
      }

      toast({ title: 'Success', description: 'User updated successfully' });
      onUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update user', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('organization_members').delete().eq('user_id', userId);

      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;

      toast({ title: 'User Deleted', description: `${userEmail || userId} has been removed.` });
      onUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete user', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Edit User
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
                {roleOptions.map((role) => (
                  <div key={role.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value={role.value} id={`edit-role-${role.value}`} className="mt-0.5" />
                    <Label htmlFor={`edit-role-${role.value}`} className="cursor-pointer flex-1">
                      <div className="font-medium">{role.label}</div>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {canDelete && (
              <>
                <Separator />
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userEmail || userId}? This removes their profile, roles, and organization memberships.
              <p className="mt-2 font-medium text-destructive">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
