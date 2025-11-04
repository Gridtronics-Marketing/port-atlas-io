import { useState } from "react";
import { Plus, Shield, Users, Mail, Calendar, UserCheck, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddUserModal } from "@/components/AddUserModal";
import { RoleManagementModal } from "@/components/RoleManagementModal";
import { ManualRoleAssignmentModal } from "@/components/ManualRoleAssignmentModal";
import { useUserRoles } from "@/hooks/useUserRoles";
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
  const [searchTerm, setSearchTerm] = useState("");
  
  const { userRoles, loading, hasRole, fetchAllUserRoles } = useUserRoles();
  const { user } = useAuth();

  const isAdmin = hasRole('admin');

  // Show loading state while roles are being fetched
  if (loading) {
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

  const filteredUsers = userRoles.filter(userRole =>
    userRole.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      default:
        return 'outline';
    }
  };

  const handleManageRoles = (userId: string, userEmail: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(userEmail);
    setShowRoleModal(true);
  };

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage system users, roles, and permissions
            </p>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{new Set(userRoles.map(ur => ur.user_id)).size}</p>
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
                <UserCheck className="h-8 w-8 text-secondary" />
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
                <Calendar className="h-8 w-8 text-primary" />
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
                  {userRoles.length === 0 && (
                    <span className="block text-orange-600 text-sm mt-1">
                      ⚠️ No users with roles found. If users exist without roles, use "Add User" to assign roles.
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="w-72">
                <Input
                  placeholder="Search by user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Group users by user_id */}
                  {Array.from(new Set(filteredUsers.map(ur => ur.user_id))).map((userId) => {
                    const userRolesList = filteredUsers.filter(ur => ur.user_id === userId);
                    const createdDate = userRolesList[0]?.created_at;
                    
                    return (
                      <TableRow key={userId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {userId.slice(0, 8)}...
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userRolesList.map((userRole) => (
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
                            {new Date(createdDate).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageRoles(userId, userId)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Manage Roles
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {filteredUsers.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center py-8">
                         <div className="space-y-2">
                           <p className="text-muted-foreground">No users with roles found</p>
                           <p className="text-sm text-orange-600">
                             If there are users without roles in Supabase Auth, they won't appear here.
                             <br />
                             Use the "Add User" button to create users with roles, or manually assign roles to existing users.
                           </p>
                         </div>
                       </TableCell>
                     </TableRow>
                   )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

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
      </main>
  );
};

export default UserManagement;