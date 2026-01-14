import { useEffect, useRef, useState, useCallback } from "react";
import { 
  Canvas as FabricCanvas, 
  PencilBrush, 
  IText, 
  Line, 
  Rect,
  Polygon,
  FabricText,
  Point,
  util
} from "fabric";
import { ManualDrawModeToolbar, type DrawingTool, type TextPreset } from "./ManualDrawModeToolbar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManualDrawModeCanvasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingDrawingData?: string | null;
  floorNumber: number;
  locationName?: string;
  hasExistingDropPoints?: boolean;
  onSave: (imageBlob: Blob, drawingJson: string) => Promise<void>;
}

const BLUEPRINT_BACKGROUND = "#1e3a5f";
const GRID_COLOR = "rgba(255, 255, 255, 0.1)";
const GRID_SIZE = 20;

// Large canvas dimensions for floor plans
const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;

export const ManualDrawModeCanvas = ({
  open,
  onOpenChange,
  existingDrawingData,
  floorNumber,
  locationName,
  hasExistingDropPoints = false,
  onSave,
}: ManualDrawModeCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const [activeColor, setActiveColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [textPreset, setTextPreset] = useState<TextPreset>("custom");
  const [zoom, setZoom] = useState(1);
  const [showDropPointWarning, setShowDropPointWarning] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{ blob: Blob; json: string } | null>(null);
  
  // Drawing state for multi-point tools
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStartPoint, setLineStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [tempLine, setTempLine] = useState<Line | null>(null);
  const [isDrawingRect, setIsDrawingRect] = useState(false);
  const [rectStartPoint, setRectStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [tempRect, setTempRect] = useState<Rect | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);

  const historyRef = useRef<string[]>([]);
  const historyStepRef = useRef(0);

  // Initialize canvas
  useEffect(() => {
    if (!open) return;
    if (fabricCanvas) return; // Prevent re-init

    let retryCount = 0;
    const maxRetries = 20;
    let timeoutId: ReturnType<typeof setTimeout>;
    let disposed = false;

    const initCanvas = () => {
      if (disposed) return;
      
      const container = containerRef.current;
      const canvasEl = canvasRef.current;
      
      if (!container || !canvasEl) {
        if (retryCount < maxRetries) {
          retryCount++;
          timeoutId = setTimeout(initCanvas, 100);
        } else {
          console.error('Canvas refs not available after retries');
          setIsLoading(false);
        }
        return;
      }

      const rect = container.getBoundingClientRect();
      
      // If dimensions are zero, retry after a delay
      if (rect.width === 0 || rect.height === 0) {
        if (retryCount < maxRetries) {
          retryCount++;
          timeoutId = setTimeout(initCanvas, 100);
          return;
        }
      }

      try {
        // Use fixed large canvas dimensions for floor plans
        const canvas = new FabricCanvas(canvasEl, {
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: BLUEPRINT_BACKGROUND,
          isDrawingMode: false,
          selection: true,
        });

        if (disposed) {
          canvas.dispose();
          return;
        }

        // Draw initial grid on the full canvas
        if (showGrid) {
          drawGrid(canvas, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // Initialize drawing brush
        const brush = new PencilBrush(canvas);
        brush.color = activeColor;
        brush.width = lineWidth;
        canvas.freeDrawingBrush = brush;

        // Load existing drawing if available
        if (existingDrawingData) {
          try {
            canvas.loadFromJSON(existingDrawingData, () => {
              canvas.backgroundColor = BLUEPRINT_BACKGROUND;
              canvas.renderAll();
              saveHistory(canvas);
              setIsLoading(false);
            });
          } catch (error) {
            console.error("Error loading existing drawing:", error);
            saveHistory(canvas);
            setIsLoading(false);
          }
        } else {
          saveHistory(canvas);
          setIsLoading(false);
        }

        // Event listeners
        canvas.on("object:added", () => handleCanvasChange(canvas));
        canvas.on("object:modified", () => handleCanvasChange(canvas));
        canvas.on("object:removed", () => handleCanvasChange(canvas));

        setFabricCanvas(canvas);

        toast.success("Draw Mode Ready", {
          description: "Use the tools above to create your floor plan"
        });
      } catch (error) {
        console.error('Canvas initialization failed:', error);
        setIsLoading(false);
        toast.error("Failed to initialize canvas");
      }
    };

    // Delay to ensure DOM is ready
    timeoutId = setTimeout(initCanvas, 150);

    return () => {
      disposed = true;
      clearTimeout(timeoutId);
    };
  }, [open]);

  // Draw grid pattern
  const drawGrid = (canvas: FabricCanvas, width: number, height: number) => {
    const gridGroup: Line[] = [];
    
    // Vertical lines
    for (let x = 0; x <= width; x += GRID_SIZE) {
      const line = new Line([x, 0, x, height], {
        stroke: GRID_COLOR,
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      gridGroup.push(line);
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += GRID_SIZE) {
      const line = new Line([0, y, width, y], {
        stroke: GRID_COLOR,
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      gridGroup.push(line);
    }

    gridGroup.forEach(line => {
      (line as any).isGrid = true;
      canvas.add(line);
    });
    
    canvas.sendObjectToBack(gridGroup[0]); // Send grid to back
    gridGroup.forEach(line => canvas.sendObjectToBack(line));
  };

  // Toggle grid visibility
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const gridObjects = fabricCanvas.getObjects().filter((obj: any) => obj.isGrid);
    
    if (showGrid && gridObjects.length === 0) {
      drawGrid(fabricCanvas, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (!showGrid) {
      gridObjects.forEach(obj => fabricCanvas.remove(obj));
    }
    
    fabricCanvas.renderAll();
  }, [showGrid, fabricCanvas]);

  // Handle tool changes
  useEffect(() => {
    if (!fabricCanvas) return;

    // Reset drawing states
    setIsDrawingLine(false);
    setLineStartPoint(null);
    setIsDrawingRect(false);
    setRectStartPoint(null);
    setPolygonPoints([]);
    
    if (tempLine) {
      fabricCanvas.remove(tempLine);
      setTempLine(null);
    }
    if (tempRect) {
      fabricCanvas.remove(tempRect);
      setTempRect(null);
    }

    // Exit any active text editing before switching tools
    fabricCanvas.getObjects().forEach(obj => {
      if (obj.type === 'i-text' && (obj as any).isEditing) {
        (obj as any).exitEditing();
      }
    });

    fabricCanvas.isDrawingMode = activeTool === "pencil";
    fabricCanvas.selection = activeTool === "select";

    // Ensure IText objects stay editable when in select mode
    if (activeTool === "select") {
      fabricCanvas.getObjects().forEach(obj => {
        if (obj.type === 'i-text') {
          obj.set({ selectable: true, editable: true, evented: true });
        }
      });
    }
    
    // Configure cursor
    switch (activeTool) {
      case "pan":
        fabricCanvas.defaultCursor = "grab";
        break;
      case "eraser":
        fabricCanvas.defaultCursor = "crosshair";
        break;
      case "text":
        fabricCanvas.defaultCursor = "text";
        break;
      default:
        fabricCanvas.defaultCursor = "crosshair";
    }

    if (activeTool === "pencil" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = lineWidth;
    }

    fabricCanvas.renderAll();
  }, [activeTool, fabricCanvas]);

  // Update brush properties
  useEffect(() => {
    if (!fabricCanvas?.freeDrawingBrush) return;
    fabricCanvas.freeDrawingBrush.color = activeColor;
    fabricCanvas.freeDrawingBrush.width = lineWidth;
  }, [activeColor, lineWidth, fabricCanvas]);

  // Mouse event handlers for drawing tools
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (e: any) => {
      if (!e.pointer) return;
      const pointer = e.pointer;

      switch (activeTool) {
        case "line":
          if (!isDrawingLine) {
            setIsDrawingLine(true);
            setLineStartPoint({ x: pointer.x, y: pointer.y });
            const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
              stroke: activeColor,
              strokeWidth: lineWidth,
              selectable: false,
            });
            fabricCanvas.add(line);
            setTempLine(line);
          } else {
            // Finish line
            setIsDrawingLine(false);
            setLineStartPoint(null);
            if (tempLine) {
              tempLine.set({ selectable: true });
              setTempLine(null);
              saveHistory(fabricCanvas);
            }
          }
          break;

        case "rectangle":
          if (!isDrawingRect) {
            setIsDrawingRect(true);
            setRectStartPoint({ x: pointer.x, y: pointer.y });
            const rect = new Rect({
              left: pointer.x,
              top: pointer.y,
              width: 0,
              height: 0,
              fill: "transparent",
              stroke: activeColor,
              strokeWidth: lineWidth,
              selectable: false,
            });
            fabricCanvas.add(rect);
            setTempRect(rect);
          } else {
            // Finish rectangle
            setIsDrawingRect(false);
            setRectStartPoint(null);
            if (tempRect) {
              tempRect.set({ selectable: true });
              setTempRect(null);
              saveHistory(fabricCanvas);
            }
          }
          break;

        case "polygon":
          const newPoints = [...polygonPoints, { x: pointer.x, y: pointer.y }];
          setPolygonPoints(newPoints);
          
          // Draw temporary point marker
          const marker = new Rect({
            left: pointer.x - 3,
            top: pointer.y - 3,
            width: 6,
            height: 6,
            fill: activeColor,
            selectable: false,
            evented: false,
          });
          (marker as any).isPolygonMarker = true;
          fabricCanvas.add(marker);
          fabricCanvas.renderAll();
          
          if (newPoints.length >= 3) {
            toast.info("Double-click to close polygon");
          }
          break;

        case "text":
          addText(pointer.x, pointer.y);
          break;

        case "measurement":
          if (!isDrawingLine) {
            setIsDrawingLine(true);
            setLineStartPoint({ x: pointer.x, y: pointer.y });
            const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
              stroke: "#fef08a",
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              selectable: false,
            });
            fabricCanvas.add(line);
            setTempLine(line);
          } else {
            // Finish measurement
            if (tempLine && lineStartPoint) {
              const endX = pointer.x;
              const endY = pointer.y;
              const distance = Math.sqrt(
                Math.pow(endX - lineStartPoint.x, 2) + 
                Math.pow(endY - lineStartPoint.y, 2)
              );
              
              // Add measurement label
              const midX = (lineStartPoint.x + endX) / 2;
              const midY = (lineStartPoint.y + endY) / 2;
              const label = new FabricText(`${Math.round(distance)}px`, {
                left: midX,
                top: midY - 20,
                fontSize: 14,
                fill: "#fef08a",
                fontFamily: "Arial",
                fontWeight: "bold",
                backgroundColor: "rgba(0,0,0,0.5)",
              });
              fabricCanvas.add(label);
              
              tempLine.set({ selectable: true });
              setTempLine(null);
              saveHistory(fabricCanvas);
            }
            setIsDrawingLine(false);
            setLineStartPoint(null);
          }
          break;

        case "eraser":
          if (e.target && !(e.target as any).isGrid) {
            fabricCanvas.remove(e.target);
            fabricCanvas.renderAll();
            saveHistory(fabricCanvas);
            toast.success("Object removed");
          }
          break;
      }
    };

    const handleMouseMove = (e: any) => {
      if (!e.pointer) return;
      const pointer = e.pointer;

      if (isDrawingLine && tempLine && lineStartPoint) {
        tempLine.set({ x2: pointer.x, y2: pointer.y });
        fabricCanvas.renderAll();
      }

      if (isDrawingRect && tempRect && rectStartPoint) {
        const width = pointer.x - rectStartPoint.x;
        const height = pointer.y - rectStartPoint.y;
        
        tempRect.set({
          left: width > 0 ? rectStartPoint.x : pointer.x,
          top: height > 0 ? rectStartPoint.y : pointer.y,
          width: Math.abs(width),
          height: Math.abs(height),
        });
        fabricCanvas.renderAll();
      }
    };

    const handleDoubleClick = (e: any) => {
      // Handle text editing on double-click - use type property for reliable check
      if (e.target && e.target.type === 'i-text') {
        // Ensure canvas is in selection mode
        fabricCanvas.selection = true;
        
        // Set properties for editing
        e.target.set({ editable: true, selectable: true, evented: true });
        
        // Make this the active object first
        fabricCanvas.setActiveObject(e.target);
        
        // Enter editing mode
        e.target.enterEditing();
        e.target.selectAll();
        fabricCanvas.renderAll();
        return;
      }

      if (activeTool === "polygon" && polygonPoints.length >= 3) {
        // Remove temporary markers
        const markers = fabricCanvas.getObjects().filter((obj: any) => obj.isPolygonMarker);
        markers.forEach(m => fabricCanvas.remove(m));

        // Create polygon
        const points = polygonPoints.map(p => new Point(p.x, p.y));
        const polygon = new Polygon(points, {
          fill: "transparent",
          stroke: activeColor,
          strokeWidth: lineWidth,
        });
        fabricCanvas.add(polygon);
        fabricCanvas.renderAll();
        
        setPolygonPoints([]);
        saveHistory(fabricCanvas);
        toast.success("Polygon created");
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:dblclick", handleDoubleClick);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:dblclick", handleDoubleClick);
    };
  }, [fabricCanvas, activeTool, isDrawingLine, lineStartPoint, tempLine, isDrawingRect, rectStartPoint, tempRect, polygonPoints, activeColor, lineWidth]);

  const addText = (x: number, y: number) => {
    if (!fabricCanvas) return;

    let defaultText = "DOUBLE CLICK TO EDIT";
    switch (textPreset) {
      case "room_name":
        defaultText = "ROOM NAME";
        break;
      case "ceiling_height":
        defaultText = "CLG: 10'-0\"";
        break;
      case "floor_name":
        defaultText = `FLOOR ${floorNumber}`;
        break;
      case "building_name":
        defaultText = locationName?.toUpperCase() || "BUILDING NAME";
        break;
    }

    const text = new IText(defaultText, {
      left: x,
      top: y,
      fill: activeColor,
      fontSize: 16,
      fontFamily: "Arial",
      fontWeight: "bold",
      editable: true,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    
    setTimeout(() => {
      text.enterEditing();
      text.selectAll();
    }, 10);

    fabricCanvas.renderAll();
    saveHistory(fabricCanvas);
  };

  const saveHistory = useCallback((canvas: FabricCanvas) => {
    // Filter out grid objects before saving
    const objectsToSave = canvas.getObjects().filter((obj: any) => !obj.isGrid && !obj.isPolygonMarker);
    const tempCanvas = { ...canvas.toJSON(), objects: objectsToSave };
    const json = JSON.stringify(tempCanvas);
    
    // Truncate forward history if we're not at the end
    historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    historyRef.current.push(json);
    historyStepRef.current = historyRef.current.length - 1;
    
    setCanUndo(historyStepRef.current > 0);
    setCanRedo(false);
  }, []);

  const handleCanvasChange = useCallback((canvas: FabricCanvas) => {
    // Debounced save to history
  }, []);

  const handleUndo = () => {
    if (!fabricCanvas || historyStepRef.current <= 0) return;
    
    historyStepRef.current -= 1;
    const json = historyRef.current[historyStepRef.current];
    
    fabricCanvas.loadFromJSON(json, () => {
      fabricCanvas.backgroundColor = BLUEPRINT_BACKGROUND;
      if (showGrid) {
        drawGrid(fabricCanvas, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      fabricCanvas.renderAll();
    });
    
    setCanUndo(historyStepRef.current > 0);
    setCanRedo(historyStepRef.current < historyRef.current.length - 1);
  };

  const handleRedo = () => {
    if (!fabricCanvas || historyStepRef.current >= historyRef.current.length - 1) return;
    
    historyStepRef.current += 1;
    const json = historyRef.current[historyStepRef.current];
    
    fabricCanvas.loadFromJSON(json, () => {
      fabricCanvas.backgroundColor = BLUEPRINT_BACKGROUND;
      if (showGrid) {
        drawGrid(fabricCanvas, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      fabricCanvas.renderAll();
    });
    
    setCanUndo(historyStepRef.current > 0);
    setCanRedo(historyStepRef.current < historyRef.current.length - 1);
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects().filter((obj: any) => !obj.isGrid);
    objects.forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.renderAll();
    saveHistory(fabricCanvas);
    toast.success("Canvas cleared");
  };

  const handleZoomIn = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.max(zoom / 1.2, 0.25);
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.renderAll();
  };

  const handleFitToView = () => {
    if (!fabricCanvas || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const scaleX = container.width / CANVAS_WIDTH;
    const scaleY = container.height / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% padding
    setZoom(scale);
    fabricCanvas.setZoom(scale);
    fabricCanvas.renderAll();
  };

  const handleSave = async () => {
    if (!fabricCanvas) return;
    setIsSaving(true);

    try {
      // Get canvas as PNG
      // First, temporarily hide grid
      const gridObjects = fabricCanvas.getObjects().filter((obj: any) => obj.isGrid);
      gridObjects.forEach(obj => obj.set({ visible: false }));
      fabricCanvas.renderAll();

      // Export to data URL
      const dataUrl = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2, // Higher resolution
      });

      // Restore grid
      gridObjects.forEach(obj => obj.set({ visible: showGrid }));
      fabricCanvas.renderAll();

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Get drawing JSON (excluding grid)
      const objectsToSave = fabricCanvas.getObjects().filter((obj: any) => !obj.isGrid && !obj.isPolygonMarker);
      const drawingJson = JSON.stringify({
        ...fabricCanvas.toJSON(),
        objects: objectsToSave.map(obj => obj.toJSON()),
      });

      // Check if there are existing drop points
      if (hasExistingDropPoints) {
        setPendingSaveData({ blob, json: drawingJson });
        setShowDropPointWarning(true);
        setIsSaving(false);
        return;
      }

      await onSave(blob, drawingJson);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving drawing:", error);
      toast.error("Failed to save drawing");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSaveWithDropPoints = async () => {
    if (!pendingSaveData) return;
    
    setIsSaving(true);
    setShowDropPointWarning(false);

    try {
      await onSave(pendingSaveData.blob, pendingSaveData.json);
      setPendingSaveData(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving drawing:", error);
      toast.error("Failed to save drawing");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[100vw] w-screen h-screen max-h-screen p-0 gap-0 bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <h2 className="text-white font-bold text-lg">
              MANUAL DRAW MODE - FLOOR {floorNumber}
              {locationName && ` - ${locationName.toUpperCase()}`}
            </h2>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>

          {/* Toolbar */}
          <ManualDrawModeToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            activeColor={activeColor}
            onColorChange={setActiveColor}
            lineWidth={lineWidth}
            onLineWidthChange={setLineWidth}
            showGrid={showGrid}
            onGridToggle={setShowGrid}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            onSave={handleSave}
            onCancel={handleCancel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToView={handleFitToView}
            canUndo={canUndo}
            canRedo={canRedo}
            isSaving={isSaving}
            textPreset={textPreset}
            onTextPresetChange={setTextPreset}
          />

          {/* Canvas Container - scrollable for large canvas */}
          <div 
            ref={containerRef} 
            className="flex-1 overflow-auto bg-slate-900 relative"
          >
            {/* Always render canvas, but hide while loading */}
            <canvas 
              ref={canvasRef} 
              className={isLoading ? "opacity-0" : ""} 
            />
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Initializing canvas...</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-4 py-2 bg-slate-800 border-t border-slate-600 flex items-center justify-between text-xs text-slate-400">
            <span>Tool: {activeTool.toUpperCase()}</span>
            <div className="flex items-center gap-4">
              <span>Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}px</span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
            </div>
            <span>Grid: {showGrid ? "ON" : "OFF"}</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drop Point Warning Dialog */}
      <AlertDialog open={showDropPointWarning} onOpenChange={setShowDropPointWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Existing Drop Points Detected</AlertDialogTitle>
            <AlertDialogDescription>
              This floor plan has existing drop points placed on it. Saving a new drawing will update the background image, but the drop point positions will remain unchanged.
              <br /><br />
              The drop points may no longer align visually with the new drawing. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSaveData(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaveWithDropPoints}>
              Save Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
