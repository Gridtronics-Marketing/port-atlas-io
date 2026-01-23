import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  category_id: string | null;
  category?: BlogCategory;
  author_name: string;
  author_avatar_url: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  meta_description: string | null;
  tags: string[];
  read_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export function useBlogPosts(slug?: string) {
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, category:blog_categories(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, category:blog_categories(*)")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });

  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as BlogCategory[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (post: Omit<BlogPost, "id" | "created_at" | "updated_at" | "category">) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Post created");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create post");
    },
  });

  const updatePost = useMutation({
    mutationFn: async (updates: Partial<BlogPost> & { id: string }) => {
      const { id, category, ...data } = updates;
      const { error } = await supabase
        .from("blog_posts")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Post updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update post");
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Post deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete post");
    },
  });

  const createCategory = useMutation({
    mutationFn: async (cat: Omit<BlogCategory, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("blog_categories")
        .insert(cat)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Category created");
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Category deleted");
    },
  });

  return {
    posts,
    post,
    categories,
    isLoading,
    isLoadingPost,
    createPost,
    updatePost,
    deletePost,
    createCategory,
    deleteCategory,
  };
}
