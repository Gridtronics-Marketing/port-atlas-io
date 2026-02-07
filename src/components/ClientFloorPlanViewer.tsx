import { useState, useEffect, useCallback } from "react";
import { FileImage, Layers, Camera, Plus, MousePointer2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ClientDropPointDetail } from "@/components/ClientDropPointDetail";
import { ClientDropPointPlacementDialog } from "@/components/ClientDropPointPlacementDialog";

interface DropPoint {
  id: string;
  label: string | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
  status: string | null;
  point_type: string | null;
  floor: number | null;
  room: string | null;
  notes: string | null;
  installed_date: string | null;
  tested_date: string | null;
  test_results: any;
}

interface RoomViewMarker {
  id: string;
  room_name: string | null;
  x_coordinate: number;
  y_coordinate: number;
  floor: number;
  photo_url?: string;
  description?: string | null;
}

interface ClientFloorPlanViewerProps {
  locationId: string;
}

export const ClientFloorPlanViewer = ({ locationId }: ClientFloorPlanViewerProps) => {
  const [floorPlanUrls, setFloorPlanUrls] = useState<Record<number, string>>({});
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [dropPoints, setDropPoints] = useState<DropPoint[]>([]);
  const [roomViewMarkers, setRoomViewMarkers] = useState<RoomViewMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [floors, setFloors] = useState<number[]>([]);
  
  // Interactive state
  const [selectedDropPoint, setSelectedDropPoint] = useState<DropPoint | null>(null);
  const [selectedRoomView, setSelectedRoomView] = useState<RoomViewMarker | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const [placementCoords, setPlacementCoords] = useState<{ x: number; y: number } | null>(null);

  const fetchData = useCallback(async () => {
    try {
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
            urls[floorNum] = `https://mhrekppksiekhstnteyu.supabase.co/storage/v1/object/public/floor-plans/${filePath}`;
          }
        }
        
        floorNumbers.sort((a, b) => a - b);
        setFloors(floorNumbers);
        setFloorPlanUrls(urls);
        if (floorNumbers.length > 0) setSelectedFloor(floorNumbers[0]);
      }

      const { data: dpData } = await supabase
        .from("drop_points")
        .select("id, label, x_coordinate, y_coordinate, status, point_type, floor, room, notes, installed_date, tested_date, test_results")
        .eq("location_id", locationId);
      setDropPoints(dpData || []);

      const { data: rvData } = await supabase
        .from("room_views")
        .select("id, room_name, x_coordinate, y_coordinate, floor, photo_url, description")
        .eq("location_id", locationId);
      setRoomViewMarkers(rvData || []);
    } catch (error) {
      console.error("Error fetching floor plan data:", error);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentFloorPlanUrl = floorPlanUrls[selectedFloor];
  const currentDropPoints = dropPoints.filter(
    dp => dp.x_coordinate && dp.y_coordinate && dp.floor === selectedFloor
  );
  const currentRoomViews = roomViewMarkers.filter(
    rv => rv.x_coordinate && rv.y_coordinate && rv.floor === selectedFloor
  );

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Planned": return "bg-red-500";
      case "Roughed In": return "bg-yellow-500";
      case "Finished": return "bg-green-500";
      case "Tested": return "bg-green-500";
      case "Proposed": return "bg-gray-400";
      case "Active":
      case "Installed": return "bg-green-500";
      case "Pending": return "bg-yellow-500";
      case "Issue": return "bg-red-500";
      default: return "bg-blue-500";
    }
  };

  const handleFloorPlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placementMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPlacementCoords({ x, y });
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
      {/* Controls row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {floors.length > 1 && (
            <>
              <Layers className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedFloor.toString()}
                onValueChange={(v) => setSelectedFloor(parseInt(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((floor) => (
                    <SelectItem key={floor} value={floor.toString()}>Floor {floor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <Button
          variant={placementMode ? "default" : "outline"}
          size="sm"
          onClick={() => setPlacementMode(!placementMode)}
        >
          {placementMode ? (
            <><MousePointer2 className="h-4 w-4 mr-1" />Click to Place</>
          ) : (
            <><Plus className="h-4 w-4 mr-1" />Place New Drop Point</>
          )}
        </Button>
      </div>

      {placementMode && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          Click on the floor plan to place a proposed drop point. It will appear as a grey marker until approved.
        </div>
      )}

      {/* Floor plan with overlays */}
      <TooltipProvider>
        <div
          className={`relative border rounded-lg overflow-hidden bg-muted/20 ${placementMode ? 'cursor-crosshair' : ''}`}
          onClick={handleFloorPlanClick}
        >
          {currentFloorPlanUrl ? (
            <>
              <img
                src={currentFloorPlanUrl}
                alt={`Floor ${selectedFloor} plan`}
                className="w-full h-auto"
              />
              {/* Drop point overlays */}
              {currentDropPoints.map((dp) => (
                <Tooltip key={dp.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute w-4 h-4 rounded-full ${getStatusColor(dp.status)} border-2 border-white shadow-md cursor-pointer hover:scale-150 transition-transform z-10`}
                      style={{
                        left: `${dp.x_coordinate}%`,
                        top: `${dp.y_coordinate}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!placementMode) setSelectedDropPoint(dp);
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{dp.label || "Drop Point"}</p>
                    <p className="text-xs">{dp.point_type || "Unknown"} • {dp.status || "Unknown"}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {/* Room view markers */}
              {currentRoomViews.map((rv) => (
                <Tooltip key={rv.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow-md cursor-pointer hover:scale-150 transition-transform flex items-center justify-center z-10"
                      style={{
                        left: `${rv.x_coordinate}%`,
                        top: `${rv.y_coordinate}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!placementMode) setSelectedRoomView(rv);
                      }}
                    >
                      <Camera className="h-3 w-3 text-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{rv.room_name || "Room View"}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No floor plan for floor {selectedFloor}</p>
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Roughed In</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Finished/Tested</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span>Proposed (Pending Approval)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center">
            <Camera className="h-2 w-2 text-white" />
          </div>
          <span>Room View</span>
        </div>
      </div>

      {/* Drop Point Detail Modal */}
      <ClientDropPointDetail
        dropPoint={selectedDropPoint}
        open={!!selectedDropPoint}
        onClose={() => setSelectedDropPoint(null)}
      />

      {/* Room View Detail Dialog */}
      {selectedRoomView && (
        <RoomViewDetailDialog
          roomView={selectedRoomView}
          open={!!selectedRoomView}
          onClose={() => setSelectedRoomView(null)}
        />
      )}

      {/* Drop Point Placement Dialog */}
      <ClientDropPointPlacementDialog
        open={!!placementCoords}
        onClose={() => {
          setPlacementCoords(null);
          setPlacementMode(false);
        }}
        locationId={locationId}
        floor={selectedFloor}
        coordinates={placementCoords}
        onSuccess={() => {
          setPlacementCoords(null);
          setPlacementMode(false);
          fetchData();
        }}
      />
    </div>
  );
};

// ─── Room View Detail Dialog (inline) ───
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const RoomViewDetailDialog = ({
  roomView,
  open,
  onClose,
}: {
  roomView: RoomViewMarker;
  open: boolean;
  onClose: () => void;
}) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>{roomView.room_name || "Room View"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {roomView.photo_url && (
          <img
            src={roomView.photo_url}
            alt={roomView.room_name || "Room view"}
            className="w-full rounded-lg"
          />
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Floor</p>
            <p className="font-medium">{roomView.floor}</p>
          </div>
          {roomView.description && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Description</p>
              <p className="font-medium">{roomView.description}</p>
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
