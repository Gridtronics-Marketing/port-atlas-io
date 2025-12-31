import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface LocationAccessGrant {
  id: string;
  location_id: string;
  granted_organization_id: string;
  access_level: 'view' | 'edit' | 'full';
  granted_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  organization?: {
    id: string;
    name: string;
  };
}

export const useLocationAccessGrants = (locationId?: string) => {
  const [grants, setGrants] = useState<LocationAccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchGrants = async () => {
    if (!locationId) {
      setGrants([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('location_access_grants')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch organization names for the grants
      const orgIds = [...new Set((data || []).map(g => g.granted_organization_id))];
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);

      const orgMap = new Map((orgs || []).map(o => [o.id, o]));

      const grantsWithOrgs = (data || []).map(grant => ({
        ...grant,
        access_level: grant.access_level as 'view' | 'edit' | 'full',
        organization: orgMap.get(grant.granted_organization_id)
      }));

      setGrants(grantsWithOrgs);
    } catch (error) {
      console.error('Error fetching location access grants:', error);
      toast({
        title: "Error",
        description: "Failed to fetch access grants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addGrant = async (
    grantedOrganizationId: string,
    accessLevel: 'view' | 'edit' | 'full' = 'view',
    notes?: string
  ) => {
    if (!locationId) return;

    try {
      const { error } = await supabase
        .from('location_access_grants')
        .insert({
          location_id: locationId,
          granted_organization_id: grantedOrganizationId,
          access_level: accessLevel,
          granted_by: user?.id,
          notes
        });

      if (error) throw error;

      await fetchGrants();
      toast({
        title: "Success",
        description: "Access granted successfully",
      });
    } catch (error: any) {
      console.error('Error adding access grant:', error);
      toast({
        title: "Error",
        description: error.message?.includes('duplicate') 
          ? "This organization already has access" 
          : "Failed to grant access",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateGrant = async (grantId: string, updates: Partial<Pick<LocationAccessGrant, 'access_level' | 'notes'>>) => {
    try {
      const { error } = await supabase
        .from('location_access_grants')
        .update(updates)
        .eq('id', grantId);

      if (error) throw error;

      await fetchGrants();
      toast({
        title: "Success",
        description: "Access updated successfully",
      });
    } catch (error) {
      console.error('Error updating access grant:', error);
      toast({
        title: "Error",
        description: "Failed to update access",
        variant: "destructive",
      });
      throw error;
    }
  };

  const revokeGrant = async (grantId: string) => {
    try {
      const { error } = await supabase
        .from('location_access_grants')
        .delete()
        .eq('id', grantId);

      if (error) throw error;

      setGrants(prev => prev.filter(g => g.id !== grantId));
      toast({
        title: "Success",
        description: "Access revoked successfully",
      });
    } catch (error) {
      console.error('Error revoking access grant:', error);
      toast({
        title: "Error",
        description: "Failed to revoke access",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchGrants();
  }, [locationId]);

  return {
    grants,
    loading,
    fetchGrants,
    addGrant,
    updateGrant,
    revokeGrant,
  };
};
