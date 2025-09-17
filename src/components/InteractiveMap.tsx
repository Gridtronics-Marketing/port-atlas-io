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
import { useDropPoints, type DropPoint as DBDropPoint } from "@/hooks/useDropPoints";

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

export const InteractiveMap = ({ locationId, floors = 1, currentFloor = 1, backgroundImage }: InteractiveMapProps) => {
  const { dropPoints: dbDropPoints } = useDropPoints(locationId);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  
  // Convert database drop points to display format
  const dropPoints: DropPoint[] = dbDropPoints
    .filter(dp => !dp.floor || dp.floor === currentFloor)
    .map(dp => ({
      id: parseInt(dp.id) || 0,
      x: dp.x_coordinate || 0,
      y: dp.y_coordinate || 0,
      type: dp.point_type as "data" | "fiber" | "security",
      label: dp.label,
      room: dp.room || "Unknown",
      status: dp.status as "planned" | "installed" | "tested"
    }));

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

    // For now, just show a placeholder - in a real app, this would open a modal to add a drop point
    console.log(`Would add drop point at ${x.toFixed(1)}%, ${y.toFixed(1)}%`);
    setIsAddingPoint(false);
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