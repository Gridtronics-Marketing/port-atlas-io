import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function useFAQs() {
  const queryClient = useQueryClient();

  const { data: faqs, isLoading, error } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as FAQItem[];
    },
  });

  const activeFAQs = faqs?.filter(f => f.is_active) || [];

  const faqsByCategory = activeFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  const createFAQ = useMutation({
    mutationFn: async (faq: Omit<FAQItem, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("faq_items")
        .insert(faq)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ added");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add FAQ: ${error.message}`);
    },
  });

  const updateFAQ = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FAQItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("faq_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update FAQ: ${error.message}`);
    },
  });

  const deleteFAQ = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("faq_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete FAQ: ${error.message}`);
    },
  });

  return {
    faqs,
    activeFAQs,
    faqsByCategory,
    isLoading,
    error,
    createFAQ,
    updateFAQ,
    deleteFAQ,
  };
}
