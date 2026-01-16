import React from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';

export const OrganizationSwitcher: React.FC = () => {
  const {
    currentOrganization,
    organizations,
    loadingOrganizations,
    switchOrganization,
    isSuperAdmin,
    userOrgRole,
  } = useOrganization();
  const navigate = useNavigate();

  // Don't show if user has no organizations and isn't super admin
  if (!isSuperAdmin && organizations.length <= 1) return null;

  const getRoleLabel = (role: string | null) => {
    if (!role) return '';
    const labels: Record<string, string> = {
      owner: 'Owner',
      admin: 'Admin',
      project_manager: 'PM',
      technician: 'Tech',
      viewer: 'View',
    };
    return labels[role] || role;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 md:gap-2 max-w-[100px] sm:max-w-[140px] md:max-w-[200px] px-2 md:px-3">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate hidden sm:inline">
            {loadingOrganizations 
              ? '...' 
              : currentOrganization?.name || 'Org'}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Organizations</span>
          {isSuperAdmin && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 text-xs">
              Super Admin
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {organizations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No organizations found
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {organizations.map(org => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => switchOrganization(org.id)}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  {currentOrganization?.id === org.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                  {currentOrganization?.id !== org.id && (
                    <div className="w-4" />
                  )}
                  <span className="truncate">{org.name}</span>
                </div>
                {!isSuperAdmin && userOrgRole && (
                  <Badge variant="outline" className="text-xs">
                    {getRoleLabel(userOrgRole)}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/admin/organizations')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Manage Organizations
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
