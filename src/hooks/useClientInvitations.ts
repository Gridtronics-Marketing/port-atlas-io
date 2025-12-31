import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface ClientInvitation {
  id: string;
  client_id: string;
  organization_id: string;
  invited_email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitation_token: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  organization_id_scope: string;
  // Joined data
  client?: {
    name: string;
  };
  organization?: {
    name: string;
  };
}

export const useClientInvitations = () => {
  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  const fetchInvitations = async () => {
    if (!currentOrganization?.id) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_invitations')
        .select(`
          *,
          client:clients(name),
          organization:organizations(name)
        `)
        .eq('organization_id_scope', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Update expired invitations and cast properly
      const now = new Date();
      const updatedData = (data || []).map(inv => {
        const status = (inv.status === 'pending' && new Date(inv.expires_at) < now) 
          ? 'expired' 
          : inv.status;
        return {
          ...inv,
          status: status as ClientInvitation['status'],
          client: inv.client as { name: string } | undefined,
          organization: inv.organization as { name: string } | undefined
        };
      }) as ClientInvitation[];

      setInvitations(updatedData);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      const invitation = invitations.find(i => i.id === invitationId);
      if (!invitation) throw new Error('Invitation not found');

      // Get client details
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', invitation.client_id)
        .single();

      if (!client) throw new Error('Client not found');

      // Cancel old invitation
      await supabase
        .from('client_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      // Create new invitation via edge function
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('invite-client-user', {
        body: {
          clientId: invitation.client_id,
          clientName: client.name,
          organizationName: invitation.organization?.name || client.name,
          organizationSlug: invitation.organization?.name?.toLowerCase().replace(/\s+/g, '-') || '',
          inviteEmail: invitation.invited_email,
          userRole: 'admin',
          parentOrganizationId: currentOrganization?.id
        }
      });

      if (response.error) throw response.error;

      toast.success('Invitation resent successfully');
      await fetchInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('client_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation cancelled');
      await fetchInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [currentOrganization?.id]);

  return {
    invitations,
    loading,
    fetchInvitations,
    resendInvitation,
    cancelInvitation,
    pendingCount: invitations.filter(i => i.status === 'pending').length
  };
};
