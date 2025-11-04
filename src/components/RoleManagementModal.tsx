import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  field_photographer: 'Field Photographer',
};

const roleDescriptions = {
  admin: 'Full system access and user management',
  hr_manager: 'Employee data management and HR functions',
  project_manager: 'Project oversight and basic employee info',
  technician: 'Field operations and basic directory access',
  viewer: 'Read-only access to basic information',
  field_photographer: 'Photo capture and upload only',
};

export const RoleManagementModal = ({ isOpen, onClose, userId, userEmail }: RoleManagementModalProps) => {
  const { userRoles, assignRole, removeRole, hasRole, fetchAllUserRoles } = useUserRoles();
  const [selectedRole, setSelectedRole] = useState<AppRole>('viewer');
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(false);

  if (!userId) return null;

  const userCurrentRoles = userRoles.filter(ur => ur.user_id === userId);
  const availableRoles: AppRole[] = ['admin', 'hr_manager', 'project_manager', 'technician', 'viewer', 'field_photographer'];
  const unassignedRoles = availableRoles.filter(role => 
    !userCurrentRoles.some(ur => ur.role === role)
  );

  const handleAssignRole = async () => {
    setLoading(true);
    try {
      await assignRole(userId, selectedRole);
      setSelectedRole('viewer');
      await fetchAllUserRoles();
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMultipleRoles = async () => {
    if (selectedRoles.length === 0) return;
    
    setLoading(true);
    try {
      for (const role of selectedRoles) {
        if (!userCurrentRoles.some(ur => ur.role === role)) {
          await assignRole(userId, role);
        }
      }
      setSelectedRoles([]);
      await fetchAllUserRoles();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (role: AppRole) => {
    setLoading(true);
    try {
      await removeRole(userId, role);
      await fetchAllUserRoles();
    } finally {
      setLoading(false);
    }
  };

  const toggleRoleSelection = (role: AppRole) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const canManageRoles = hasRole('admin') || hasRole('hr_manager');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Assign Single Role</CardTitle>
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
                              <div className="font-medium">{roleDisplayNames[role as keyof typeof roleDisplayNames] || role}</div>
                              <div className="text-sm text-muted-foreground">
                                {roleDescriptions[role as keyof typeof roleDescriptions] || 'No description'}
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

              {/* Batch Assign Multiple Roles */}
              <Card>
                <CardHeader>
                  <CardTitle>Assign Multiple Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {unassignedRoles.map((role) => (
                      <div key={role} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={`role-${role}`}
                          checked={selectedRoles.includes(role)}
                          onCheckedChange={() => toggleRoleSelection(role)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`role-${role}`} className="cursor-pointer">
                            <div className="font-medium">{roleDisplayNames[role as keyof typeof roleDisplayNames] || role}</div>
                            <p className="text-sm text-muted-foreground">
                              {roleDescriptions[role as keyof typeof roleDescriptions] || 'No description'}
                            </p>
                          </Label>
                        </div>
                      </div>
                    ))}
                    {selectedRoles.length > 0 && (
                      <Button onClick={handleAssignMultipleRoles} disabled={loading} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Assign {selectedRoles.length} Role(s)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
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