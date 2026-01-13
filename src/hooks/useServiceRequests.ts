import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ServiceRequest {
  id: string;
  title: string;
  description: string | null;
  request_type: string;
  priority: string;
  status: string;
  location_id: string | null;
  drop_point_id: string | null;
  requesting_organization_id: string;
  parent_organization_id: string;
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  work_order_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  location?: { name: string } | null;
  requesting_organization?: { name: string } | null;
}

interface CreateServiceRequestData {
  title: string;
  description?: string;
  request_type: string;
  priority: string;
  location_id?: string;
  drop_point_id?: string;
}

export const useServiceRequests = () => {
  const { currentOrganization, isClientPortalUser, parentOrganizationId } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServiceRequests = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      
      // Build query based on user type
      let query = supabase
        .from('service_requests')
        .select(`
          *,
          location:locations(name),
          requesting_organization:organizations!service_requests_requesting_organization_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      // Client portal users see their own requests
      // Parent org users see requests submitted to them
      if (isClientPortalUser) {
        query = query.eq('requesting_organization_id', currentOrganization.id);
      } else {
        query = query.eq('parent_organization_id', currentOrganization.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setServiceRequests((data || []) as ServiceRequest[]);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createServiceRequest = async (data: CreateServiceRequestData) => {
    if (!currentOrganization?.id || !user?.id || !parentOrganizationId) {
      toast({
        title: "Error",
        description: "Unable to create service request. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data: newRequest, error } = await supabase
        .from('service_requests')
        .insert({
          ...data,
          requesting_organization_id: currentOrganization.id,
          parent_organization_id: parentOrganizationId,
          requested_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger notification for new request
      try {
        await supabase.functions.invoke('notify-service-request', {
          body: { 
            serviceRequestId: newRequest.id, 
            eventType: 'created' 
          }
        });
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
        // Don't fail the request if notification fails
      }

      toast({
        title: "Request Submitted",
        description: "Your service request has been submitted successfully.",
      });

      await fetchServiceRequests();
      return newRequest;
    } catch (error) {
      console.error('Error creating service request:', error);
      toast({
        title: "Error",
        description: "Failed to create service request.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateServiceRequest = async (id: string, updates: Partial<ServiceRequest>) => {
    try {
      // Get the previous status before updating
      const previousRequest = serviceRequests.find(r => r.id === id);
      const previousStatus = previousRequest?.status;

      const { error } = await supabase
        .from('service_requests')
        .update({
          ...updates,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Trigger notification for status change
      if (updates.status && updates.status !== previousStatus) {
        try {
          await supabase.functions.invoke('notify-service-request', {
            body: { 
              serviceRequestId: id, 
              eventType: 'status_changed',
              newStatus: updates.status,
              previousStatus
            }
          });
        } catch (notifyError) {
          console.error('Failed to send notification:', notifyError);
        }
      }

      toast({
        title: "Request Updated",
        description: "Service request has been updated.",
      });

      await fetchServiceRequests();
    } catch (error) {
      console.error('Error updating service request:', error);
      toast({
        title: "Error",
        description: "Failed to update service request.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, [currentOrganization?.id, isClientPortalUser]);

  return {
    serviceRequests,
    loading,
    createServiceRequest,
    updateServiceRequest,
    refetch: fetchServiceRequests,
  };
};
