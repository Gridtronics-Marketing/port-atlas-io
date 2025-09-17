import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRoles, type AppRole } from '@/hooks/useUserRoles';
import { Trash2, Plus, Shield } from 'lucide-react';

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
}

const roleDisplayNames = {
  admin: 'Administrator',
  hr_manager: 'HR Manager',
  project_manager: 'Project Manager',
  technician: 'Technician',
  viewer: 'Viewer',
};

const roleDescriptions = {
  admin: 'Full system access and user management',
  hr_manager: 'Employee data management and HR functions',
  project_manager: 'Project oversight and basic employee info',
  technician: 'Field operations and basic directory access',
  viewer: 'Read-only access to basic information',
};

export const RoleManagementModal = ({ isOpen, onClose, userId, userEmail }: RoleManagementModalProps) => {
  const { userRoles, assignRole, removeRole, hasRole } = useUserRoles();
  const [selectedRole, setSelectedRole] = useState<AppRole>('viewer');
  const [loading, setLoading] = useState(false);

  if (!userId) return null;

  const userCurrentRoles = userRoles.filter(ur => ur.user_id === userId);
  const availableRoles: AppRole[] = ['admin', 'hr_manager', 'project_manager', 'technician', 'viewer'];
  const unassignedRoles = availableRoles.filter(role => 
    !userCurrentRoles.some(ur => ur.role === role)
  );

  const handleAssignRole = async () => {
    setLoading(true);
    try {
      await assignRole(userId, selectedRole);
      setSelectedRole('viewer');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (role: AppRole) => {
    setLoading(true);
    try {
      await removeRole(userId, role);
    } finally {
      setLoading(false);
    }
  };

  const canManageRoles = hasRole('admin') || hasRole('hr_manager');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Management - {userEmail}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Roles */}
          <Card>
            <CardHeader>
              <CardTitle>Current Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {userCurrentRoles.length === 0 ? (
                <p className="text-muted-foreground">No roles assigned</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userCurrentRoles.map((userRole) => (
                    <div key={userRole.id} className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {roleDisplayNames[userRole.role as AppRole]}
                      </Badge>
                      {canManageRoles && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(userRole.role as AppRole)}
                          disabled={loading}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assign New Role */}
          {canManageRoles && unassignedRoles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assign New Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          <div>
                            <div className="font-medium">{roleDisplayNames[role]}</div>
                            <div className="text-sm text-muted-foreground">
                              {roleDescriptions[role]}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignRole} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Role Descriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Available Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableRoles.map((role) => (
                  <div key={role} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge variant="outline">{roleDisplayNames[role]}</Badge>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {roleDescriptions[role]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {!canManageRoles && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                You don't have permission to manage user roles.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};