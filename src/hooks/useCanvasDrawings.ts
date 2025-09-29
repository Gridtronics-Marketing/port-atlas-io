import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CanvasDrawing {
  id: string;
  location_id: string;
  floor_number: number;
  canvas_data: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface CanvasDrawingData {
  location_id: string;
  floor_number: number;
  canvas_data: any;
}

export function useCanvasDrawings(locationId?: string) {
  const [drawings, setDrawings] = useState<CanvasDrawing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDrawings = async () => {
    if (!locationId) {
      setDrawings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("canvas_drawings")
        .select("*")
        .eq("location_id", locationId)
        .order("floor_number", { ascending: true });

      if (error) {
        console.error("Error fetching canvas drawings:", error);
        toast({
          title: "Error",
          description: "Failed to load canvas drawings",
          variant: "destructive",
        });
        return;
      }

      setDrawings(data || []);
    } catch (error) {
      console.error("Error fetching canvas drawings:", error);
      toast({
        title: "Error",
        description: "Failed to load canvas drawings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDrawing = async (drawingData: CanvasDrawingData) => {
    try {
      const { data, error } = await supabase
        .from("canvas_drawings")
        .upsert(
          {
            location_id: drawingData.location_id,
            floor_number: drawingData.floor_number,
            canvas_data: drawingData.canvas_data,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          },
          {
            onConflict: "location_id,floor_number",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("Error saving canvas drawing:", error);
        toast({
          title: "Error",
          description: "Failed to save canvas drawing",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Canvas drawing saved successfully",
      });

      // Update local state
      setDrawings(prev => {
        const existing = prev.find(d => d.location_id === drawingData.location_id && d.floor_number === drawingData.floor_number);
        if (existing) {
          return prev.map(d => d.id === existing.id ? data : d);
        } else {
          return [...prev, data];
        }
      });

      return data;
    } catch (error) {
      console.error("Error saving canvas drawing:", error);
      toast({
        title: "Error",
        description: "Failed to save canvas drawing",
        variant: "destructive",
      });
      return null;
    }
  };

  const getDrawingForFloor = (floorNumber: number): CanvasDrawing | null => {
    return drawings.find(d => d.floor_number === floorNumber) || null;
  };

  const deleteDrawing = async (id: string) => {
    try {
      const { error } = await supabase
        .from("canvas_drawings")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting canvas drawing:", error);
        toast({
          title: "Error",
          description: "Failed to delete canvas drawing",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Canvas drawing deleted successfully",
      });

      // Update local state
      setDrawings(prev => prev.filter(d => d.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting canvas drawing:", error);
      toast({
        title: "Error",
        description: "Failed to delete canvas drawing",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchDrawings();
  }, [locationId]);

  return {
    drawings,
    loading,
    saveDrawing,
    getDrawingForFloor,
    deleteDrawing,
    refetch: fetchDrawings,
  };
}