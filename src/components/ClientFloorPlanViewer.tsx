import { useState, useEffect } from "react";
import { FileImage, Layers } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface DropPoint {
  id: string;
  label: string | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
  status: string | null;
  point_type: string | null;
  floor: number | null;
}

interface ClientFloorPlanViewerProps {
  locationId: string;
}

export const ClientFloorPlanViewer = ({ locationId }: ClientFloorPlanViewerProps) => {
  const [floorPlanUrls, setFloorPlanUrls] = useState<Record<number, string>>({});
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [dropPoints, setDropPoints] = useState<DropPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [floors, setFloors] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch location with floor_plan_files
        const { data: locationData } = await supabase
          .from("locations")
          .select("floor_plan_files, floors")
          .eq("id", locationId)
          .single();

        if (locationData?.floor_plan_files) {
          const floorPlanFiles = locationData.floor_plan_files as Record<string, string>;
          const urls: Record<number, string> = {};
          const floorNumbers: number[] = [];
          
          for (const [floor, filePath] of Object.entries(floorPlanFiles)) {
            const floorNum = parseInt(floor, 10);
            if (!isNaN(floorNum)) {
              floorNumbers.push(floorNum);
              // Generate public URL for the floor plan
              urls[floorNum] = `https://mhrekppksiekhstnteyu.supabase.co/storage/v1/object/public/floor-plans/${filePath}`;
            }
          }
          
          floorNumbers.sort((a, b) => a - b);
          setFloors(floorNumbers);
          setFloorPlanUrls(urls);
          if (floorNumbers.length > 0) {
            setSelectedFloor(floorNumbers[0]);
          }
        }

        // Fetch drop points
        const { data: dpData } = await supabase
          .from("drop_points")
          .select("id, label, x_coordinate, y_coordinate, status, point_type, floor")
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

  const currentFloorPlanUrl = floorPlanUrls[selectedFloor];
  const currentDropPoints = dropPoints.filter(
    dp => dp.x_coordinate && dp.y_coordinate && dp.floor === selectedFloor
  );

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

  if (floors.length === 0) {
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
      {floors.length > 1 && (
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
              {floors.map((floor) => (
                <SelectItem key={floor} value={floor.toString()}>
                  Floor {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Floor plan with overlays */}
      <div className="relative border rounded-lg overflow-hidden bg-muted/20">
        {currentFloorPlanUrl ? (
          <>
            <img
              src={currentFloorPlanUrl}
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
