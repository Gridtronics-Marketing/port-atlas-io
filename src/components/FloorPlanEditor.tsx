import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Text } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MousePointer, 
  Pencil, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Eraser, 
  Download, 
  Upload,
  Undo,
  Redo,
  Trash2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface FloorPlanEditorProps {
  floorNumber: number;
  locationName: string;
  backgroundImage?: string | null;
  onSave?: (canvasData: string) => void;
}

type ToolType = "select" | "draw" | "rectangle" | "circle" | "text" | "eraser";

export const FloorPlanEditor = ({ 
  floorNumber, 
  locationName, 
  backgroundImage,
  onSave 
}: FloorPlanEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [activeColor, setActiveColor] = useState("#FF0000");
  const [brushWidth, setBrushWidth] = useState(2);
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    // Initialize the freeDrawingBrush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }

    setFabricCanvas(canvas);

    // Load background image if provided
    if (backgroundImage) {
      // TODO: Load background image
      console.log("Loading background image:", backgroundImage);
    }

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";
    
    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushWidth;
    }
  }, [activeTool, activeColor, brushWidth, fabricCanvas]);

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        radius: 50,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    } else if (tool === "text") {
      const text = new Text("Drop Point", {
        left: 100,
        top: 100,
        fill: activeColor,
        fontSize: 16,
        fontFamily: "Arial",
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
    }
    
    fabricCanvas.renderAll();
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast({
      title: "Canvas Cleared",
      description: "Floor plan has been cleared",
    });
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    
    const canvasData = fabricCanvas.toJSON();
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.8,
      multiplier: 1
    });
    
    console.log("Floor plan data:", canvasData);
    onSave?.(JSON.stringify(canvasData));
    
    toast({
      title: "Floor Plan Saved",
      description: `Floor ${floorNumber} plan has been saved`,
    });
  };

  const handleUndo = () => {
    // TODO: Implement undo functionality
    toast({
      title: "Undo",
      description: "Undo functionality coming soon",
    });
  };

  const handleRedo = () => {
    // TODO: Implement redo functionality
    toast({
      title: "Redo", 
      description: "Redo functionality coming soon",
    });
  };

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "draw", icon: Pencil, label: "Draw" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: CircleIcon, label: "Circle" },
    { id: "text", icon: Type, label: "Text" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Floor Plan Editor
            <Badge variant="outline">Floor {floorNumber}</Badge>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {locationName}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
          {/* Drawing Tools */}
          <div className="flex gap-1">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToolClick(tool.id as ToolType)}
                  title={tool.label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>

          <div className="h-6 w-px bg-border mx-2" />

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <Label htmlFor="color-picker" className="text-sm">Color:</Label>
            <Input
              id="color-picker"
              type="color"
              value={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
              className="w-12 h-8 p-1 border rounded cursor-pointer"
            />
          </div>

          {/* Brush Width */}
          <div className="flex items-center gap-2">
            <Label htmlFor="brush-width" className="text-sm">Width:</Label>
            <Select value={brushWidth.toString()} onValueChange={(value) => setBrushWidth(parseInt(value))}>
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1px</SelectItem>
                <SelectItem value="2">2px</SelectItem>
                <SelectItem value="3">3px</SelectItem>
                <SelectItem value="5">5px</SelectItem>
                <SelectItem value="8">8px</SelectItem>
                <SelectItem value="12">12px</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border mx-2" />

          {/* Action Buttons */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleUndo} title="Undo">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo} title="Redo">
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear} title="Clear All">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} title="Save Floor Plan">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="border border-border rounded-lg shadow-sm overflow-hidden bg-white">
          <canvas 
            ref={canvasRef} 
            className="max-w-full cursor-crosshair"
          />
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Instructions:</p>
          <ul className="space-y-1 text-xs">
            <li>• Use the <strong>Select</strong> tool to move and resize objects</li>
            <li>• Use <strong>Draw</strong> to sketch drop point locations and cable runs</li>
            <li>• Add <strong>Rectangles</strong> and <strong>Circles</strong> to mark equipment areas</li>
            <li>• Use <strong>Text</strong> to label rooms, equipment, or drop points</li>
            <li>• Click <strong>Save</strong> to store your floor plan changes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};