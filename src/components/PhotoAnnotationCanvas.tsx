import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, PencilBrush, IText, Line, Circle, Polygon, FabricText, FabricImage } from "fabric";
import { PhotoAnnotationToolbar, type AnnotationTool } from "./PhotoAnnotationToolbar";
import { ScaleCalibrationDialog } from "./ScaleCalibrationDialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  onReupload?: (newPhotoUrl: string, annotationData: string) => Promise<void>;
  onClose: () => void;
  readOnly?: boolean;
}

export const PhotoAnnotationCanvas = ({
  photoUrl,
  photoId,
  existingAnnotations,
  metadata,
  onSave,
  onReupload,
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
  const [isReuploading, setIsReuploading] = useState(false);
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
    console.log("🎨 PhotoAnnotationCanvas: Initializing with photo:", photoUrl);
    
    if (!canvasRef.current || !containerRef.current) {
      console.error("❌ PhotoAnnotationCanvas: Missing refs", {
        canvasRef: !!canvasRef.current,
        containerRef: !!containerRef.current
      });
      return;
    }

    // Prevent double initialization
    if (fabricCanvas) {
      console.log("⚠️ Canvas already initialized, skipping...");
      return;
    }

    const initCanvas = () => {
      if (!canvasRef.current) {
        console.error("❌ PhotoAnnotationCanvas: canvasRef lost during init");
        return;
      }
      
      console.log("🎨 PhotoAnnotationCanvas: Starting canvas initialization...");
      
      // Load the image first to get dimensions
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = photoUrl;
      
      img.onload = () => {
        console.log("🖼️ Photo loaded successfully:", { 
          width: img.width, 
          height: img.height 
        });
        
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
        console.log("🎨 Creating FabricCanvas with dimensions:", { displayWidth, displayHeight });
        
        // Note: FabricCanvas will set the HTML canvas width/height internally
        const canvas = new FabricCanvas(canvasRef.current, {
          width: displayWidth,
          height: displayHeight,
          backgroundColor: "#f0f0f0",
          isDrawingMode: false,
        });
        
        console.log("✅ FabricCanvas created successfully", {
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          isDrawingMode: canvas.isDrawingMode
        });
        
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
          
          // Initialize the drawing brush FIRST
          const brush = new PencilBrush(canvas);
          brush.color = "#ef4444";
          brush.width = 5;
          canvas.freeDrawingBrush = brush;
          
          canvas.requestRenderAll();
          setFabricCanvas(canvas);
          setIsLoading(false);
          
          console.log("✅ PhotoAnnotationCanvas fully initialized and ready!", {
            hasBrush: !!canvas.freeDrawingBrush,
            brushColor: canvas.freeDrawingBrush?.color,
            canvasSize: { width: canvas.width, height: canvas.height }
          });
          
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
  }, [photoUrl, fabricCanvas]);

  // Add persistent mouse event listeners separately
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (e: any) => {
      console.log('✋ Canvas mouse down:', { 
        isDrawingMode: fabricCanvas.isDrawingMode,
        hasBrush: !!fabricCanvas.freeDrawingBrush,
        brushColor: fabricCanvas.freeDrawingBrush?.color,
        pointer: e.pointer,
        target: e.target 
      });
    };

    const handleMouseMove = (e: any) => {
      if (fabricCanvas.isDrawingMode && e.pointer) {
        console.log('✏️ Drawing at:', e.pointer.x, e.pointer.y);
      }
    };
    
    const handleMouseUp = () => {
      if (fabricCanvas.isDrawingMode) {
        console.log('🖱️ Mouse up - path should be created');
      }
    };

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);

    console.log("🎯 Event listeners attached to canvas");

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
      console.log("🗑️ Event listeners removed from canvas");
    };
  }, [fabricCanvas]);

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
    
    console.log("Drawing mode set:", {
      isDrawingMode: fabricCanvas.isDrawingMode,
      tool: activeTool,
      hasBrush: !!fabricCanvas.freeDrawingBrush,
      brushDetails: fabricCanvas.freeDrawingBrush ? {
        color: fabricCanvas.freeDrawingBrush.color,
        width: fabricCanvas.freeDrawingBrush.width
      } : null
    });

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
      const text = new IText("Double click to edit", {
        left: fabricCanvas.width! / 2 - 100,
        top: fabricCanvas.height! / 2 - 20,
        fill: activeColor,
        fontSize: 20,
        fontFamily: "Arial",
        editable: true,
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      // Enter editing on next tick to ensure object is fully added
      setTimeout(() => {
        text.enterEditing();
        text.selectAll();
      }, 10);
      fabricCanvas.renderAll();
    }
    
    fabricCanvas.requestRenderAll();
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
    console.log("🔄 Canvas changed, saving to history and scheduling auto-save");
    saveHistory();
    
    // Debounced auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      console.log("💾 Auto-save triggered");
      handleSave(true);
    }, 2000); // Increased to 2 seconds for better batching
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
    if (!fabricCanvas || readOnly) {
      console.log("⚠️ Save skipped:", { hasFabricCanvas: !!fabricCanvas, readOnly });
      return;
    }

    console.log(`💾 Starting ${isAutoSave ? 'auto-' : 'manual '}save...`);
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

      console.log("📤 Calling onSave callback with annotation data");
      await onSave(annotationData, annotationMetadata);
      console.log("✅ Save completed successfully");
      
      if (!isAutoSave) {
        toast.success("Annotations saved successfully");
      } else {
        console.log("💾 Auto-save completed silently");
      }
    } catch (error) {
      console.error("❌ Error saving annotations:", error);
      toast.error("Failed to save annotations");
    } finally {
      setIsSaving(false);
    }
  }, [fabricCanvas, metadata, onSave, readOnly, measurements, scale]);

  const handleReupload = useCallback(async () => {
    if (!fabricCanvas || !onReupload) return;

    try {
      setIsReuploading(true);

      // Generate composite image with annotations
      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: 2, // Export at 2x resolution for quality
      });

      // Convert data URL to blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Extract original filename and create new filename
      const originalFileName = photoUrl.split('/').pop()?.split('?')[0] || 'photo';
      const baseName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('_')[0] + '_' + new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0];
      const newFileName = `${baseName}_modified_${timestamp}.png`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('room-views')
        .upload(newFileName, blob, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('room-views')
        .getPublicUrl(newFileName);

      // Get current annotation data
      const annotationData = JSON.stringify(fabricCanvas.toJSON());

      // Call onReupload to update the photo URL in the database
      await onReupload(publicUrl, annotationData);

      toast.success(`Photo re-uploaded as ${newFileName}`);

      // Close the annotation canvas after successful upload
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error re-uploading photo:', error);
      toast.error("Failed to re-upload the annotated photo");
    } finally {
      setIsReuploading(false);
    }
  }, [fabricCanvas, onReupload, photoUrl, onClose]);

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex flex-col">
      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-1 p-4 flex items-center justify-center bg-muted/50"
        style={{ overflow: 'hidden' }}
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading photo...</span>
          </div>
        )}
        
        <div 
          style={{ 
            display: isLoading ? 'none' : 'block',
            position: 'relative',
          }}
        >
          <canvas
            ref={canvasRef}
            className="shadow-lg rounded-lg border border-border"
            style={{ 
              touchAction: "none",
              userSelect: "none",
              cursor: activeTool === "pencil" ? "crosshair" : activeTool === "eraser" ? "crosshair" : "default",
            }}
            onMouseDown={(e) => console.log("🖱️ NATIVE mouse down on canvas element", e)}
            onTouchStart={(e) => console.log("👆 NATIVE touch start on canvas element", e)}
          />
        </div>
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
          onReupload={handleReupload}
          onClose={onClose}
          canUndo={canUndo}
          canRedo={canRedo}
          isSaving={isSaving}
          isReuploading={isReuploading}
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
