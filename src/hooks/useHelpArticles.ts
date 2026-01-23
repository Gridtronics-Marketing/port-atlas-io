import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HelpArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useHelpArticles() {
  const queryClient = useQueryClient();

  const { data: articles, isLoading } = useQuery({
    queryKey: ["help-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_articles")
        .select("*")
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return data as HelpArticle[];
    },
  });

  const createArticle = useMutation({
    mutationFn: async (article: Omit<HelpArticle, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("help_articles")
        .insert(article)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-articles"] });
      toast.success("Help article created");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create article");
    },
  });

  const updateArticle = useMutation({
    mutationFn: async (updates: Partial<HelpArticle> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from("help_articles")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-articles"] });
      toast.success("Help article updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update article");
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("help_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-articles"] });
      toast.success("Help article deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete article");
    },
  });

  // Group articles by category
  const articlesByCategory = articles?.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, HelpArticle[]>);

  return { articles, articlesByCategory, isLoading, createArticle, updateArticle, deleteArticle };
}
