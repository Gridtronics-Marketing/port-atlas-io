import { useState, useRef, useEffect } from 'react';
import { Plus, Minus, RotateCcw, ZoomIn, ZoomOut, RefreshCw, Camera, Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AddDropPointModal } from './AddDropPointModal';
import { DropPointDetailsModal } from './DropPointDetailsModal';
import { AddRoomViewModal } from './AddRoomViewModal';
import { RoomViewModal } from './RoomViewModal';
import { FloorPlanDrawingToolbar, type DrawingTool } from './FloorPlanDrawingToolbar';
import { FloorPlanDrawingCanvas, type DrawingCanvasRef } from './FloorPlanDrawingCanvas';
import { useDropPoints } from '@/hooks/useDropPoints';
import { useRoomViews } from '@/hooks/useRoomViews';
import { getStorageUrl, repairFloorPlanFiles } from '@/lib/storage-utils';
import { useToast } from '@/hooks/use-toast';

interface InteractiveFloorPlanProps {
  locationId: string;
  floorNumber: number;
  fileUrl?: string;
  filePath?: string; // Raw storage path
  fileName?: string;
  className?: string;
}

export const InteractiveFloorPlan = ({
  locationId,
  floorNumber,
  fileUrl,
  filePath,
  fileName,
  className = ""
}: InteractiveFloorPlanProps) => {
  const [scale, setScale] = useState(1.0);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [isAddingRoomView, setIsAddingRoomView] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddRoomViewModal, setShowAddRoomViewModal] = useState(false);
  const [clickCoordinates, setClickCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [selectedDropPoint, setSelectedDropPoint] = useState<any>(null);
  const [selectedRoomView, setSelectedRoomView] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [roomViewModalOpen, setRoomViewModalOpen] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState<any>(null);
  const [draggedRoomView, setDraggedRoomView] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 });
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [drawingData, setDrawingData] = useState<string>('');
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
  const { toast } = useToast();
  
  const { dropPoints, loading: dropPointsLoading, updateDropPoint } = useDropPoints(locationId);
  const { roomViews, loading: roomViewsLoading, updateRoomView } = useRoomViews(locationId);
  
  // Generate the actual file URL from path or use provided URL
  const actualFileUrl = fileUrl || (filePath ? getStorageUrl('floor-plans', filePath) : undefined);

  // Filter drop points and room views for current floor
  const floorDropPoints = dropPoints.filter(dp => dp.floor === floorNumber);
  const floorRoomViews = roomViews.filter(rv => rv.floor === floorNumber);

  const getFileExtension = (url?: string, path?: string, name?: string) => {
    if (!url && !path && !name) return '';
    const source = name || path || url || '';
    return source.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(actualFileUrl, filePath, fileName);
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp', 'tiff'].includes(fileExtension);

  // Update container dimensions for drawing canvas
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setContainerDimensions({ width: rect.width, height: rect.height });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [actualFileUrl]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isDrawingMode) return; // Don't handle clicks in drawing mode
    if ((!isAddingPoint && !isAddingRoomView) || !containerRef.current || isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickCoordinates({ x, y });
    
    if (isAddingPoint) {
      setShowAddModal(true);
      setIsAddingPoint(false);
    } else if (isAddingRoomView) {
      setShowAddRoomViewModal(true);
      setIsAddingRoomView(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, item: any, type: 'dropPoint' | 'roomView') => {
    e.stopPropagation();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pointX = (item.x_coordinate / 100) * rect.width;
    const pointY = (item.y_coordinate / 100) * rect.height;
    
    if (type === 'dropPoint') {
      setDraggedPoint(item);
      setDraggedRoomView(null);
    } else {
      setDraggedRoomView(item);
      setDraggedPoint(null);
    }
    
    setIsMouseDown(true);
    setMouseDownPosition({ x: e.clientX, y: e.clientY });
    setDragOffset({
      x: e.clientX - rect.left - pointX,
      y: e.clientY - rect.top - pointY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !draggedPoint || !containerRef.current) return;

    // Calculate distance moved from initial mouse down position
    const distanceMoved = Math.sqrt(
      Math.pow(e.clientX - mouseDownPosition.x, 2) + 
      Math.pow(e.clientY - mouseDownPosition.y, 2)
    );

    // Only start dragging if mouse has moved more than 5 pixels
    if (!isDragging && distanceMoved > 5) {
      setIsDragging(true);
    }

    if (!isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

    // Constrain to container bounds
    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));

    // Update the dragged item's position temporarily
    if (draggedPoint) {
      setDraggedPoint(prev => ({
        ...prev,
        x_coordinate: constrainedX,
        y_coordinate: constrainedY
      }));
    } else if (draggedRoomView) {
      setDraggedRoomView(prev => ({
        ...prev,
        x_coordinate: constrainedX,
        y_coordinate: constrainedY
      }));
    }
  };

  const handleMouseUp = async () => {
    if (!isMouseDown) return;

    // If we were dragging, save the position
    if (isDragging && draggedPoint) {
      try {
        await updateDropPoint(draggedPoint.id, {
          x_coordinate: draggedPoint.x_coordinate,
          y_coordinate: draggedPoint.y_coordinate
        });
        toast({
          title: "Drop Point Moved",
          description: `${draggedPoint.label} has been repositioned.`,
        });
      } catch (error) {
        console.error('Error updating drop point position:', error);
        toast({
          title: "Error",
          description: "Failed to update drop point position.",
          variant: "destructive",
        });
      }
    } else if (isDragging && draggedRoomView) {
      try {
        await updateRoomView(draggedRoomView.id, {
          x_coordinate: draggedRoomView.x_coordinate,
          y_coordinate: draggedRoomView.y_coordinate
        });
        toast({
          title: "Room View Moved",
          description: `${draggedRoomView.room_name || 'Room view'} has been repositioned.`,
        });
      } catch (error) {
        console.error('Error updating room view position:', error);
        toast({
          title: "Error",
          description: "Failed to update room view position.",
          variant: "destructive",
        });
      }
    }

    setIsMouseDown(false);
    setIsDragging(false);
    setDraggedPoint(null);
    setDraggedRoomView(null);
    setDragOffset({ x: 0, y: 0 });
    setMouseDownPosition({ x: 0, y: 0 });
  };

  // Add mouse event listeners to handle dragging outside the container
  useEffect(() => {
    if (isMouseDown) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!containerRef.current || !draggedPoint) return;
        
        // Calculate distance moved from initial mouse down position
        const distanceMoved = Math.sqrt(
          Math.pow(e.clientX - mouseDownPosition.x, 2) + 
          Math.pow(e.clientY - mouseDownPosition.y, 2)
        );

        // Only start dragging if mouse has moved more than 5 pixels
        if (!isDragging && distanceMoved > 5) {
          setIsDragging(true);
        }

        if (!isDragging) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
        const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

        const constrainedX = Math.max(0, Math.min(100, x));
        const constrainedY = Math.max(0, Math.min(100, y));

        if (draggedPoint) {
          setDraggedPoint(prev => ({
            ...prev,
            x_coordinate: constrainedX,
            y_coordinate: constrainedY
          }));
        } else if (draggedRoomView) {
          setDraggedRoomView(prev => ({
            ...prev,
            x_coordinate: constrainedX,
            y_coordinate: constrainedY
          }));
        }
      };

      const handleGlobalMouseUp = () => {
        handleMouseUp();
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isMouseDown, isDragging, draggedPoint, draggedRoomView, dragOffset, mouseDownPosition]);

  const adjustScale = (increment: boolean) => {
    setScale(prev => {
      const newScale = increment ? prev + 0.2 : prev - 0.2;
      return Math.max(0.5, Math.min(3.0, newScale));
    });
  };

  const resetScale = () => setScale(1.0);

  // Drawing functions
  const handleDrawingToolChange = (tool: DrawingTool) => {
    setActiveTool(tool);
    setIsDrawingMode(tool !== 'select');
    
    // When switching to select mode, reset adding states
    if (tool === 'select') {
      setIsAddingPoint(false);
      setIsAddingRoomView(false);
    }
  };

  const handleDrawingHistoryChange = (canUndoValue: boolean, canRedoValue: boolean) => {
    setCanUndo(canUndoValue);
    setCanRedo(canRedoValue);
  };

  const handleDrawingSave = (data: string) => {
    setDrawingData(data);
    // Here you could save to Supabase or local storage
    localStorage.setItem(`floor-plan-drawing-${locationId}-${floorNumber}`, data);
  };

  const handleDrawingLoad = () => {
    const savedData = localStorage.getItem(`floor-plan-drawing-${locationId}-${floorNumber}`);
    if (savedData && drawingCanvasRef.current?.drawingActions) {
      drawingCanvasRef.current.drawingActions.load(savedData);
    }
  };

  // Load saved drawing data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`floor-plan-drawing-${locationId}-${floorNumber}`);
    if (savedData) {
      setDrawingData(savedData);
    }
  }, [locationId, floorNumber]);

  const handleRepairFiles = async () => {
    setIsRepairing(true);
    try {
      await repairFloorPlanFiles(locationId);
      toast({
        title: "Files Repaired",
        description: "Floor plan files have been repaired and linked to the location.",
      });
      // Refresh the page to see updated data
      window.location.reload();
    } catch (error) {
      console.error('Error repairing files:', error);
      toast({
        title: "Repair Failed",
        description: "Failed to repair floor plan files. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const getDropPointIcon = (type: string) => {
    const icons = {
      data: '📡',
      fiber: '🌐', 
      security: '🔒',
      wireless: '📶',
      power: '⚡'
    };
    return icons[type as keyof typeof icons] || '📡';
  };

  const getDropPointColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-gray-500 border-gray-600';
      case 'installed':
        return 'bg-blue-500 border-blue-600';
      case 'tested':
        return 'bg-yellow-500 border-yellow-600';
      case 'active':
        return 'bg-green-500 border-green-600';
      case 'inactive':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Floor {floorNumber} - Interactive Plan
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={isDrawingMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              disabled={!actualFileUrl}
            >
              <Paintbrush className="h-4 w-4 mr-2" />
              {isDrawingMode ? 'Exit Draw' : 'Draw Mode'}
            </Button>
            <Button
              variant={isAddingPoint ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsAddingPoint(!isAddingPoint);
                setIsAddingRoomView(false);
                setIsDrawingMode(false);
                setActiveTool('select');
              }}
              disabled={!actualFileUrl || isDrawingMode}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Drop Point
            </Button>
            <Button
              variant={isAddingRoomView ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsAddingRoomView(!isAddingRoomView);
                setIsAddingPoint(false);
                setIsDrawingMode(false);
                setActiveTool('select');
              }}
              disabled={!actualFileUrl || isDrawingMode}
            >
              <Camera className="h-4 w-4 mr-2" />
              Add Room View
            </Button>
            {!actualFileUrl && filePath && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRepairFiles}
                disabled={isRepairing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
                Repair Files
              </Button>
            )}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => adjustScale(false)}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="px-2">
                {Math.round(scale * 100)}%
              </Badge>
              <Button variant="outline" size="sm" onClick={() => adjustScale(true)}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetScale}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {(floorDropPoints.length > 0 || floorRoomViews.length > 0) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {floorDropPoints.length > 0 && (
              <span>{floorDropPoints.length} drop points on this floor</span>
            )}
            {floorRoomViews.length > 0 && (
              <span>{floorRoomViews.length} room views on this floor</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drawing Toolbar */}
        {isDrawingMode && (
          <FloorPlanDrawingToolbar
            activeTool={activeTool}
            onToolChange={handleDrawingToolChange}
            onUndo={() => drawingCanvasRef.current?.drawingActions?.undo()}
            onRedo={() => drawingCanvasRef.current?.drawingActions?.redo()}
            onClear={() => drawingCanvasRef.current?.drawingActions?.clear()}
            onSave={() => drawingCanvasRef.current?.drawingActions?.save()}
            onLoad={handleDrawingLoad}
            canUndo={canUndo}
            canRedo={canRedo}
            brushColor={brushColor}
            onBrushColorChange={setBrushColor}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
          />
        )}
        <div 
          ref={containerRef}
          className={`relative bg-muted rounded-lg overflow-hidden ${
            isDragging ? 'cursor-grabbing' : 
            isDrawingMode ? 'cursor-crosshair' : 'cursor-pointer'
          }`}
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            height: 'auto',
            minHeight: '400px'
          }}
          onClick={handleContainerClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Background Content */}
          {isImage && actualFileUrl ? (
            <img
              src={actualFileUrl}
              alt={`Floor ${floorNumber} plan`}
              className="w-full h-auto"
              style={{ display: 'block' }}
              onError={(e) => {
                console.error('Image failed to load:', actualFileUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : filePath ? (
            <div className="w-full h-96 bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground space-y-2">
                <p className="text-sm font-medium">Floor plan file found but not accessible</p>
                <p className="text-xs">File path: {filePath}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRepairFiles}
                  disabled={isRepairing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
                  Repair File Access
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-96 bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-sm font-medium">No floor plan uploaded</p>
                <p className="text-xs">Upload a floor plan to enable interactive placement</p>
              </div>
            </div>
          )}

          {/* Drawing Canvas Overlay */}
          {actualFileUrl && containerDimensions.width > 0 && (
            <FloorPlanDrawingCanvas
              ref={drawingCanvasRef}
              width={containerDimensions.width}
              height={containerDimensions.height}
              activeTool={activeTool}
              brushColor={brushColor}
              brushSize={brushSize}
              onHistoryChange={handleDrawingHistoryChange}
              onSave={handleDrawingSave}
              savedData={drawingData}
              className={isDrawingMode ? "pointer-events-auto" : "pointer-events-none"}
            />
          )}

          {/* Drop Points Overlay */}
          <TooltipProvider>
            {floorDropPoints.map((point) => {
              // Use dragged point coordinates if this point is being dragged
              const displayPoint = draggedPoint && draggedPoint.id === point.id ? draggedPoint : point;
              
              return (
                <Tooltip key={point.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-white font-bold hover:scale-110 transition-transform shadow-lg ${
                        draggedPoint && draggedPoint.id === point.id 
                          ? `cursor-grabbing scale-110 ${getDropPointColor(point.status)}` 
                          : `cursor-grab ${getDropPointColor(point.status)}`
                      }`}
                      onMouseDown={(e) => !isDrawingMode && handleMouseDown(e, point, 'dropPoint')}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDragging && !isDrawingMode) {
                          setSelectedDropPoint(point);
                          setDetailsModalOpen(true);
                        }
                      }}
                      style={{
                        ...{
                          left: `${displayPoint.x_coordinate || 50}%`,
                          top: `${displayPoint.y_coordinate || 50}%`,
                          zIndex: draggedPoint && draggedPoint.id === point.id ? 50 : 10,
                        },
                        pointerEvents: isDrawingMode ? 'none' : 'auto'
                      }}
                    >
                      <span className="text-xs">{getDropPointIcon(point.point_type)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover border">
                    <div className="text-sm">
                      <p className="font-medium">{point.label}</p>
                      <p className="text-muted-foreground">{point.room}</p>
                      <p className="text-xs capitalize">{point.point_type} • {point.status}</p>
                      <p className="text-xs text-muted-foreground mt-1">Click and drag to move</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Room Views Overlay */}
            {floorRoomViews.map((roomView) => {
              // Use dragged room view coordinates if this room view is being dragged
              const displayRoomView = draggedRoomView && draggedRoomView.id === roomView.id ? draggedRoomView : roomView;
              
              return (
                <Tooltip key={roomView.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-600 border-2 border-blue-700 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg ${
                        draggedRoomView && draggedRoomView.id === roomView.id 
                          ? 'cursor-grabbing scale-110' 
                          : 'cursor-grab'
                      }`}
                      style={{
                        left: `${displayRoomView.x_coordinate || 50}%`,
                        top: `${displayRoomView.y_coordinate || 50}%`,
                        zIndex: draggedRoomView && draggedRoomView.id === roomView.id ? 50 : 15,
                        pointerEvents: isDrawingMode ? 'none' : 'auto'
                      }}
                      onMouseDown={(e) => !isDrawingMode && handleMouseDown(e, roomView, 'roomView')}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDragging && !isDrawingMode) {
                          setSelectedRoomView(roomView);
                          setRoomViewModalOpen(true);
                        }
                      }}
                    >
                    <Camera className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-popover border">
                  <div className="text-sm">
                    <p className="font-medium">{roomView.room_name || 'Room View'}</p>
                    {roomView.description && (
                      <p className="text-muted-foreground">{roomView.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      By {roomView.employee?.first_name} {roomView.employee?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Click to view photo</p>
                  </div>
                </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>

          {/* Add Point Indicators */}
          {isAddingPoint && (
            <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium z-10">
              Click anywhere on the plan to add a drop point
            </div>
          )}
          {isAddingRoomView && (
            <div className="absolute top-4 left-4 bg-blue-600/90 text-white px-3 py-2 rounded-lg text-sm font-medium z-10">
              Click anywhere on the plan to add a room view camera
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-1">Interactive Controls:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Add Drop Point:</strong> Click the button above, then click on the plan</li>
            <li>• <strong>Add Room View:</strong> Click the camera button above, then click on the plan to capture a photo</li>
            <li>• <strong>Move Drop Point:</strong> Click and drag existing points to reposition them</li>
            <li>• <strong>Zoom:</strong> Use the zoom controls or mouse wheel</li>
            <li>• <strong>View Details:</strong> Click on existing drop points or room view cameras</li>
            <li>• <strong>Scale:</strong> Adjust view scale with zoom controls</li>
          </ul>
        </div>
      </CardContent>

      {/* Add Drop Point Modal */}
      <AddDropPointModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        locationId={locationId}
        coordinates={clickCoordinates || undefined}
        floor={floorNumber}
      />

      {/* Add Room View Modal */}
      <AddRoomViewModal
        open={showAddRoomViewModal}
        onOpenChange={setShowAddRoomViewModal}
        locationId={locationId}
        coordinates={clickCoordinates || undefined}
        floor={floorNumber}
      />

      {/* Drop Point Details Modal */}
      <DropPointDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        dropPoint={selectedDropPoint}
        locationId={locationId}
      />

      {/* Room View Modal */}
        <RoomViewModal
          open={roomViewModalOpen}
          onOpenChange={setRoomViewModalOpen}
          roomView={selectedRoomView}
          locationId={locationId}
        />
    </Card>
  );
};