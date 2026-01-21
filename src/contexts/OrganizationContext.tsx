import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type OrgRole = 'owner' | 'admin' | 'project_manager' | 'technician' | 'viewer';
export type PlatformRole = 'super_admin' | 'support';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  logo_url: string | null;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

interface ImpersonationState {
  type: 'role' | 'user' | null;
  targetRole: OrgRole | null;
  targetUserId: string | null;
  targetUserEmail: string | null;
  startedAt: Date | null;
}

interface OrganizationContextType {
  // Organization state
  currentOrganization: Organization | null;
  organizations: Organization[];
  userOrgRole: OrgRole | null;
  loadingOrganizations: boolean;
  
  // Super admin state
  isSuperAdmin: boolean;
  isPlatformAdmin: boolean;
  isGlobalView: boolean;
  
  // Impersonation state
  impersonation: ImpersonationState;
  isImpersonating: boolean;
  effectiveRole: OrgRole | null;
  
  // Client portal state
  isClientPortalUser: boolean;
  parentOrganizationId: string | null;
  linkedClientId: string | null;
  
  // Actions
  switchOrganization: (orgId: string | null) => Promise<void>;
  startRoleImpersonation: (role: OrgRole) => Promise<void>;
  startUserImpersonation: (userId: string, userEmail: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'selectedOrganizationId';
const GLOBAL_VIEW_KEY = 'global';

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Organization state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userOrgRole, setUserOrgRole] = useState<OrgRole | null>(null);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  
  // Super admin state
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isGlobalView, setIsGlobalView] = useState(false);
  
  // Client portal state
  const [isClientPortalUser, setIsClientPortalUser] = useState(false);
  const [parentOrganizationId, setParentOrganizationId] = useState<string | null>(null);
  const [linkedClientId, setLinkedClientId] = useState<string | null>(null);
  
  // Impersonation state (not persisted - resets on refresh)
  const [impersonation, setImpersonation] = useState<ImpersonationState>({
    type: null,
    targetRole: null,
    targetUserId: null,
    targetUserEmail: null,
    startedAt: null,
  });

  const isImpersonating = impersonation.type !== null;
  
  // Effective role: impersonated role or actual org role
  const effectiveRole = impersonation.targetRole || userOrgRole;

  // Check if user is super admin
  const checkSuperAdmin = async () => {
    if (!user) {
      setIsSuperAdmin(false);
      setIsPlatformAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking super admin status:', error);
        return;
      }

      if (data) {
        setIsPlatformAdmin(true);
        setIsSuperAdmin(data.role === 'super_admin');
      } else {
        setIsPlatformAdmin(false);
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error('Error checking super admin:', error);
    }
  };

  // Fetch user's organizations
  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setLoadingOrganizations(false);
      return;
    }

    try {
      setLoadingOrganizations(true);

      // If super admin, fetch all organizations
      if (isSuperAdmin) {
        const { data: allOrgs, error } = await supabase
          .from('organizations')
          .select('*')
          .order('name');

        if (error) throw error;
        
        const orgs = (allOrgs || []) as Organization[];
        setOrganizations(orgs);
        
        // Restore from localStorage - check for global view or specific org
        const savedOrgId = localStorage.getItem(STORAGE_KEY);
        
        if (savedOrgId === GLOBAL_VIEW_KEY) {
          // Super admin previously selected global view
          setIsGlobalView(true);
          setCurrentOrganization(null);
        } else if (!currentOrganization && !isGlobalView) {
          // Default super admins to global view on first load
          const savedOrg = savedOrgId ? orgs.find(o => o.id === savedOrgId) : null;
          if (savedOrg) {
            setCurrentOrganization(savedOrg);
            setIsGlobalView(false);
          } else {
            // Default to global view for super admins
            setIsGlobalView(true);
            setCurrentOrganization(null);
            localStorage.setItem(STORAGE_KEY, GLOBAL_VIEW_KEY);
          }
        }
      } else {
        // Fetch only organizations user is a member of
        const { data: memberships, error: memberError } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id);

        if (memberError) throw memberError;

        if (memberships && memberships.length > 0) {
          const orgIds = memberships.map(m => m.organization_id);
          
          const { data: orgs, error: orgsError } = await supabase
            .from('organizations')
            .select('*')
            .in('id', orgIds)
            .order('name');

          if (orgsError) throw orgsError;

          setOrganizations((orgs || []) as Organization[]);
          
          // Restore from localStorage or auto-select first org
          const savedOrgId = localStorage.getItem(STORAGE_KEY);
          const savedOrg = savedOrgId ? orgs?.find(o => o.id === savedOrgId) : null;
          
          if (!currentOrganization && orgs && orgs.length > 0) {
            const firstOrg = (savedOrg || orgs[0]) as Organization;
            setCurrentOrganization(firstOrg);
            const membership = memberships.find(m => m.organization_id === firstOrg.id);
            setUserOrgRole(membership?.role as OrgRole || null);
          }
        } else {
          setOrganizations([]);
          setCurrentOrganization(null);
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const switchOrganization = async (orgId: string | null) => {
    // Handle global view for super admins
    if (orgId === null && isSuperAdmin) {
      setIsGlobalView(true);
      setCurrentOrganization(null);
      localStorage.setItem(STORAGE_KEY, GLOBAL_VIEW_KEY);
      
      // Stop any impersonation when switching to global view
      if (isImpersonating) {
        await stopImpersonation();
      }
      return;
    }

    const org = organizations.find(o => o.id === orgId);
    if (!org) return;

    setIsGlobalView(false);
    setCurrentOrganization(org);
    localStorage.setItem(STORAGE_KEY, orgId!);

    // Get user's role in this org (if not super admin)
    if (!isSuperAdmin && user) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle();

      setUserOrgRole(membership?.role as OrgRole || null);
    }

    // Stop any impersonation when switching orgs
    if (isImpersonating) {
      await stopImpersonation();
    }
  };

  // Start role impersonation (super admin only)
  const startRoleImpersonation = async (role: OrgRole) => {
    if (!isSuperAdmin || !user || !currentOrganization) return;

    // Log the impersonation start
    await supabase.from('admin_impersonation_log').insert({
      admin_user_id: user.id,
      impersonation_type: 'role',
      target_role: role,
      target_organization_id: currentOrganization.id,
      action: 'start',
      user_agent: navigator.userAgent,
      metadata: { organization_name: currentOrganization.name }
    });

    setImpersonation({
      type: 'role',
      targetRole: role,
      targetUserId: null,
      targetUserEmail: null,
      startedAt: new Date(),
    });
  };

  // Start user impersonation (super admin only)
  const startUserImpersonation = async (userId: string, userEmail: string) => {
    if (!isSuperAdmin || !user || !currentOrganization) return;

    // Get the target user's role in this org
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', currentOrganization.id)
      .eq('user_id', userId)
      .maybeSingle();

    // Log the impersonation start
    await supabase.from('admin_impersonation_log').insert({
      admin_user_id: user.id,
      impersonation_type: 'user',
      target_user_id: userId,
      target_organization_id: currentOrganization.id,
      action: 'start',
      user_agent: navigator.userAgent,
      metadata: { 
        organization_name: currentOrganization.name,
        target_user_email: userEmail 
      }
    });

    setImpersonation({
      type: 'user',
      targetRole: membership?.role as OrgRole || 'viewer',
      targetUserId: userId,
      targetUserEmail: userEmail,
      startedAt: new Date(),
    });
  };

  // Stop impersonation
  const stopImpersonation = async () => {
    if (!isImpersonating || !user) return;

    // Log the impersonation end
    await supabase.from('admin_impersonation_log').insert({
      admin_user_id: user.id,
      impersonation_type: impersonation.type,
      target_role: impersonation.targetRole,
      target_user_id: impersonation.targetUserId,
      target_organization_id: currentOrganization?.id,
      action: 'end',
      user_agent: navigator.userAgent,
      metadata: { 
        duration_seconds: impersonation.startedAt 
          ? Math.floor((new Date().getTime() - impersonation.startedAt.getTime()) / 1000)
          : 0
      }
    });

    setImpersonation({
      type: null,
      targetRole: null,
      targetUserId: null,
      targetUserEmail: null,
      startedAt: null,
    });
  };

  const refreshOrganizations = async () => {
    await fetchOrganizations();
  };

  // Check super admin status when user changes
  useEffect(() => {
    checkSuperAdmin();
  }, [user]);

  // Fetch organizations when user or super admin status changes
  useEffect(() => {
    fetchOrganizations();
  }, [user, isSuperAdmin]);

  // Detect client portal user based on organization settings
  React.useEffect(() => {
    if (currentOrganization?.settings?.parentOrganizationId) {
      setIsClientPortalUser(true);
      setParentOrganizationId(currentOrganization.settings.parentOrganizationId);
      
      // Find linked client record
      const fetchLinkedClient = async () => {
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('linked_organization_id', currentOrganization.id)
          .maybeSingle();
        setLinkedClientId(client?.id || null);
      };
      fetchLinkedClient();
    } else {
      setIsClientPortalUser(false);
      setParentOrganizationId(null);
      setLinkedClientId(null);
    }
  }, [currentOrganization]);

  const value: OrganizationContextType = {
    currentOrganization,
    organizations,
    userOrgRole,
    loadingOrganizations,
    isSuperAdmin,
    isPlatformAdmin,
    isGlobalView,
    impersonation,
    isImpersonating,
    effectiveRole,
    isClientPortalUser,
    parentOrganizationId,
    linkedClientId,
    switchOrganization,
    startRoleImpersonation,
    startUserImpersonation,
    stopImpersonation,
    refreshOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
