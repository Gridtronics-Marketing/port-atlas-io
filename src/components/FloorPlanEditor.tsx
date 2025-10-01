import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, FabricText } from "fabric";
import { Brush, Circle as CircleIcon, Eraser, Hand, Minus, Plus, Square, Save, Type, Undo, Redo, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useCanvasDrawings } from "@/hooks/useCanvasDrawings";

// Define available drawing tools
type ToolType = "select" | "draw" | "rectangle" | "circle" | "text" | "eraser";

interface FloorPlanEditorProps {
  floorNumber: number;
  locationName: string;
  backgroundImage?: string;
  onSave?: (canvasData: any) => void;
  mode?: 'draw' | 'riser';
  locationId?: string;
  initialCanvasData?: any;
}

export const FloorPlanEditor = ({ 
  floorNumber, 
  locationName, 
  backgroundImage, 
  onSave, 
  mode = 'draw',
  locationId,
  initialCanvasData
}: FloorPlanEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushWidth, setBrushWidth] = useState(2);
  const { saveDrawing, getDrawingForFloor } = useCanvasDrawings(locationId);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    // Initialize the freeDrawingBrush right after canvas creation
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }

    // Load existing drawing data if locationId is provided
    if (locationId) {
      const existingDrawing = getDrawingForFloor(floorNumber);
      if (existingDrawing?.canvas_data) {
        canvas.loadFromJSON(existingDrawing.canvas_data, () => {
          canvas.renderAll();
          console.log('Canvas loaded from existing drawing');
        });
      }
    } else if (initialCanvasData) {
      // Fallback to initial canvas data if provided
      canvas.loadFromJSON(initialCanvasData, () => {
        canvas.renderAll();
        console.log('Canvas loaded from initial data');
      });
    }

    setFabricCanvas(canvas);

    // Handle PDF background warning
    if (backgroundImage && backgroundImage.toLowerCase().includes('.pdf')) {
      console.warn('PDF backgrounds cannot be used directly. Please convert to an image format first.');
    }

    return () => {
      canvas.dispose();
    };
  }, [locationId, floorNumber, initialCanvasData, getDrawingForFloor]);

  // Update canvas properties when tool or styling changes
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";
    fabricCanvas.selection = activeTool === "select";

    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushWidth;
    }

    if (activeTool === "eraser" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = "#ffffff"; // Erase with white
      fabricCanvas.freeDrawingBrush.width = brushWidth * 2;
    }
  }, [activeTool, activeColor, brushWidth, fabricCanvas]);

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: activeColor,
        width: 100,
        height: 100,
        stroke: activeColor,
        strokeWidth: 2,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: "transparent",
        radius: 50,
        stroke: activeColor,
        strokeWidth: 2,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    } else if (tool === "text") {
      const text = new FabricText("Double click to edit", {
        left: 100,
        top: 100,
        fontFamily: "Arial",
        fontSize: 16,
        fill: activeColor,
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast("Canvas cleared");
  };

  const handleSave = async () => {
    if (!fabricCanvas) return;
    
    const canvasData = fabricCanvas.toJSON();
    console.log('Saving canvas data:', canvasData);
    
    // If locationId is provided, save to database
    if (locationId && floorNumber) {
      await saveDrawing({
        location_id: locationId,
        floor_number: floorNumber,
        canvas_data: canvasData
      });
    }
    
    onSave && onSave(canvasData);
  };

  const handleUndo = () => {
    // TODO: Implement undo functionality
    toast("Undo functionality coming soon");
  };

  const handleRedo = () => {
    // TODO: Implement redo functionality
    toast("Redo functionality coming soon");
  };

  const colors = [
    "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", 
    "#ff00ff", "#00ffff", "#ffa500", "#800080", "#008000"
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{locationName}</span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{mode === 'riser' ? 'Riser Diagram' : `Floor ${floorNumber}`}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-lg">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={activeTool === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("select")}
            >
              <Hand className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("draw")}
            >
              <Brush className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "rectangle" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("rectangle")}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "circle" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("circle")}
            >
              <CircleIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("text")}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "eraser" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("eraser")}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <Label className="text-sm">Color:</Label>
            <div className="flex gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded border-2 ${
                    activeColor === color ? "border-primary" : "border-muted"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setActiveColor(color)}
                />
              ))}
            </div>
            <Input
              type="color"
              value={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
              className="w-8 h-8 p-0 border-0"
            />
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Brush Width */}
          <div className="flex items-center gap-2">
            <Label className="text-sm">Size:</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrushWidth(Math.max(1, brushWidth - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm w-6 text-center">{brushWidth}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrushWidth(Math.min(20, brushWidth + 1))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handleUndo}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <div className="border border-border rounded-lg overflow-hidden shadow-sm">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <p className="font-medium mb-1">Drawing Instructions:</p>
          <ul className="space-y-1 text-xs">
            <li>• Select the <strong>Hand</strong> tool to move and select objects</li>
            <li>• Use the <strong>Brush</strong> tool to draw freehand</li>
            <li>• Click <strong>Rectangle</strong> or <strong>Circle</strong> to add shapes</li>
            <li>• Click <strong>Text</strong> to add text labels</li>
            <li>• Use the <strong>Eraser</strong> to remove parts of your drawing</li>
            <li>• Choose colors and adjust brush size using the toolbar</li>
            <li>• Click <strong>Save</strong> to preserve your work</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};