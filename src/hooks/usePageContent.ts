import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PageContent {
  id: string;
  page_slug: string;
  page_title: string;
  meta_description: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  content: any[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function usePageContent(pageSlug?: string) {
  const queryClient = useQueryClient();

  const { data: pages, isLoading } = useQuery({
    queryKey: ["page-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .order("page_slug");
      if (error) throw error;
      return data as PageContent[];
    },
  });

  const { data: page, isLoading: isLoadingPage } = useQuery({
    queryKey: ["page-content", pageSlug],
    queryFn: async () => {
      if (!pageSlug) return null;
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .eq("page_slug", pageSlug)
        .single();
      if (error) throw error;
      return data as PageContent;
    },
    enabled: !!pageSlug,
  });

  const updatePage = useMutation({
    mutationFn: async (updates: Partial<PageContent> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from("page_content")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-content"] });
      toast.success("Page updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update page");
    },
  });

  return { pages, page, isLoading, isLoadingPage, updatePage };
}
