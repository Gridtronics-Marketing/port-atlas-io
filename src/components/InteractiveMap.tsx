import { useState } from "react";
import { MapPin, Plus, Zap, Shield, Wifi, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DropPoint {
  id: number;
  x: number;
  y: number;
  type: "data" | "fiber" | "security";
  label: string;
  room: string;
  status: "planned" | "installed" | "tested";
}

interface InteractiveMapProps {
  locationId: string;
  floors?: number;
  currentFloor?: number;
  backgroundImage?: string;
}

// Mock drop points for demonstration
const mockDropPoints: DropPoint[] = [
  { id: 1, x: 20, y: 30, type: "data", label: "DP-001", room: "Reception", status: "tested" },
  { id: 2, x: 45, y: 25, type: "fiber", label: "FP-001", room: "Server Room", status: "installed" },
  { id: 3, x: 70, y: 40, type: "security", label: "SP-001", room: "Entrance", status: "tested" },
  { id: 4, x: 35, y: 60, type: "data", label: "DP-002", room: "Office A", status: "planned" },
  { id: 5, x: 65, y: 70, type: "data", label: "DP-003", room: "Conference", status: "installed" },
];

export const InteractiveMap = ({ locationId, floors = 1, currentFloor = 1, backgroundImage }: InteractiveMapProps) => {
  const [dropPoints, setDropPoints] = useState<DropPoint[]>(mockDropPoints);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [isAddingPoint, setIsAddingPoint] = useState(false);

  const getDropPointIcon = (type: string) => {
    switch (type) {
      case "data":
        return Zap;
      case "fiber":
        return Wifi;
      case "security":
        return Shield;
      default:
        return MapPin;
    }
  };

  const getDropPointColor = (status: string) => {
    switch (status) {
      case "tested":
        return "text-success bg-success/10 border-success/20";
      case "installed":
        return "text-warning bg-warning/10 border-warning/20";
      case "planned":
        return "text-muted-foreground bg-muted border-border";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPoint) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint: DropPoint = {
      id: dropPoints.length + 1,
      x,
      y,
      type: "data",
      label: `DP-${(dropPoints.length + 1).toString().padStart(3, "0")}`,
      room: "New Room",
      status: "planned",
    };

    setDropPoints([...dropPoints, newPoint]);
    setIsAddingPoint(false);
    setSelectedPoint(newPoint);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {floors > 1 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Floor {currentFloor}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Data: {dropPoints.filter(p => p.type === "data").length}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            Fiber: {dropPoints.filter(p => p.type === "fiber").length}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Security: {dropPoints.filter(p => p.type === "security").length}
          </Badge>
        </div>
        
        <Button
          variant={isAddingPoint ? "default" : "outline"}
          onClick={() => setIsAddingPoint(!isAddingPoint)}
          className={isAddingPoint ? "bg-gradient-primary" : ""}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isAddingPoint ? "Click to Place" : "Add Drop Point"}
        </Button>
      </div>

      {/* Interactive Map */}
      <div
        className={`relative w-full aspect-[4/3] bg-gradient-secondary border-2 border-border rounded-lg overflow-hidden ${
          isAddingPoint ? "cursor-crosshair" : "cursor-default"
        }`}
        onClick={handleMapClick}
      >
        {/* Background Grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        
        {/* Layout placeholder - would show actual floor plan */}
        {backgroundImage ? (
          <img 
            src={backgroundImage} 
            alt={`Floor ${currentFloor} plan`}
            className="absolute inset-0 w-full h-full object-contain opacity-80"
          />
        ) : (
          <div className="absolute inset-4 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">
                {floors > 1 ? `Floor ${currentFloor} Plan` : 'Interactive Floor Plan'}
              </p>
              <p className="text-xs">Upload floor plan images to see actual building structure</p>
              <p className="text-xs mt-1">Click "Edit Mode" above to use the floor plan editor</p>
            </div>
          </div>
        )}

        {/* Drop Points */}
        <TooltipProvider>
          {dropPoints.map((point) => {
            const IconComponent = getDropPointIcon(point.type);
            return (
              <Tooltip key={point.id}>
                <TooltipTrigger asChild>
                  <button
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${getDropPointColor(point.status)}`}
                    style={{
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPoint(point);
                    }}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover border">
                  <div className="text-sm">
                    <p className="font-medium">{point.label}</p>
                    <p className="text-muted-foreground">{point.room}</p>
                    <p className="text-xs capitalize">{point.type} • {point.status}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* Add point indicator */}
        {isAddingPoint && (
          <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium">
            Click anywhere on the map to add a drop point
          </div>
        )}
      </div>

      {/* Selected Point Details */}
      {selectedPoint && (
        <div className="p-4 border border-border rounded-lg bg-card">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-foreground">{selectedPoint.label}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedPoint.room} • {selectedPoint.type.charAt(0).toUpperCase() + selectedPoint.type.slice(1)}
              </p>
              <Badge className={getDropPointColor(selectedPoint.status)} variant="outline">
                {selectedPoint.status.charAt(0).toUpperCase() + selectedPoint.status.slice(1)}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                View Photos
              </Button>
              <Button variant="outline" size="sm">
                Test Results
              </Button>
              <Button size="sm" className="bg-gradient-primary hover:bg-primary-hover">
                Edit Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};