import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  name: string;
  role: string;
}

export interface ProfileWithRoles extends Profile {
  roles: string[];
  organizations: OrganizationMembership[];
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<ProfileWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch all organization memberships with org names
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          organization_id,
          organizations (
            id,
            name
          )
        `);

      if (membershipsError) throw membershipsError;

      // Combine profiles with their roles and organizations
      const profilesWithRoles: ProfileWithRoles[] = (profilesData || []).map(profile => {
        const userRoles = (rolesData || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role);
        
        const userOrgs = (membershipsData || [])
          .filter(m => m.user_id === profile.id)
          .map(m => ({
            id: (m.organizations as any)?.id || m.organization_id,
            name: (m.organizations as any)?.name || 'Unknown',
            role: m.role,
          }));
        
        return {
          ...profile,
          roles: userRoles,
          organizations: userOrgs,
        };
      });

      setProfiles(profilesWithRoles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProfileByUserId = (userId: string): ProfileWithRoles | undefined => {
    return profiles.find(p => p.id === userId);
  };

  const updateProfile = async (profileId: string, updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) throw error;

      await fetchProfiles();

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  return {
    profiles,
    loading,
    fetchProfiles,
    updateProfile,
    getProfileByUserId,
  };
};
