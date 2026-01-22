import React from 'react';
import { AlertTriangle, X, User, Shield, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';

export const ImpersonationBanner: React.FC = () => {
  const { 
    impersonation, 
    isImpersonating, 
    stopImpersonation,
    currentOrganization 
  } = useOrganization();

  if (!isImpersonating) return null;

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Owner',
      admin: 'Admin',
      project_manager: 'Project Manager',
      technician: 'Technician',
      viewer: 'Viewer',
    };
    return labels[role] || role;
  };

  const getDurationText = () => {
    if (!impersonation.startedAt) return '';
    const seconds = Math.floor((new Date().getTime() - impersonation.startedAt.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <div className="flex items-center gap-2">
          {impersonation.type === 'client_portal' ? (
              <>
                <Building2 className="h-4 w-4" />
                <span className="font-medium">
                  Viewing Client Portal: {impersonation.targetClientName}
                </span>
              </>
            ) : impersonation.type === 'role' ? (
              <>
                <Shield className="h-4 w-4" />
                <span className="font-medium">
                  Viewing as: {getRoleLabel(impersonation.targetRole || '')}
                </span>
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                <span className="font-medium">
                  Impersonating: {impersonation.targetUserEmail}
                </span>
                <span className="text-destructive-foreground/70">
                  ({getRoleLabel(impersonation.targetRole || '')})
                </span>
              </>
            )}
            {impersonation.type !== 'client_portal' && currentOrganization && (
              <span className="text-destructive-foreground/70">
                @ {currentOrganization.name}
              </span>
            )}
          </div>
          <span className="text-destructive-foreground/60 text-sm">
            · Started {getDurationText()}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={stopImpersonation}
          className="text-destructive-foreground hover:bg-destructive-foreground/20 gap-2"
        >
          <X className="h-4 w-4" />
          Exit View
        </Button>
      </div>
    </div>
  );
};
