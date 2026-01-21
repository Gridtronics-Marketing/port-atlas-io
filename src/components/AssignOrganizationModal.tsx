import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganization, OrgRole } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssignOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  currentOrganizations: Array<{ id: string; name: string; role: string }>;
  onAssigned: () => void;
}

const orgRoles: { value: OrgRole; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'technician', label: 'Technician' },
  { value: 'viewer', label: 'Viewer' },
];

export const AssignOrganizationModal: React.FC<AssignOrganizationModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  currentOrganizations,
  onAssigned,
}) => {
  const { organizations } = useOrganization();
  const { toast } = useToast();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<OrgRole>('viewer');
  const [loading, setLoading] = useState(false);

  // Filter out organizations user is already a member of
  const availableOrgs = organizations.filter(
    org => !currentOrganizations.some(co => co.id === org.id)
  );

  const handleAssign = async () => {
    if (!selectedOrgId) {
      toast({
        title: "Error",
        description: "Please select an organization",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: selectedOrgId,
          role: selectedRole,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User assigned to organization successfully",
      });

      onAssigned();
      onClose();
      setSelectedOrgId('');
      setSelectedRole('viewer');
    } catch (error: any) {
      console.error('Error assigning organization:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign organization",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Assign to Organization
          </DialogTitle>
          <DialogDescription>
            Add {userEmail} to an organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentOrganizations.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Current Organizations</Label>
              <div className="flex flex-wrap gap-1">
                {currentOrganizations.map(org => (
                  <span
                    key={org.id}
                    className="text-xs bg-muted px-2 py-1 rounded"
                  >
                    {org.name} ({org.role})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization..." />
              </SelectTrigger>
              <SelectContent>
                {availableOrgs.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    User is already in all organizations
                  </div>
                ) : (
                  availableOrgs.map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role in Organization</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as OrgRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {orgRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={loading || !selectedOrgId || availableOrgs.length === 0}
          >
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};