import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { DraftDropPoint } from "@/components/ClientDropPointPlacementSession";

interface PendingProposal {
  id: string;
  title: string;
  status: string;
  created_at: string;
  dropPoints: Array<{
    link_id: string;
    drop_point_id: string;
    label: string;
    point_type: string;
    floor: number;
    x: number;
    y: number;
    notes: string | null;
  }>;
}

export const useEditableProposal = (locationId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<PendingProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Get pending batch requests for this location
      const { data: srs, error: srErr } = await supabase
        .from("service_requests")
        .select("id, title, status, created_at")
        .eq("location_id", locationId)
        .eq("request_type", "new_drop_points_batch")
        .eq("requested_by", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (srErr) throw srErr;
      if (!srs || srs.length === 0) {
        setProposals([]);
        return;
      }

      // For each, get linked drop points
      const result: PendingProposal[] = [];
      for (const sr of srs) {
        const { data: links } = await supabase
          .from("service_request_drop_points")
          .select("id, drop_point_id")
          .eq("service_request_id", sr.id);

        if (!links || links.length === 0) continue;

        const dpIds = links.map((l) => l.drop_point_id);
        const { data: dps } = await supabase
          .from("drop_points")
          .select("id, label, point_type, floor, x_coordinate, y_coordinate, notes")
          .in("id", dpIds);

        result.push({
          ...sr,
          dropPoints: (dps || []).map((dp) => {
            const link = links.find((l) => l.drop_point_id === dp.id);
            return {
              link_id: link?.id || "",
              drop_point_id: dp.id,
              label: dp.label || "",
              point_type: dp.point_type || "data",
              floor: dp.floor || 1,
              x: dp.x_coordinate || 0,
              y: dp.y_coordinate || 0,
              notes: dp.notes,
            };
          }),
        });
      }

      setProposals(result);
    } catch (err) {
      console.error("Error fetching proposals:", err);
    } finally {
      setLoading(false);
    }
  }, [locationId, user?.id]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const removeDropPoint = async (proposalId: string, dropPointId: string) => {
    try {
      // Delete link
      await supabase
        .from("service_request_drop_points")
        .delete()
        .eq("service_request_id", proposalId)
        .eq("drop_point_id", dropPointId);

      // Delete drop point
      await supabase.from("drop_points").delete().eq("id", dropPointId);

      toast({ title: "Point Removed", description: "Drop point removed from proposal." });
      await fetchProposals();
    } catch (err) {
      console.error("Error removing drop point:", err);
      toast({ title: "Error", description: "Failed to remove point.", variant: "destructive" });
    }
  };

  return { proposals, loading, refetch: fetchProposals, removeDropPoint };
};
