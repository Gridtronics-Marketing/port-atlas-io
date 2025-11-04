import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUserRoles, type AppRole } from '@/hooks/useUserRoles';
import { Loader2, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkRoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: Array<{ id: string; email: string | null }>;
}

const roleOptions = [
  { value: 'admin' as AppRole, label: 'Administrator', description: 'Full system access' },
  { value: 'hr_manager' as AppRole, label: 'HR Manager', description: 'Employee management' },
  { value: 'project_manager' as AppRole, label: 'Project Manager', description: 'Project oversight' },
  { value: 'technician' as AppRole, label: 'Technician', description: 'Field operations' },
  { value: 'viewer' as AppRole, label: 'Viewer', description: 'Read-only access' },
  { value: 'field_photographer' as AppRole, label: 'Field Photographer', description: 'Photo capture only' },
];

export const BulkRoleAssignmentModal = ({ isOpen, onClose, selectedUsers }: BulkRoleAssignmentModalProps) => {
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(false);
  const { assignRole, fetchAllUserRoles } = useUserRoles();
  const { toast } = useToast();

  const toggleRole = (role: AppRole) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleBulkAssign = async () => {
    if (selectedRoles.length === 0) {
      toast({
        title: "No roles selected",
        description: "Please select at least one role to assign",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const user of selectedUsers) {
        for (const role of selectedRoles) {
          try {
            await assignRole(user.id, role);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`Error assigning ${role} to ${user.id}:`, error);
          }
        }
      }

      await fetchAllUserRoles();

      toast({
        title: "Bulk assignment complete",
        description: `Successfully assigned ${successCount} role(s). ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

      setSelectedRoles([]);
      onClose();
    } catch (error) {
      console.error('Bulk assignment error:', error);
      toast({
        title: "Error",
        description: "Failed to complete bulk role assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Bulk Role Assignment
          </DialogTitle>
          <DialogDescription>
            Assign roles to {selectedUsers.length} selected user(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Users */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Selected Users ({selectedUsers.length})
            </h3>
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
              {selectedUsers.map(user => (
                <Badge key={user.id} variant="secondary">
                  {user.email || user.id.slice(0, 8)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <h3 className="text-sm font-medium mb-3">Select Roles to Assign</h3>
            <div className="space-y-3">
              {roleOptions.map(role => (
                <div key={role.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`bulk-${role.value}`}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`bulk-${role.value}`} className="cursor-pointer">
                      <div className="font-medium">{role.label}</div>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedRoles.length > 0 && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm">
                This will assign <strong>{selectedRoles.length}</strong> role(s) to{' '}
                <strong>{selectedUsers.length}</strong> user(s), creating a total of{' '}
                <strong>{selectedRoles.length * selectedUsers.length}</strong> role assignment(s).
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssign} disabled={loading || selectedRoles.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign to ${selectedUsers.length} User(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
