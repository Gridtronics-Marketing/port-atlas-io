import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Testimonial {
  id: string;
  author_name: string;
  author_title: string | null;
  company_name: string | null;
  quote: string;
  avatar_url: string | null;
  rating: number | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export function useTestimonials() {
  const queryClient = useQueryClient();

  const { data: testimonials, isLoading, error } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const featuredTestimonials = testimonials?.filter(t => t.is_featured && t.is_active) || [];
  const activeTestimonials = testimonials?.filter(t => t.is_active) || [];

  const createTestimonial = useMutation({
    mutationFn: async (testimonial: Omit<Testimonial, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("testimonials")
        .insert(testimonial)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("Testimonial added");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add testimonial: ${error.message}`);
    },
  });

  const updateTestimonial = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Testimonial> & { id: string }) => {
      const { data, error } = await supabase
        .from("testimonials")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("Testimonial updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update testimonial: ${error.message}`);
    },
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("Testimonial deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete testimonial: ${error.message}`);
    },
  });

  return {
    testimonials,
    featuredTestimonials,
    activeTestimonials,
    isLoading,
    error,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
  };
}
