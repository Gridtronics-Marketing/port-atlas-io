import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Lead {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  phone: string | null;
  industry: string | null;
  company_size: string | null;
  message: string | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: string;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingResponse {
  id: string;
  lead_id: string;
  step_number: number;
  step_name: string;
  response_data: Record<string, any>;
  completed_at: string | null;
  created_at: string;
}

export function useLeads() {
  const queryClient = useQueryClient();

  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_captures")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: onboardingResponses } = useQuery({
    queryKey: ["onboarding-responses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_responses")
        .select("*")
        .order("step_number", { ascending: true });

      if (error) throw error;
      return data as OnboardingResponse[];
    },
  });

  const createLead = useMutation({
    mutationFn: async (lead: Omit<Lead, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("lead_captures")
        .insert(lead)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit: ${error.message}`);
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from("lead_captures")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update lead: ${error.message}`);
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lead_captures")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });

  const saveOnboardingResponse = useMutation({
    mutationFn: async (response: Omit<OnboardingResponse, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("onboarding_responses")
        .upsert(response, { 
          onConflict: "lead_id,step_number",
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-responses"] });
    },
  });

  const getLeadResponses = (leadId: string) => {
    return onboardingResponses?.filter(r => r.lead_id === leadId) || [];
  };

  const getLeadMetrics = () => {
    if (!leads) return { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 };
    
    return {
      total: leads.length,
      new: leads.filter(l => l.status === "new").length,
      contacted: leads.filter(l => l.status === "contacted").length,
      qualified: leads.filter(l => l.status === "qualified").length,
      converted: leads.filter(l => l.status === "converted").length,
      lost: leads.filter(l => l.status === "lost").length,
    };
  };

  return {
    leads,
    onboardingResponses,
    isLoading,
    error,
    createLead,
    updateLead,
    deleteLead,
    saveOnboardingResponse,
    getLeadResponses,
    getLeadMetrics,
  };
}
