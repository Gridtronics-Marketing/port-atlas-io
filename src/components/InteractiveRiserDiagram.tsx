import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Network, Zap, Cable, Router, Box, AlertTriangle } from 'lucide-react';
import { useBackboneCables } from '@/hooks/useBackboneCables';
import { useDistributionFrames } from '@/hooks/useDistributionFrames';
import { useRiserPathways } from '@/hooks/useRiserPathways';
import { useJunctionBoxes } from '@/hooks/useJunctionBoxes';
import { useCableConnections } from '@/hooks/useCableConnections';

interface InteractiveRiserDiagramProps {
  locationId: string;
  locationName: string;
  onAddEquipment?: () => void;
  onAddCable?: () => void;
}

export const InteractiveRiserDiagram: React.FC<InteractiveRiserDiagramProps> = ({
  locationId,
  locationName,
  onAddEquipment,
  onAddCable
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFrame, setDraggedFrame] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const { cables } = useBackboneCables(locationId);
  const { frames, updateFrame } = useDistributionFrames(locationId);
  const { pathways } = useRiserPathways(locationId);
  const { connections } = useCableConnections(locationId);

  // Calculate diagram dimensions and layout
  const floors = Array.from(
    new Set([
      ...frames.map(f => f.floor),
      ...cables.flatMap(c => [c.origin_floor, c.destination_floor].filter(Boolean)),
      ...pathways.flatMap(p => p.floors_served)
    ])
  ).sort((a, b) => (b || 0) - (a || 0));

  const diagramWidth = 800;
  const diagramHeight = Math.max(600, floors.length * 120 + 100);
  const floorHeight = 100;
  const equipmentWidth = 60;
  const pathwayWidth = 20;

  // Get equipment icon
  const getEquipmentIcon = (frame: any) => {
    if (frame.frame_type === 'MDF') return '🏢'; // Building symbol for MDF
    return '🔧'; // Tool symbol for IDF
  };

  // Get cable color based on type
  const getCableColor = (type: string) => {
    switch (type) {
      case 'fiber': return '#3b82f6'; // blue
      case 'copper': return '#f97316'; // orange
      case 'coax': return '#10b981'; // green
      default: return '#6b7280'; // gray
    }
  };

  // Calculate equipment positions
  const getEquipmentPosition = (frame: any, floor: number, index: number) => {
    // Use stored coordinates if available, otherwise calculate based on index
    if (frame.x_coordinate !== null && frame.y_coordinate !== null) {
      // Convert percentage coordinates to SVG coordinates
      return {
        x: (frame.x_coordinate / 100) * diagramWidth,
        y: (frame.y_coordinate / 100) * diagramHeight
      };
    }
    
    // Fallback to calculated position
    const floorIndex = floors.indexOf(floor);
    const y = 50 + floorIndex * floorHeight + 30;
    const x = 100 + index * (equipmentWidth + 20);
    return { x, y };
  };

  // Calculate pathway positions
  const getPathwayPosition = (pathwayIndex: number) => {
    const x = 50 + pathwayIndex * (pathwayWidth + 10);
    return { x, y: 50, height: diagramHeight - 100 };
  };

  const filteredFrames = selectedFloor === 'all' 
    ? frames 
    : frames.filter(f => f.floor === parseInt(selectedFloor));

  const filteredCables = selectedFloor === 'all'
    ? cables
    : cables.filter(c => 
        c.origin_floor === parseInt(selectedFloor) || 
        c.destination_floor === parseInt(selectedFloor)
      );

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent, frame: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    const svgElement = svgRef.current;
    if (!svgElement) return;
    
    const rect = svgElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const floorFrames = frames.filter(f => f.floor === frame.floor);
    const frameIndex = floorFrames.indexOf(frame);
    const { x, y } = getEquipmentPosition(frame, frame.floor, frameIndex);
    
    setIsDragging(true);
    setDraggedFrame(frame.id);
    setDragOffset({
      x: mouseX - x,
      y: mouseY - y
    });
    
    // Prevent text selection
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedFrame) return;
    
    const svgElement = svgRef.current;
    if (!svgElement) return;
    
    const rect = svgElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to percentage coordinates for storage
    const x = Math.max(0, Math.min(100, ((mouseX - dragOffset.x) / diagramWidth) * 100));
    const y = Math.max(0, Math.min(100, ((mouseY - dragOffset.y) / diagramHeight) * 100));
    
    // Update frame position temporarily (this will be saved on mouse up)
    const frameToUpdate = frames.find(f => f.id === draggedFrame);
    if (frameToUpdate) {
      frameToUpdate.x_coordinate = x;
      frameToUpdate.y_coordinate = y;
    }
  };

  const handleMouseUp = async () => {
    if (!isDragging || !draggedFrame) return;
    
    const frameToUpdate = frames.find(f => f.id === draggedFrame);
    if (frameToUpdate && frameToUpdate.x_coordinate !== null && frameToUpdate.y_coordinate !== null) {
      try {
        await updateFrame(draggedFrame, {
          x_coordinate: frameToUpdate.x_coordinate,
          y_coordinate: frameToUpdate.y_coordinate
        });
      } catch (error) {
        console.error('Failed to update frame position:', error);
      }
    }
    
    setIsDragging(false);
    setDraggedFrame(null);
    setDragOffset({ x: 0, y: 0 });
    
    // Re-enable text selection
    document.body.style.userSelect = '';
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => handleMouseUp();
      
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors.map(floor => (
                <SelectItem key={floor} value={floor.toString()}>
                  Floor {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={onAddEquipment}>Add Equipment</Button>
            <Button size="sm" variant="outline" onClick={onAddCable}>Add Cable</Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Fiber</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-warning rounded-full"></div>
            <span>Copper</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span>Coax</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Diagram */}
      <Card>
        <CardContent className="p-4">
          <div className="border rounded-lg bg-background overflow-auto">
            <svg
              ref={svgRef}
              width={diagramWidth}
              height={diagramHeight}
              className="bg-background"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path 
                    d="M 20 0 L 0 0 0 20" 
                    fill="none" 
                    stroke="hsl(var(--border))" 
                    strokeWidth="0.5" 
                    opacity="0.3"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Floor lines */}
              {floors.map((floor, index) => {
                const y = 50 + index * floorHeight;
                return (
                  <g key={floor}>
                    <line
                      x1={80}
                      y1={y}
                      x2={diagramWidth - 50}
                      y2={y}
                      stroke="hsl(var(--border))"
                      strokeWidth="2"
                    />
                    <text
                      x={20}
                      y={y - 5}
                      fontSize="12"
                      fill="hsl(var(--foreground))"
                      fontWeight="500"
                    >
                      Floor {floor}
                    </text>
                  </g>
                );
              })}

              {/* Riser pathways */}
              {pathways.map((pathway, index) => {
                const { x, y, height } = getPathwayPosition(index);
                const utilizationColor = pathway.utilization_percentage > 80 
                  ? 'hsl(var(--destructive))'
                  : pathway.utilization_percentage > 60 
                  ? 'hsl(var(--warning))'
                  : 'hsl(var(--success))';

                return (
                  <g key={pathway.id}>
                    <rect
                      x={x}
                      y={y}
                      width={pathwayWidth}
                      height={height}
                      fill={utilizationColor}
                      fillOpacity="0.3"
                      stroke={utilizationColor}
                      strokeWidth="2"
                      rx="4"
                      className="cursor-pointer hover:fill-opacity-50"
                      onClick={() => setShowDetails(pathway.id)}
                    />
                    <text
                      x={x + pathwayWidth / 2}
                      y={y - 10}
                      fontSize="10"
                      fill="hsl(var(--foreground))"
                      textAnchor="middle"
                    >
                      {pathway.pathway_name}
                    </text>
                  </g>
                );
              })}

              {/* Distribution frames */}
              {filteredFrames.map((frame, index) => {
                const floorFrames = frames.filter(f => f.floor === frame.floor);
                const frameIndex = floorFrames.indexOf(frame);
                const { x, y } = getEquipmentPosition(frame, frame.floor, frameIndex);
                const isBeingDragged = frame.id === draggedFrame;
                
                return (
                  <g key={frame.id}>
                    <rect
                      x={x}
                      y={y}
                      width={equipmentWidth}
                      height="40"
                      fill={frame.frame_type === 'MDF' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                      rx="4"
                      className={`cursor-move hover:stroke-primary ${isBeingDragged ? 'opacity-80' : ''}`}
                      style={{ cursor: isBeingDragged ? 'grabbing' : 'grab' }}
                      onClick={() => setShowDetails(frame.id)}
                      onMouseDown={(e) => handleMouseDown(e, frame)}
                    />
                    <text
                      x={x + equipmentWidth / 2}
                      y={y + 20}
                      fontSize="10"
                      fill={frame.frame_type === 'MDF' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))'}
                      textAnchor="middle"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {frame.frame_type}
                    </text>
                    <text
                      x={x + equipmentWidth / 2}
                      y={y + 32}
                      fontSize="8"
                      fill={frame.frame_type === 'MDF' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))'}
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {frame.port_count}p
                    </text>
                  </g>
                );
              })}

              {/* Backbone cables */}
              {filteredCables.map((cable) => {
                const originFrames = frames.filter(f => f.floor === cable.origin_floor);
                const destFrames = frames.filter(f => f.floor === cable.destination_floor);
                
                if (originFrames.length === 0 || destFrames.length === 0) return null;

                const originFrame = originFrames[0];
                const destFrame = destFrames[0];
                
                const originPos = getEquipmentPosition(originFrame, cable.origin_floor!, 
                  frames.filter(f => f.floor === cable.origin_floor).indexOf(originFrame));
                const destPos = getEquipmentPosition(destFrame, cable.destination_floor!, 
                  frames.filter(f => f.floor === cable.destination_floor).indexOf(destFrame));

                const cableColor = getCableColor(cable.cable_type);
                const utilization = cable.capacity_total 
                  ? (cable.capacity_used / cable.capacity_total) * 100 
                  : 0;

                return (
                  <g key={cable.id}>
                    <line
                      x1={originPos.x + equipmentWidth / 2}
                      y1={originPos.y + 40}
                      x2={destPos.x + equipmentWidth / 2}
                      y2={destPos.y}
                      stroke={cableColor}
                      strokeWidth="3"
                      className="cursor-pointer hover:stroke-opacity-80"
                      onClick={() => setShowDetails(cable.id)}
                    />
                    {/* Cable label */}
                    <text
                      x={(originPos.x + destPos.x) / 2 + equipmentWidth / 2}
                      y={(originPos.y + destPos.y) / 2 + 20}
                      fontSize="9"
                      fill="hsl(var(--foreground))"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {cable.cable_label}
                    </text>
                    {utilization > 0 && (
                      <text
                        x={(originPos.x + destPos.x) / 2 + equipmentWidth / 2}
                        y={(originPos.y + destPos.y) / 2 + 32}
                        fontSize="8"
                        fill="hsl(var(--muted-foreground))"
                        textAnchor="middle"
                        className="pointer-events-none"
                      >
                        {utilization.toFixed(0)}% used
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Details panel */}
          {showDetails && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Equipment Details</h4>
                <Button size="sm" variant="ghost" onClick={() => setShowDetails(null)}>
                  ×
                </Button>
              </div>
              {/* Add details content based on showDetails ID */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Total Equipment</div>
                <div className="text-lg font-semibold">{frames.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cable className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Cable Runs</div>
                <div className="text-lg font-semibold">{cables.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Pathways</div>
                <div className="text-lg font-semibold">{pathways.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};