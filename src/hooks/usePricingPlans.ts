import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  is_popular: boolean;
  is_enterprise: boolean;
  max_locations: number | null;
  max_users: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingFeature {
  id: string;
  plan_id: string;
  feature_name: string;
  feature_value: string | null;
  is_included: boolean;
  sort_order: number;
  created_at: string;
}

export interface PlanWithFeatures extends PricingPlan {
  features: PricingFeature[];
}

export function usePricingPlans() {
  const queryClient = useQueryClient();

  const { data: plans, isLoading, error } = useQuery({
    queryKey: ["pricing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as PricingPlan[];
    },
  });

  const { data: features } = useQuery({
    queryKey: ["pricing-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_features")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as PricingFeature[];
    },
  });

  const plansWithFeatures: PlanWithFeatures[] = plans?.map(plan => ({
    ...plan,
    features: features?.filter(f => f.plan_id === plan.id) || [],
  })) || [];

  const createPlan = useMutation({
    mutationFn: async (plan: Omit<PricingPlan, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("pricing_plans")
        .insert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast.success("Pricing plan created");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create plan: ${error.message}`);
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from("pricing_plans")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast.success("Pricing plan updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update plan: ${error.message}`);
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pricing_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast.success("Pricing plan deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete plan: ${error.message}`);
    },
  });

  const createFeature = useMutation({
    mutationFn: async (feature: Omit<PricingFeature, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("pricing_features")
        .insert(feature)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-features"] });
      toast.success("Feature added");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add feature: ${error.message}`);
    },
  });

  const updateFeature = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingFeature> & { id: string }) => {
      const { data, error } = await supabase
        .from("pricing_features")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-features"] });
      toast.success("Feature updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update feature: ${error.message}`);
    },
  });

  const deleteFeature = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pricing_features")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-features"] });
      toast.success("Feature deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete feature: ${error.message}`);
    },
  });

  return {
    plans,
    features,
    plansWithFeatures,
    isLoading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    createFeature,
    updateFeature,
    deleteFeature,
  };
}
