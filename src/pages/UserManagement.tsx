import { useState } from "react";
import { Plus, Shield, Users, Mail, Activity, UserCog, CheckSquare, Briefcase, Building2, AlertTriangle, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddUserModal } from "@/components/AddUserModal";
import { RoleManagementModal } from "@/components/RoleManagementModal";
import { EditUserModal } from "@/components/EditUserModal";

import { BulkRoleAssignmentModal } from "@/components/BulkRoleAssignmentModal";
import { AssignOrganizationModal } from "@/components/AssignOrganizationModal";
import { UserActivityLogViewer } from "@/components/UserActivityLogViewer";
import { EmployeeDetailsPanel } from "@/components/EmployeeDetailsPanel";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserManagement = () => {
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");
  const [selectedUserOrgs, setSelectedUserOrgs] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserData, setEditUserData] = useState<{ id: string; email: string | null; fullName: string | null; roles: string[] }>({ id: '', email: null, fullName: null, roles: [] });
  
  const [showBulkRoleModal, setShowBulkRoleModal] = useState(false);
  const [showAssignOrgModal, setShowAssignOrgModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string | null } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  const { userRoles, loading, hasRole, hasAnyRole, fetchAllUserRoles } = useUserRoles();
  const { profiles, loading: profilesLoading, fetchProfiles } = useProfiles();
  const { user } = useAuth();
  const { isSuperAdmin, isGlobalView } = useOrganization();
  const { toast } = useToast();

  const isAdmin = hasRole('admin') || isSuperAdmin;
  const canViewHRData = hasAnyRole(['admin', 'hr_manager']) || isSuperAdmin;

  // Show loading state while roles are being fetched
  if (loading || profilesLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-muted-foreground">
              Checking your permissions
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need admin privileges to access user management.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Get all profiles with their roles and organizations
  const uniqueUsers = profiles.map(profile => {
    const profileRoles = userRoles.filter(ur => ur.user_id === profile.id);
    const earliestRoleDate = profileRoles.length > 0 
      ? profileRoles.reduce((min, r) => r.created_at < min ? r.created_at : min, profileRoles[0].created_at)
      : profile.created_at;
    
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      roles: profileRoles,
      organizations: profile.organizations || [],
      created_at: earliestRoleDate,
      hasNoRoles: profileRoles.length === 0,
      hasNoOrg: (profile.organizations || []).length === 0,
    };
  });

  // Sort: users needing attention first (no roles or no org)
  const sortedUsers = [...uniqueUsers].sort((a, b) => {
    const aScore = (a.hasNoRoles ? 2 : 0) + (a.hasNoOrg ? 1 : 0);
    const bScore = (b.hasNoRoles ? 2 : 0) + (b.hasNoOrg ? 1 : 0);
    return bScore - aScore;
  });

  const filteredUsers = sortedUsers.filter(user =>
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const getSelectedUsersData = () => {
    return filteredUsers.filter(u => selectedUsers.has(u.id)).map(u => ({
      id: u.id,
      email: u.email
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'hr_manager':
        return 'secondary';
      case 'project_manager':
        return 'default';
      case 'technician':
        return 'outline';
      case 'employee':
        return 'default';
      default:
        return 'outline';
    }
  };

  const handleManageRoles = (userId: string, userEmail: string | null) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(userEmail || userId);
    setShowRoleModal(true);
  };

  const handleAssignOrg = (userId: string, userEmail: string | null, orgs: Array<{ id: string; name: string; role: string }>) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(userEmail || userId);
    setSelectedUserOrgs(orgs);
    setShowAssignOrgModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Delete user roles first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userToDelete.id);
      
      // Delete organization memberships
      await supabase
        .from('organization_members')
        .delete()
        .eq('user_id', userToDelete.id);
      
      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);
      
      if (profileError) throw profileError;
      
      toast({
        title: "User Deleted",
        description: `${userToDelete.email || userToDelete.id} has been removed from the system.`,
      });
      
      fetchAllUserRoles();
      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  // Stats
  const employeeCount = userRoles.filter(ur => ur.role === 'employee').length;
  const usersNeedingAttention = uniqueUsers.filter(u => u.hasNoRoles || u.hasNoOrg).length;

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* Super Admin Global View Banner */}
      {isSuperAdmin && isGlobalView && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Super Admin View</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">Viewing all users across all organizations</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users" className="w-full">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage system users, roles, and employee details
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            {canViewHRData && (
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Employee Details
              </TabsTrigger>
            )}
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setShowAddUser(true)}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
            {selectedUsers.size > 0 && (
              <Button 
                variant="secondary"
                onClick={() => setShowBulkRoleModal(true)}
                className="flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                Bulk Assign Roles ({selectedUsers.size})
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{uniqueUsers.length}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold">{usersNeedingAttention}</p>
                    <p className="text-sm text-muted-foreground">Needs Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{userRoles.filter(ur => ur.role === 'admin').length}</p>
                    <p className="text-sm text-muted-foreground">Administrators</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <UserCog className="h-8 w-8 text-secondary" />
                  <div>
                    <p className="text-2xl font-bold">{userRoles.filter(ur => ur.role === 'hr_manager').length}</p>
                    <p className="text-sm text-muted-foreground">HR Managers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{employeeCount}</p>
                    <p className="text-sm text-muted-foreground">Employees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{userRoles.filter(ur => ur.role === 'technician').length}</p>
                    <p className="text-sm text-muted-foreground">Technicians</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>System Users</CardTitle>
                  <CardDescription>
                    Manage user accounts and role assignments
                    {selectedUsers.size > 0 && (
                      <span className="block text-primary text-sm mt-1">
                        {selectedUsers.size} user(s) selected
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="w-72">
                  <Input
                    placeholder="Search by email, name, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={toggleAllUsers}
                        aria-label="Select all users"
                      />
                    </TableHead>
                    <TableHead>Email / User ID</TableHead>
                    <TableHead>Organization(s)</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="space-y-2">
                          <p className="text-muted-foreground">No users found</p>
                          <p className="text-sm text-orange-600">
                            Use the "Add User" button to create users with roles
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className={user.hasNoRoles || user.hasNoOrg ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                            aria-label={`Select ${user.email || user.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex flex-col">
                              {user.email ? (
                                <>
                                  <span className="text-sm font-medium">{user.email}</span>
                                  {user.fullName && (
                                    <span className="text-xs text-muted-foreground">{user.fullName}</span>
                                  )}
                                  <code className="text-xs text-muted-foreground">
                                    {user.id.slice(0, 8)}...
                                  </code>
                                </>
                              ) : (
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {user.id.slice(0, 8)}...
                                </code>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.organizations.length === 0 ? (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                                ⚠️ No organization
                              </Badge>
                            ) : (
                              user.organizations.map((org) => (
                                <Badge key={org.id} variant="outline" className="text-xs">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {org.name}
                                  <span className="ml-1 text-muted-foreground">({org.role})</span>
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                                ⚠️ No roles assigned
                              </Badge>
                            ) : (
                              user.roles.map((userRole) => (
                                <Badge 
                                  key={userRole.id} 
                                  variant={getRoleColor(userRole.role)}
                                  className="text-xs"
                                >
                                  {userRole.role.replace('_', ' ')}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Manage
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleManageRoles(user.id, user.email)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Manage Roles
                              </DropdownMenuItem>
                              {isSuperAdmin && (
                                <DropdownMenuItem onClick={() => handleAssignOrg(user.id, user.email, user.organizations)}>
                                  <Building2 className="h-4 w-4 mr-2" />
                                  Assign to Organization
                                </DropdownMenuItem>
                              )}
                              {isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setUserToDelete({ id: user.id, email: user.email });
                                      setShowDeleteConfirm(true);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {canViewHRData && (
          <TabsContent value="employees" className="space-y-6">
            <EmployeeDetailsPanel />
          </TabsContent>
        )}

        <TabsContent value="activity" className="space-y-6">
          <UserActivityLogViewer />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddUserModal 
        open={showAddUser} 
        onOpenChange={setShowAddUser}
        onUserCreated={() => {
          fetchAllUserRoles();
          fetchProfiles();
        }}
      />
      
      <RoleManagementModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        userId={selectedUserId}
        userEmail={selectedUserEmail}
      />


      <BulkRoleAssignmentModal
        isOpen={showBulkRoleModal}
        onClose={() => {
          setShowBulkRoleModal(false);
          setSelectedUsers(new Set());
        }}
        selectedUsers={getSelectedUsersData()}
      />

      <AssignOrganizationModal
        isOpen={showAssignOrgModal}
        onClose={() => setShowAssignOrgModal(false)}
        userId={selectedUserId}
        userEmail={selectedUserEmail}
        currentOrganizations={selectedUserOrgs}
        onAssigned={() => {
          fetchProfiles();
        }}
      />

      {/* Delete User Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.email || userToDelete?.id}? This will remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Their profile</li>
                <li>All role assignments</li>
                <li>All organization memberships</li>
              </ul>
              <p className="mt-2 font-medium text-destructive">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default UserManagement;
