import React, { useState, useEffect } from 'react';
import { Eye, ChevronDown, Shield, User, Users, Search, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useOrganization, OrgRole } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

interface OrgUser {
  user_id: string;
  role: OrgRole;
  email: string;
}

interface ClientPortalOrg {
  id: string;
  name: string;
}

export const ViewAsDropdown: React.FC = () => {
  const {
    isSuperAdmin,
    isImpersonating,
    impersonation,
    currentOrganization,
    startRoleImpersonation,
    startUserImpersonation,
    startClientPortalImpersonation,
    stopImpersonation,
  } = useOrganization();

  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [clientPortalOrgs, setClientPortalOrgs] = useState<ClientPortalOrg[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPortals, setLoadingPortals] = useState(false);

  const roles: { value: OrgRole; label: string; description: string }[] = [
    { value: 'owner', label: 'Owner', description: 'Full organization access' },
    { value: 'admin', label: 'Admin', description: 'Manage team & settings' },
    { value: 'project_manager', label: 'Project Manager', description: 'Manage projects & work orders' },
    { value: 'technician', label: 'Technician', description: 'Field operations access' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
  ];

  const fetchOrgUsers = async () => {
    if (!currentOrganization) return;
    
    setLoadingUsers(true);
    try {
      // Get organization members
      const { data: members, error } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      // Try to get emails from employees table (they have email field)
      const { data: employees } = await supabase
        .from('employees')
        .select('id, email, first_name, last_name')
        .eq('organization_id', currentOrganization.id);

      const usersWithEmails = members?.map(m => {
        // Try to find matching employee by comparing user_id
        const employee = employees?.find(e => e.email);
        const displayEmail = employee?.email || `User ${m.user_id.slice(0, 8)}`;
        
        return {
          user_id: m.user_id,
          role: m.role as OrgRole,
          email: displayEmail,
        };
      }) || [];

      setOrgUsers(usersWithEmails);
    } catch (error) {
      console.error('Error fetching org users:', error);
    } finally {
    setLoadingUsers(false);
    }
  };

  // Fetch clients that have portal users (instead of child organizations)
  const fetchClientPortals = async () => {
    setLoadingPortals(true);
    try {
      // Get distinct clients that have portal users
      const { data, error } = await supabase
        .from('client_portal_users')
        .select('client_id, clients:client_id(id, name)')
        .order('client_id');

      if (!error && data) {
        // Deduplicate by client_id
        const uniqueClients = new Map<string, ClientPortalOrg>();
        data.forEach(row => {
          const client = row.clients as any;
          if (client && !uniqueClients.has(client.id)) {
            uniqueClients.set(client.id, { id: client.id, name: client.name });
          }
        });
        setClientPortalOrgs(Array.from(uniqueClients.values()));
      }
    } catch (error) {
      console.error('Error fetching client portals:', error);
    } finally {
      setLoadingPortals(false);
    }
  };

  // Move useEffect BEFORE any conditional returns
  useEffect(() => {
    if (currentOrganization && isSuperAdmin) {
      fetchOrgUsers();
    }
  }, [currentOrganization, isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchClientPortals();
    }
  }, [isSuperAdmin]);

  // Only show for super admins - this must be AFTER all hooks
  if (!isSuperAdmin) return null;

  const filteredUsers = orgUsers.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: OrgRole) => {
    const colors: Record<OrgRole, string> = {
      owner: 'bg-amber-500/20 text-amber-500',
      admin: 'bg-purple-500/20 text-purple-500',
      project_manager: 'bg-blue-500/20 text-blue-500',
      technician: 'bg-green-500/20 text-green-500',
      viewer: 'bg-gray-500/20 text-gray-500',
    };
    return colors[role] || 'bg-gray-500/20 text-gray-500';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isImpersonating ? "destructive" : "outline"} 
          size="sm" 
          className="gap-1 md:gap-2 h-9 w-9 md:h-9 md:w-auto md:px-3 p-0 md:p-2"
        >
          <Eye className="h-4 w-4" />
          {isImpersonating ? (
            <span className="hidden md:inline truncate max-w-[100px]">
              {impersonation.type === 'client_portal'
                ? impersonation.targetClientName
                : impersonation.type === 'role' 
                  ? impersonation.targetRole 
                  : impersonation.targetUserEmail?.split('@')[0]}
            </span>
          ) : (
            <span className="hidden md:inline">View As</span>
          )}
          <ChevronDown className="h-3 w-3 hidden md:block" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72">
        {isImpersonating && (
          <>
            <DropdownMenuItem 
              onClick={stopImpersonation}
              className="text-destructive focus:text-destructive"
            >
              <Shield className="h-4 w-4 mr-2" />
              Exit Impersonation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          View by Role
        </DropdownMenuLabel>
        
        {roles.map(role => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => startRoleImpersonation(role.value)}
            className="flex flex-col items-start py-2"
          >
            <span className="font-medium">{role.label}</span>
            <span className="text-xs text-muted-foreground">{role.description}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <Users className="h-4 w-4" />
            View as Specific User
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              {loadingUsers ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No users found
                </div>
              ) : (
                filteredUsers.map(user => (
                  <DropdownMenuItem
                    key={user.user_id}
                    onClick={() => startUserImpersonation(user.user_id, user.email)}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[140px]">{user.email}</span>
                    </div>
                    <Badge variant="secondary" className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <Building2 className="h-4 w-4" />
            View as Client Portal
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64">
            <div className="max-h-64 overflow-y-auto">
              {loadingPortals ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading client portals...
                </div>
              ) : clientPortalOrgs.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No client portals found
                </div>
              ) : (
                clientPortalOrgs.map(org => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => startClientPortalImpersonation(org.id, org.name)}
                    className="flex items-center gap-2 py-2"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{org.name}</span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
