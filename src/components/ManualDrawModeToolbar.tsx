import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  MousePointer,
  Minus,
  Square,
  Pentagon,
  Pencil,
  Type,
  Ruler,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Grid3X3,
  Save,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DrawingTool = 
  | "select" 
  | "line" 
  | "rectangle" 
  | "polygon" 
  | "pencil" 
  | "text" 
  | "measurement" 
  | "eraser"
  | "pan";

export type TextPreset = "room_name" | "ceiling_height" | "floor_name" | "building_name" | "custom";

interface ManualDrawModeToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  lineWidth: number;
  onLineWidthChange: (width: number) => void;
  showGrid: boolean;
  onGridToggle: (show: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onCancel: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSaving?: boolean;
  textPreset?: TextPreset;
  onTextPresetChange?: (preset: TextPreset) => void;
}

// Blueprint-appropriate colors - light colors for visibility on dark blue background
const colorPresets = [
  "#ffffff", // white (default for blueprint)
  "#f0f0f0", // light gray
  "#fef08a", // yellow
  "#86efac", // green
  "#93c5fd", // light blue
  "#fca5a5", // light red
  "#fdba74", // orange
  "#c4b5fd", // purple
];

const textPresets: { value: TextPreset; label: string }[] = [
  { value: "room_name", label: "ROOM NAME" },
  { value: "ceiling_height", label: "CEILING HEIGHT" },
  { value: "floor_name", label: "FLOOR NAME" },
  { value: "building_name", label: "BUILDING NAME" },
  { value: "custom", label: "CUSTOM TEXT" },
];

export const ManualDrawModeToolbar = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  lineWidth,
  onLineWidthChange,
  showGrid,
  onGridToggle,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onCancel,
  onZoomIn,
  onZoomOut,
  onFitToView,
  canUndo,
  canRedo,
  isSaving,
  textPreset = "custom",
  onTextPresetChange,
}: ManualDrawModeToolbarProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-600 shadow-lg p-3">
      <div className="max-w-full mx-auto">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={activeTool === "select" ? "default" : "secondary"}
              size="sm"
              onClick={() => onToolChange("select")}
              className="h-9 w-9 p-0"
              title="Select (V)"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "pan" ? "default" : "secondary"}
              size="sm"
              onClick={() => onToolChange("pan")}
              className="h-9 w-9 p-0"
              title="Pan (H)"
            >
              <Move className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-8 mx-1 bg-slate-600" />
            
            <Button
              variant={activeTool === "line" ? "default" : "secondary"}
              size="sm"
              onClick={() => onToolChange("line")}
              className="h-9 w-9 p-0"
              title="Line Tool (L)"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "rectangle" ? "default" : "secondary"}
              size="sm"
              onClick={() => onToolChange("rectangle")}
              className="h-9 w-9 p-0"
              title="Rectangle Tool (R)"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "polygon" ? "default" : "secondary"}
              size="sm"
              onClick={() => onToolChange("polygon")}
              className="h-9 w-9 p-0"
              title="Polygon Tool (P)"
            >
              <Pentagon className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "pencil" ? "default" : "secondary"}
              size="sm"
              onClick={() => onToolChange("pencil")}
              className="h-9 w-9 p-0"
              title="Freehand (B)"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-8 mx-1 bg-slate-600" />
            
            {/* Text Tool with Presets */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={activeTool === "text" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => onToolChange("text")}
                  className="h-9 px-2"
                  title="Text Tool (T)"
                >
                  <Type className="h-4 w-4 mr-1" />
                  <span className="text-xs hidden sm:inline">Text</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-600">
                {textPresets.map((preset) => (
                  <DropdownMenuItem
                    key={preset.value}
                    onClick={() => {
                      onTextPresetChange?.(preset.value);
                      onToolChange("text");
                    }}
                    className="text-white hover:bg-slate-700 cursor-pointer"
                  >
                    {preset.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant={activeTool === "measurement" ? "default" : "secondary"}
              size="sm"
              onClick={() => onToolChange("measurement")}
              className="h-9 w-9 p-0"
              title="Measurement Tool (M)"
            >
              <Ruler className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "eraser" ? "default" : "secondary"}
              size="sm"
              onClick={() => onToolChange("eraser")}
              className="h-9 w-9 p-0"
              title="Eraser (E)"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8 hidden md:block bg-slate-600" />

          {/* Color Picker & Line Width */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="h-9 w-9 rounded border-2 border-slate-500 hover:border-white transition-colors"
                style={{ backgroundColor: activeColor }}
                title="Color"
              />
              {showColorPicker && (
                <div className="absolute top-full mt-2 left-0 bg-slate-800 border border-slate-600 rounded-lg p-2 shadow-lg grid grid-cols-4 gap-2 z-50">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onColorChange(color);
                        setShowColorPicker(false);
                      }}
                      className="h-7 w-7 rounded border-2 hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: color,
                        borderColor: color === activeColor ? "#3b82f6" : "transparent",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 min-w-[140px]">
              <Label className="text-xs text-slate-300 whitespace-nowrap">Width: {lineWidth}px</Label>
              <Slider
                value={[lineWidth]}
                onValueChange={(values) => onLineWidthChange(values[0])}
                min={1}
                max={10}
                step={1}
                className="w-24"
              />
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 hidden md:block bg-slate-600" />

          {/* Grid Toggle */}
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-slate-300" />
            <Switch
              checked={showGrid}
              onCheckedChange={onGridToggle}
              className="data-[state=checked]:bg-blue-500"
            />
            <span className="text-xs text-slate-300 hidden sm:inline">Grid</span>
          </div>

          <Separator orientation="vertical" className="h-8 hidden md:block bg-slate-600" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={onZoomOut}
              className="h-9 w-9 p-0"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onZoomIn}
              className="h-9 w-9 p-0"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            {onFitToView && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onFitToView}
                className="h-9 w-9 p-0"
                title="Fit to View (0)"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Separator orientation="vertical" className="h-8 hidden md:block bg-slate-600" />

          {/* History Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-9 w-9 p-0"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-9 w-9 p-0"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClear}
              className="h-9 w-9 p-0 text-red-400 hover:text-red-300"
              title="Clear All"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8 hidden md:block bg-slate-600" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="h-9 px-3 bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save Drawing"}</span>
              <span className="sm:hidden">Save</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              className="h-9 w-9 p-0"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile-only line width slider */}
        <div className="sm:hidden mt-3 flex items-center gap-2">
          <Label className="text-xs text-slate-300 whitespace-nowrap">Width: {lineWidth}px</Label>
          <Slider
            value={[lineWidth]}
            onValueChange={(values) => onLineWidthChange(values[0])}
            min={1}
            max={10}
            step={1}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};
