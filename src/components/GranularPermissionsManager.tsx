import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Shield, User, Eye, Edit, Trash2, Plus, Settings, Lock, Unlock, Loader2 } from 'lucide-react';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  granted: boolean;
  conditions?: {
    own_only?: boolean;
    location_restricted?: boolean;
    time_restricted?: boolean;
  };
}

interface UserPermission {
  userId: string;
  userName: string;
  userEmail: string;
  roles: AppRole[];
  permissions: Permission[];
  isActive: boolean;
}

interface ComponentPermission {
  component: string;
  label: string;
  description: string;
  permissions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  restrictions: {
    own_only: boolean;
    location_restricted: boolean;
    approval_required: boolean;
  };
}

const DEFAULT_RESOURCES = [
  'backbone_cables',
  'distribution_frames', 
  'drop_points',
  'work_orders',
  'employees',
  'clients',
  'locations',
  'documentation',
  'capacity_alerts',
  'patch_connections',
  'network_devices',
  'vlans'
];

export const GranularPermissionsManager = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'components' | 'roles'>('users');
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [componentPermissions, setComponentPermissions] = useState<ComponentPermission[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const { assignRole, removeRole, hasAnyRole } = useUserRoles();
  const { users, loading: usersLoading } = useUsers();
  const { toast } = useToast();

  useEffect(() => {
    initializeComponentPermissions();
    if (users.length > 0) {
      initializeUserPermissions();
    }
  }, [users]);

  const initializeUserPermissions = () => {
    // Convert real users to UserPermission format
    const userPermissionsData: UserPermission[] = users.map(user => ({
      userId: user.id,
      userName: user.name || user.email.split('@')[0],
      userEmail: user.email,
      roles: user.roles,
      isActive: user.is_active,
      permissions: DEFAULT_RESOURCES.flatMap(resource => 
        ['create', 'read', 'update', 'delete'].map(action => ({
          resource,
          action: action as 'create' | 'read' | 'update' | 'delete',
          granted: getDefaultPermissionForRole(user.roles, resource, action),
          conditions: getDefaultConditionsForRole(user.roles, resource)
        }))
      )
    }));
    setUserPermissions(userPermissionsData);
  };

  const getDefaultPermissionForRole = (roles: AppRole[], resource: string, action: string): boolean => {
    if (roles.includes('admin')) return true;
    if (roles.includes('hr_manager')) return action !== 'delete';
    if (roles.includes('project_manager')) return action !== 'delete';
    if (roles.includes('technician')) return action === 'read' || action === 'update';
    return action === 'read';
  };

  const getDefaultConditionsForRole = (roles: AppRole[], resource: string) => {
    if (roles.includes('admin')) return {};
    if (resource === 'work_orders' && !roles.includes('admin')) return { own_only: true };
    return { location_restricted: true };
  };

  const initializeComponentPermissions = () => {
    const components: ComponentPermission[] = DEFAULT_RESOURCES.map(resource => ({
      component: resource,
      label: resource.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: `Manage ${resource.replace('_', ' ')} operations and data`,
      permissions: { create: true, read: true, update: true, delete: false },
      restrictions: { 
        own_only: resource === 'work_orders' || resource === 'employee_schedules',
        location_restricted: !['employees', 'clients'].includes(resource),
        approval_required: ['backbone_cables', 'distribution_frames'].includes(resource)
      }
    }));
    setComponentPermissions(components);
  };

  const updateUserPermission = async (userId: string, resource: string, action: string, granted: boolean) => {
    // Update local state immediately for better UX
    setUserPermissions(prev => prev.map(user => {
      if (user.userId === userId) {
        return {
          ...user,
          permissions: user.permissions.map(perm => 
            perm.resource === resource && perm.action === action
              ? { ...perm, granted }
              : perm
          )
        };
      }
      return user;
    }));

    // Note: In a full implementation, you would save these granular permissions to a database
    // For now, we'll just show the UI update
    toast({
      title: "Permission Updated",
      description: `${granted ? 'Granted' : 'Revoked'} ${action} access to ${resource}`,
    });
  };

  const updateComponentPermission = (component: string, permissionType: string, value: boolean) => {
    setComponentPermissions(prev => prev.map(comp => {
      if (comp.component === component) {
        if (['create', 'read', 'update', 'delete'].includes(permissionType)) {
          return {
            ...comp,
            permissions: { ...comp.permissions, [permissionType]: value }
          };
        } else {
          return {
            ...comp,
            restrictions: { ...comp.restrictions, [permissionType]: value }
          };
        }
      }
      return comp;
    }));

    toast({
      title: "Component Permission Updated",
      description: `Updated ${permissionType} for ${component}`,
    });
  };

  const getPermissionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4" />;
      case 'read': return <Eye className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'hr_manager': return 'destructive';
      case 'project_manager': return 'default';
      case 'technician': return 'secondary';
      case 'client_admin': return 'outline';
      case 'client_technician': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Granular Permissions Manager</h3>
          <p className="text-sm text-muted-foreground">
            Configure detailed access controls and component-level permissions
          </p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Bulk Operations
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="users">User Permissions</TabsTrigger>
          <TabsTrigger value="components">Component Access</TabsTrigger>
          <TabsTrigger value="roles">Role Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {usersLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <>
              <div className="flex gap-4 items-center">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select user to configure" />
                  </SelectTrigger>
                  <SelectContent>
                    {userPermissions.map(user => (
                      <SelectItem key={user.userId} value={user.userId}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {user.userName} ({user.userEmail})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline">{userPermissions.length} users</Badge>
              </div>

              {selectedUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {userPermissions.find(u => u.userId === selectedUser)?.userName}
                      </div>
                      <div className="flex gap-2">
                        {userPermissions.find(u => u.userId === selectedUser)?.roles.map(role => (
                          <Badge key={role} variant={getRoleColor(role)}>
                            {role.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </CardTitle>
                  </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEFAULT_RESOURCES.map(resource => (
                    <div key={resource} className="space-y-2">
                      <h4 className="font-medium capitalize">{resource.replace('_', ' ')}</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {['create', 'read', 'update', 'delete'].map(action => {
                          const permission = userPermissions
                            .find(u => u.userId === selectedUser)
                            ?.permissions.find(p => p.resource === resource && p.action === action);
                          
                          return (
                            <div key={action} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                {getPermissionIcon(action)}
                                <span className="text-sm capitalize">{action}</span>
                              </div>
                              <Switch
                                checked={permission?.granted || false}
                                onCheckedChange={(checked) => 
                                  updateUserPermission(selectedUser, resource, action, checked)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={selectedComponent} onValueChange={setSelectedComponent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select component to configure" />
              </SelectTrigger>
              <SelectContent>
                {componentPermissions.map(comp => (
                  <SelectItem key={comp.component} value={comp.component}>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {comp.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedComponent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {componentPermissions.find(c => c.component === selectedComponent)?.label}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {componentPermissions.find(c => c.component === selectedComponent)?.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Permissions */}
                <div>
                  <h4 className="font-medium mb-3">Basic Permissions</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(componentPermissions.find(c => c.component === selectedComponent)?.permissions || {}).map(([action, granted]) => (
                      <div key={action} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          {getPermissionIcon(action)}
                          <span className="capitalize">{action}</span>
                        </div>
                        <Switch
                          checked={granted}
                          onCheckedChange={(checked) => 
                            updateComponentPermission(selectedComponent, action, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Access Restrictions */}
                <div>
                  <h4 className="font-medium mb-3">Access Restrictions</h4>
                  <div className="space-y-3">
                    {Object.entries(componentPermissions.find(c => c.component === selectedComponent)?.restrictions || {}).map(([restriction, enabled]) => (
                      <div key={restriction} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          {enabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          <div>
                            <span className="capitalize">{restriction.replace('_', ' ')}</span>
                            <p className="text-xs text-muted-foreground">
                              {restriction === 'own_only' && 'Users can only access their own records'}
                              {restriction === 'location_restricted' && 'Access limited to assigned locations'}
                              {restriction === 'approval_required' && 'Changes require manager approval'}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            updateComponentPermission(selectedComponent, restriction, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Templates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pre-configured permission sets for common user roles
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {['admin', 'project_manager', 'technician', 'viewer'].map(role => (
                  <div key={role} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <h4 className="font-medium capitalize">{role.replace('_', ' ')}</h4>
                      </div>
                      <Badge className={getRoleColor(role)}>
                        {role.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-3">
                      {role === 'admin' && 'Full system access and user management'}
                      {role === 'project_manager' && 'Project oversight and resource management'}
                      {role === 'technician' && 'Field operations and work order execution'}
                      {role === 'viewer' && 'Read-only access to assigned locations'}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {role === 'admin' && (
                        <>
                          <Badge variant="outline">All Resources</Badge>
                          <Badge variant="outline">User Management</Badge>
                          <Badge variant="outline">System Settings</Badge>
                        </>
                      )}
                      {role === 'project_manager' && (
                        <>
                          <Badge variant="outline">Project Management</Badge>
                          <Badge variant="outline">Resource Planning</Badge>
                          <Badge variant="outline">Reporting</Badge>
                        </>
                      )}
                      {role === 'technician' && (
                        <>
                          <Badge variant="outline">Work Orders</Badge>
                          <Badge variant="outline">Drop Points</Badge>
                          <Badge variant="outline">Testing</Badge>
                        </>
                      )}
                      {role === 'viewer' && (
                        <>
                          <Badge variant="outline">Read Only</Badge>
                          <Badge variant="outline">Location Restricted</Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};