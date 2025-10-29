import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, PencilBrush, IText } from "fabric";
import { PhotoAnnotationToolbar } from "./PhotoAnnotationToolbar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  const imageRef = useRef<HTMLImageElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "pencil" | "eraser" | "text">("select");
  const [activeColor, setActiveColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const historyRef = useRef<string[]>([]);
  const historyStepRef = useRef(0);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize canvas when image loads
  useEffect(() => {
    if (!imageRef.current || !canvasRef.current) return;

    const img = imageRef.current;
    
    const initCanvas = () => {
      if (!canvasRef.current) return;
      
      const canvas = new FabricCanvas(canvasRef.current, {
        width: img.width,
        height: img.height,
        backgroundColor: "transparent",
        isDrawingMode: false,
      });

      // Initialize brushes
      const pencilBrush = new PencilBrush(canvas);
      pencilBrush.color = activeColor;
      pencilBrush.width = brushSize;

      canvas.freeDrawingBrush = pencilBrush;

      // Load existing annotations
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

      setFabricCanvas(canvas);
      setIsLoading(false);
      toast.success("Annotation canvas ready!");
    };

    if (img.complete) {
      initCanvas();
    } else {
      img.onload = initCanvas;
    }

    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [photoUrl]);

  // Update tool when activeTool changes
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "pencil" || activeTool === "eraser";
    fabricCanvas.selection = activeTool === "select";

    if (activeTool === "pencil") {
      const pencilBrush = new PencilBrush(fabricCanvas);
      pencilBrush.color = activeColor;
      pencilBrush.width = brushSize;
      fabricCanvas.freeDrawingBrush = pencilBrush;
    } else if (activeTool === "eraser") {
      // For eraser, use white color pencil brush
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
      fabricCanvas.renderAll();
      setActiveTool("select");
    }
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
  }, [activeColor, brushSize, fabricCanvas, activeTool]);

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
        tool_version: "1.0",
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
    if (!fabricCanvas || !imageRef.current) return;

    try {
      // Create a temporary canvas to combine image and annotations
      const tempCanvas = document.createElement("canvas");
      const img = imageRef.current;
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return;

      // Draw the original photo
      ctx.drawImage(img, 0, 0);

      // Scale and draw annotations
      const scale = img.naturalWidth / fabricCanvas.width!;
      const annotationDataUrl = fabricCanvas.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: scale,
      });

      const annotationImg = new Image();
      annotationImg.onload = () => {
        ctx.drawImage(annotationImg, 0, 0);
        
        // Download the combined image
        const link = document.createElement("a");
        link.download = `annotated-${photoId}.png`;
        link.href = tempCanvas.toDataURL("image/png");
        link.click();
        
        toast.success("Annotated photo exported");
      };
      annotationImg.src = annotationDataUrl;
    } catch (error) {
      console.error("Error exporting photo:", error);
      toast.error("Failed to export annotated photo");
    }
  }, [fabricCanvas, photoId]);

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex flex-col">
      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 flex items-center justify-center">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading annotation canvas...</span>
          </div>
        )}
        
        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={photoUrl}
            alt="Photo to annotate"
            className="max-w-full max-h-[calc(100vh-200px)] block"
            crossOrigin="anonymous"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 cursor-crosshair"
            style={{ touchAction: "none" }}
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
          onExport={handleExport}
          onClose={onClose}
          canUndo={canUndo}
          canRedo={canRedo}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
