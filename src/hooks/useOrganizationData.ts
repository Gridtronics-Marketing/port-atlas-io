import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Hook to get the current organization's ID for data queries.
 * This should be used in all data hooks to filter data by organization.
 */
export const useOrganizationData = () => {
  const { 
    currentOrganization, 
    isSuperAdmin,
    isImpersonating,
    impersonation,
    effectiveRole,
  } = useOrganization();

  /**
   * Returns the organization_id to use for queries.
   * Super admins viewing as super admin should still get the current org's data.
   */
  const getOrganizationId = () => {
    return currentOrganization?.id || null;
  };

  /**
   * Check if user can perform an action based on their effective role.
   * During impersonation, this uses the impersonated role.
   */
  const canPerformAction = (requiredRoles: string[]) => {
    // Super admin not impersonating can do anything
    if (isSuperAdmin && !isImpersonating) {
      return true;
    }

    // Use effective role (impersonated or actual)
    if (effectiveRole && requiredRoles.includes(effectiveRole)) {
      return true;
    }

    return false;
  };

  /**
   * Get permission level for the current view.
   * Returns 'super_admin' only when not impersonating.
   */
  const getPermissionLevel = (): 'super_admin' | 'owner' | 'admin' | 'project_manager' | 'technician' | 'viewer' | null => {
    if (isSuperAdmin && !isImpersonating) {
      return 'super_admin';
    }
    return effectiveRole;
  };

  /**
   * Check if viewing as a specific role (for UI adjustments).
   */
  const isViewingAs = (role: string) => {
    if (!isImpersonating) return false;
    return impersonation.targetRole === role;
  };

  return {
    organizationId: getOrganizationId(),
    currentOrganization,
    isSuperAdmin,
    isImpersonating,
    effectiveRole,
    canPerformAction,
    getPermissionLevel,
    isViewingAs,
  };
};
