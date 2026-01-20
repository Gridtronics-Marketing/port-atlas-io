import { useState } from "react";
import { Plus, Shield, Users, Mail, Activity, UserCog, CheckSquare, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddUserModal } from "@/components/AddUserModal";
import { RoleManagementModal } from "@/components/RoleManagementModal";
import { ManualRoleAssignmentModal } from "@/components/ManualRoleAssignmentModal";
import { BulkRoleAssignmentModal } from "@/components/BulkRoleAssignmentModal";
import { UserActivityLogViewer } from "@/components/UserActivityLogViewer";
import { EmployeeDetailsPanel } from "@/components/EmployeeDetailsPanel";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const UserManagement = () => {
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showManualRoleModal, setShowManualRoleModal] = useState(false);
  const [showBulkRoleModal, setShowBulkRoleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  const { userRoles, loading, hasRole, hasAnyRole, fetchAllUserRoles } = useUserRoles();
  const { profiles, loading: profilesLoading, getProfileByUserId } = useProfiles();
  const { user } = useAuth();

  const isAdmin = hasRole('admin');
  const canViewHRData = hasAnyRole(['admin', 'hr_manager']);

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

  // Get unique user IDs with their profiles
  const uniqueUsers = Array.from(new Set(userRoles.map(ur => ur.user_id))).map(userId => {
    const profile = getProfileByUserId?.(userId);
    return {
      id: userId,
      email: profile?.email || null,
      roles: userRoles.filter(ur => ur.user_id === userId),
      created_at: userRoles.find(ur => ur.user_id === userId)?.created_at || ''
    };
  });

  const filteredUsers = uniqueUsers.filter(user =>
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
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

  // Stats
  const employeeCount = userRoles.filter(ur => ur.role === 'employee').length;

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
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
              variant="outline"
              onClick={() => setShowManualRoleModal(true)}
              className="flex items-center gap-2"
            >
              <UserCog className="h-4 w-4" />
              Assign Role to Existing User
            </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    placeholder="Search by email or ID..."
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
                    <TableHead>Roles</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
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
                      <TableRow key={user.id}>
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
                            {user.roles.map((userRole) => (
                              <Badge 
                                key={userRole.id} 
                                variant={getRoleColor(userRole.role)}
                                className="text-xs"
                              >
                                {userRole.role.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageRoles(user.id, user.email)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Manage Roles
                          </Button>
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
        onUserCreated={fetchAllUserRoles}
      />
      
      <RoleManagementModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        userId={selectedUserId}
        userEmail={selectedUserEmail}
      />

      <ManualRoleAssignmentModal
        open={showManualRoleModal}
        onOpenChange={setShowManualRoleModal}
        onRoleAssigned={fetchAllUserRoles}
      />

      <BulkRoleAssignmentModal
        isOpen={showBulkRoleModal}
        onClose={() => {
          setShowBulkRoleModal(false);
          setSelectedUsers(new Set());
        }}
        selectedUsers={getSelectedUsersData()}
      />
    </main>
  );
};

export default UserManagement;
