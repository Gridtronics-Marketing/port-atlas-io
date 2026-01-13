import { useState, useEffect } from "react";
import { FileImage, Layers } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface FloorPlan {
  id: string;
  file_url: string;
  file_name: string;
  floor_number: number;
}

interface DropPoint {
  id: string;
  label: string | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
  status: string | null;
  point_type: string | null;
}

interface ClientFloorPlanViewerProps {
  locationId: string;
}

export const ClientFloorPlanViewer = ({ locationId }: ClientFloorPlanViewerProps) => {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [dropPoints, setDropPoints] = useState<DropPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch floor plans
        const { data: fpData } = await supabase
          .from("floor_plan_files")
          .select("id, file_url, file_name, floor_number")
          .eq("location_id", locationId)
          .order("floor_number") as { data: FloorPlan[] | null };

        if (fpData && fpData.length > 0) {
          setFloorPlans(fpData);
          setSelectedFloor(fpData[0].floor_number);
        }

        // Fetch drop points
        const { data: dpData } = await supabase
          .from("drop_points")
          .select("id, label, x_coordinate, y_coordinate, status, point_type")
          .eq("location_id", locationId);

        setDropPoints(dpData || []);
      } catch (error) {
        console.error("Error fetching floor plan data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationId]);

  const currentFloorPlan = floorPlans.find(fp => fp.floor_number === selectedFloor);
  const currentDropPoints = dropPoints.filter(dp => dp.x_coordinate && dp.y_coordinate);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Active":
      case "Installed":
        return "bg-green-500";
      case "Pending":
        return "bg-yellow-500";
      case "Issue":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="animate-pulse">Loading floor plan...</div>
      </div>
    );
  }

  if (floorPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileImage className="h-12 w-12 mb-4 opacity-50" />
        <p>No floor plans available for this location</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Floor selector */}
      {floorPlans.length > 1 && (
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedFloor.toString()}
            onValueChange={(v) => setSelectedFloor(parseInt(v))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
              {floorPlans.map((fp) => (
                <SelectItem key={fp.id} value={fp.floor_number.toString()}>
                  Floor {fp.floor_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Floor plan with overlays */}
      <div className="relative border rounded-lg overflow-hidden bg-muted/20">
        {currentFloorPlan ? (
          <>
            <img
              src={currentFloorPlan.file_url}
              alt={`Floor ${selectedFloor} plan`}
              className="w-full h-auto"
            />
            {/* Drop point overlays */}
            {currentDropPoints.map((dp) => (
              <div
                key={dp.id}
                className={`absolute w-4 h-4 rounded-full ${getStatusColor(dp.status)} border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform`}
                style={{
                  left: `${dp.x_coordinate}%`,
                  top: `${dp.y_coordinate}%`,
                  transform: "translate(-50%, -50%)",
                }}
                title={`${dp.label || "Drop Point"} - ${dp.point_type || "Unknown"}`}
              />
            ))}
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No floor plan for floor {selectedFloor}</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Active/Installed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Issue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Other</span>
        </div>
      </div>
    </div>
  );
};
