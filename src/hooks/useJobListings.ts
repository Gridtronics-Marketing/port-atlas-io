import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: "Full-time" | "Part-time" | "Contract" | "Internship";
  description: string;
  requirements: string[];
  benefits: string[];
  salary_range: string | null;
  is_active: boolean;
  application_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useJobListings() {
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["job-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as JobListing[];
    },
  });

  const createJob = useMutation({
    mutationFn: async (job: Omit<JobListing, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("job_listings")
        .insert(job)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-listings"] });
      toast.success("Job listing created");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create job listing");
    },
  });

  const updateJob = useMutation({
    mutationFn: async (updates: Partial<JobListing> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from("job_listings")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-listings"] });
      toast.success("Job listing updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update job listing");
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-listings"] });
      toast.success("Job listing deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete job listing");
    },
  });

  return { jobs, isLoading, createJob, updateJob, deleteJob };
}
