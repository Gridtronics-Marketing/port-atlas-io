import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, PencilBrush, IText, Line, Circle, Polygon, FabricText, FabricImage } from "fabric";
import { PhotoAnnotationToolbar, type AnnotationTool } from "./PhotoAnnotationToolbar";
import { ScaleCalibrationDialog } from "./ScaleCalibrationDialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  type Measurement,
  type MeasurementScale,
  calculateDistance,
  calculateAngle,
  calculatePolygonArea,
  convertDistance,
  convertArea,
} from "@/lib/measurement-utils";

interface PhotoAnnotationCanvasProps {
  photoUrl: string;
  photoId: string;
  existingAnnotations?: string;
  metadata?: {
    created_by?: string;
    created_at?: string;
  };
  onSave: (annotationData: string, metadata: any) => Promise<void>;
  onClose: () => void;
  readOnly?: boolean;
}

export const PhotoAnnotationCanvas = ({
  photoUrl,
  photoId,
  existingAnnotations,
  metadata,
  onSave,
  onClose,
  readOnly = false,
}: PhotoAnnotationCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("select");
  const [activeColor, setActiveColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const historyRef = useRef<string[]>([]);
  const historyStepRef = useRef(0);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Measurement state
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [scale, setScale] = useState<MeasurementScale | null>(null);
  const [measurementPoints, setMeasurementPoints] = useState<{ x: number; y: number }[]>([]);
  const [showScaleDialog, setShowScaleDialog] = useState(false);
  const [calibrationLine, setCalibrationLine] = useState<{ distance: number } | null>(null);

  // Initialize canvas with photo as background
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const initCanvas = () => {
      if (!canvasRef.current) return;
      
      // Load the image first to get dimensions
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = photoUrl;
      
      img.onload = () => {
        const maxWidth = window.innerWidth - 100;
        const maxHeight = window.innerHeight - 200;
        
        let displayWidth = img.width;
        let displayHeight = img.height;
        
        // Scale down if image is too large
        if (displayWidth > maxWidth) {
          const scale = maxWidth / displayWidth;
          displayWidth = maxWidth;
          displayHeight = img.height * scale;
        }
        
        if (displayHeight > maxHeight) {
          const scale = maxHeight / displayHeight;
          displayHeight = maxHeight;
          displayWidth = displayWidth * scale;
        }
        
        // Create canvas with calculated dimensions
        const canvas = new FabricCanvas(canvasRef.current, {
          width: displayWidth,
          height: displayHeight,
          backgroundColor: "#f0f0f0",
          isDrawingMode: false,
        });
        
        // Explicitly set canvas element dimensions to match Fabric.js dimensions
        if (canvasRef.current) {
          canvasRef.current.width = displayWidth;
          canvasRef.current.height = displayHeight;
          canvasRef.current.style.width = `${displayWidth}px`;
          canvasRef.current.style.height = `${displayHeight}px`;
        }
        
        // Calculate scale for background image
        const imageScale = displayWidth / img.width;
        
        // Load the photo as the canvas background image using Fabric.js v6 API
        FabricImage.fromURL(photoUrl, { crossOrigin: "anonymous" }).then((fabricImg) => {
          fabricImg.scaleToWidth(displayWidth);
          fabricImg.scaleToHeight(displayHeight);
          canvas.backgroundImage = fabricImg;
          
          // Load existing annotations if any
          if (existingAnnotations) {
            try {
              canvas.loadFromJSON(existingAnnotations, () => {
                canvas.renderAll();
                saveHistory();
              });
            } catch (error) {
              console.error("Error loading annotations:", error);
              toast.error("Failed to load existing annotations");
            }
          } else {
            saveHistory();
          }
          
          // Set up event listeners
          canvas.on("object:added", handleCanvasChange);
          canvas.on("object:modified", handleCanvasChange);
          canvas.on("object:removed", handleCanvasChange);
          canvas.on("path:created", () => {
            console.log("Path created - drawing worked!");
            canvas.renderAll();
          });
          
          // Add mouse event logging for debugging
          canvas.on('mouse:down', (e) => {
            console.log('Canvas mouse down:', { 
              isDrawingMode: canvas.isDrawingMode, 
              tool: activeTool,
              pointer: e.pointer 
            });
          });

          canvas.on('mouse:move', (e) => {
            if (canvas.isDrawingMode) {
              console.log('Drawing in progress...');
            }
          });
          
          // Initialize the drawing brush
          const brush = new PencilBrush(canvas);
          brush.color = "#ef4444";
          brush.width = 5;
          canvas.freeDrawingBrush = brush;
          
          canvas.renderAll();
          setFabricCanvas(canvas);
          setIsLoading(false);
          toast.success("Ready to annotate! Click pencil to draw");
        }).catch((error) => {
          console.error("Error loading background image:", error);
          toast.error("Failed to load image");
          setIsLoading(false);
        });
      };
      
      img.onerror = () => {
        toast.error("Failed to load image");
        setIsLoading(false);
      };
    };

    initCanvas();

    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [photoUrl]);

  // Handle measurement tool interactions
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleCanvasClick = (e: any) => {
      if (!e.pointer) return;

      const pointer = e.pointer;

      if (activeTool === "measure-distance") {
        handleDistanceMeasurement(pointer.x, pointer.y);
      } else if (activeTool === "measure-angle") {
        handleAngleMeasurement(pointer.x, pointer.y);
      } else if (activeTool === "measure-area") {
        handleAreaMeasurement(pointer.x, pointer.y);
      } else if (activeTool === "calibrate-scale") {
        handleScaleCalibration(pointer.x, pointer.y);
      }
    };

    if (activeTool.startsWith("measure-") || activeTool === "calibrate-scale") {
      fabricCanvas.on("mouse:down", handleCanvasClick);
    }

    return () => {
      fabricCanvas.off("mouse:down", handleCanvasClick);
    };
  }, [fabricCanvas, activeTool, measurementPoints, scale]);

  // Update tool when activeTool changes
  useEffect(() => {
    if (!fabricCanvas) return;

    console.log("Tool changed to:", activeTool);
    const isMeasurementTool = activeTool.startsWith("measure-") || activeTool === "calibrate-scale";
    
    fabricCanvas.isDrawingMode = activeTool === "pencil" || activeTool === "eraser";
    fabricCanvas.selection = activeTool === "select" && !isMeasurementTool;
    
    console.log("Drawing mode:", fabricCanvas.isDrawingMode);

    if (activeTool === "pencil") {
      const pencilBrush = new PencilBrush(fabricCanvas);
      pencilBrush.color = activeColor;
      pencilBrush.width = brushSize;
      fabricCanvas.freeDrawingBrush = pencilBrush;
      console.log("Pencil brush configured:", { color: activeColor, width: brushSize });
    } else if (activeTool === "eraser") {
      const eraserBrush = new PencilBrush(fabricCanvas);
      eraserBrush.color = "rgba(255, 255, 255, 1)";
      eraserBrush.width = brushSize * 2;
      fabricCanvas.freeDrawingBrush = eraserBrush;
    } else if (activeTool === "text") {
      fabricCanvas.isDrawingMode = false;
      const text = new IText("Click to edit text", {
        left: fabricCanvas.width! / 2 - 100,
        top: fabricCanvas.height! / 2 - 20,
        fill: activeColor,
        fontSize: 20,
        fontFamily: "Arial",
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      text.enterEditing();  // Enter edit mode immediately
      text.selectAll();     // Select all text for easy replacement
      fabricCanvas.renderAll();
      // Don't switch to select tool - let user finish editing first
    }
    
    fabricCanvas.renderAll();
  }, [activeTool, fabricCanvas, activeColor, brushSize]);

  // Update brush color and size
  useEffect(() => {
    if (!fabricCanvas || !fabricCanvas.freeDrawingBrush) return;
    
    if (fabricCanvas.freeDrawingBrush instanceof PencilBrush) {
      if (activeTool === "eraser") {
        fabricCanvas.freeDrawingBrush.color = "rgba(255, 255, 255, 1)";
        fabricCanvas.freeDrawingBrush.width = brushSize * 2;
      } else {
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = brushSize;
      }
    }

    // Reset measurement points when changing tools
    if (!activeTool.startsWith("measure-") && activeTool !== "calibrate-scale") {
      setMeasurementPoints([]);
    }
  }, [activeColor, brushSize, fabricCanvas, activeTool]);

  const handleDistanceMeasurement = (x: number, y: number) => {
    const newPoints = [...measurementPoints, { x, y }];
    setMeasurementPoints(newPoints);

    if (newPoints.length === 2) {
      const [p1, p2] = newPoints;
      const pixelDistance = calculateDistance(p1.x, p1.y, p2.x, p2.y);
      
      const line = new Line([p1.x, p1.y, p2.x, p2.y], {
        stroke: activeColor,
        strokeWidth: 2,
        selectable: false,
      });
      
      const text = new FabricText(convertDistance(pixelDistance, scale || undefined), {
        left: (p1.x + p2.x) / 2,
        top: (p1.y + p2.y) / 2 - 20,
        fontSize: 16,
        fill: activeColor,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        selectable: false,
      });

      fabricCanvas?.add(line, text);
      fabricCanvas?.renderAll();
      
      setMeasurementPoints([]);
      saveHistory();
      toast.success("Distance measured");
    }
  };

  const handleAngleMeasurement = (x: number, y: number) => {
    const newPoints = [...measurementPoints, { x, y }];
    setMeasurementPoints(newPoints);

    if (newPoints.length === 3) {
      const [p1, p2, p3] = newPoints;
      const angle = calculateAngle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      
      const line1 = new Line([p2.x, p2.y, p1.x, p1.y], {
        stroke: activeColor,
        strokeWidth: 2,
        selectable: false,
      });
      
      const line2 = new Line([p2.x, p2.y, p3.x, p3.y], {
        stroke: activeColor,
        strokeWidth: 2,
        selectable: false,
      });
      
      const text = new FabricText(`${angle}°`, {
        left: p2.x + 10,
        top: p2.y - 25,
        fontSize: 16,
        fill: activeColor,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        selectable: false,
      });

      fabricCanvas?.add(line1, line2, text);
      fabricCanvas?.renderAll();
      
      setMeasurementPoints([]);
      saveHistory();
      toast.success(`Angle measured: ${angle}°`);
    }
  };

  const handleAreaMeasurement = (x: number, y: number) => {
    if (!scale) {
      toast.error("Set scale calibration first");
      return;
    }

    const newPoints = [...measurementPoints, { x, y }];
    setMeasurementPoints(newPoints);

    // Draw temporary point
    const point = new Circle({
      left: x - 3,
      top: y - 3,
      radius: 3,
      fill: activeColor,
      selectable: false,
    });
    fabricCanvas?.add(point);
    fabricCanvas?.renderAll();

    // If we have at least 3 points, allow closing the polygon
    if (newPoints.length >= 3) {
      toast.info("Click first point to finish, or continue adding points");
    }
  };

  const handleScaleCalibration = (x: number, y: number) => {
    const newPoints = [...measurementPoints, { x, y }];
    setMeasurementPoints(newPoints);

    if (newPoints.length === 2) {
      const [p1, p2] = newPoints;
      const pixelDistance = calculateDistance(p1.x, p1.y, p2.x, p2.y);
      
      const line = new Line([p1.x, p1.y, p2.x, p2.y], {
        stroke: "#3b82f6",
        strokeWidth: 3,
        strokeDashArray: [5, 5],
        selectable: false,
      });
      
      fabricCanvas?.add(line);
      fabricCanvas?.renderAll();
      
      setCalibrationLine({ distance: pixelDistance });
      setShowScaleDialog(true);
    }
  };

  const handleSetScale = (pixelDistance: number, realDistance: number, unit: string) => {
    const pixelsPerUnit = pixelDistance / realDistance;
    setScale({ pixelsPerUnit, unit });
    setMeasurementPoints([]);
    setCalibrationLine(null);
    saveHistory();
    toast.success(`Scale set: 1 ${unit} = ${pixelsPerUnit.toFixed(2)} pixels`);
  };

  const saveHistory = useCallback(() => {
    if (!fabricCanvas) return;

    const json = JSON.stringify(fabricCanvas.toJSON());
    
    // Limit history size (25 on mobile, 50 on desktop)
    const maxHistory = window.innerWidth < 768 ? 25 : 50;
    
    historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    historyRef.current.push(json);
    
    if (historyRef.current.length > maxHistory) {
      historyRef.current.shift();
    } else {
      historyStepRef.current++;
    }

    setCanUndo(historyStepRef.current > 0);
    setCanRedo(false);
  }, [fabricCanvas]);

  const handleCanvasChange = useCallback(() => {
    saveHistory();
    
    // Debounced auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave(true);
    }, 1000);
  }, [saveHistory]);

  const handleUndo = useCallback(() => {
    if (!fabricCanvas || historyStepRef.current <= 0) return;

    historyStepRef.current--;
    const json = historyRef.current[historyStepRef.current];
    
    fabricCanvas.loadFromJSON(json, () => {
      fabricCanvas.renderAll();
      setCanUndo(historyStepRef.current > 0);
      setCanRedo(true);
    });
  }, [fabricCanvas]);

  const handleRedo = useCallback(() => {
    if (!fabricCanvas || historyStepRef.current >= historyRef.current.length - 1) return;

    historyStepRef.current++;
    const json = historyRef.current[historyStepRef.current];
    
    fabricCanvas.loadFromJSON(json, () => {
      fabricCanvas.renderAll();
      setCanUndo(true);
      setCanRedo(historyStepRef.current < historyRef.current.length - 1);
    });
  }, [fabricCanvas]);

  const handleClear = useCallback(() => {
    if (!fabricCanvas) return;

    if (confirm("Are you sure you want to clear all annotations?")) {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "transparent";
      fabricCanvas.renderAll();
      saveHistory();
      toast.success("Annotations cleared");
    }
  }, [fabricCanvas, saveHistory]);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!fabricCanvas || readOnly) return;

    setIsSaving(true);
    try {
      const annotationData = JSON.stringify(fabricCanvas.toJSON());
      const annotationMetadata = {
        ...metadata,
        modified_at: new Date().toISOString(),
        tool_version: "2.0",
        measurements,
        scale,
      };

      await onSave(annotationData, annotationMetadata);
      
      if (!isAutoSave) {
        toast.success("Annotations saved successfully");
      }
    } catch (error) {
      console.error("Error saving annotations:", error);
      toast.error("Failed to save annotations");
    } finally {
      setIsSaving(false);
    }
  }, [fabricCanvas, metadata, onSave, readOnly]);

  const handleExport = useCallback(() => {
    if (!fabricCanvas) return;

    try {
      // Export canvas with background image and annotations
      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: 2, // Export at 2x resolution for quality
      });
      
      const link = document.createElement("a");
      link.download = `annotated-${photoId}.png`;
      link.href = dataURL;
      link.click();
      
      toast.success("Annotated photo exported");
    } catch (error) {
      console.error("Error exporting photo:", error);
      toast.error("Failed to export annotated photo");
    }
  }, [fabricCanvas, photoId]);

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex flex-col">
      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/50">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading photo...</span>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          className="shadow-lg rounded-lg border border-border"
          style={{ 
            display: isLoading ? 'none' : 'block',
            touchAction: "none",
            pointerEvents: "auto",
          }}
        />
      </div>

      {/* Toolbar */}
      {!readOnly && fabricCanvas && (
        <PhotoAnnotationToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onSave={() => handleSave(false)}
          onExport={handleExport}
          onClose={onClose}
          canUndo={canUndo}
          canRedo={canRedo}
          isSaving={isSaving}
          hasScale={!!scale}
        />
      )}

      {/* Scale Calibration Dialog */}
      <ScaleCalibrationDialog
        open={showScaleDialog}
        onClose={() => {
          setShowScaleDialog(false);
          setMeasurementPoints([]);
          setCalibrationLine(null);
        }}
        onSetScale={handleSetScale}
        pixelDistance={calibrationLine?.distance || 0}
      />
    </div>
  );
};
