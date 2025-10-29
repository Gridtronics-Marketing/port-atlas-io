import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Pencil,
  Eraser,
  Type,
  MousePointer,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Save,
  X,
  Ruler,
  Triangle,
  Square,
} from "lucide-react";
import { useState } from "react";

export type AnnotationTool = "select" | "pencil" | "eraser" | "text" | "measure-distance" | "measure-angle" | "measure-area" | "calibrate-scale";

interface PhotoAnnotationToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onExport: () => void;
  onClose: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSaving?: boolean;
  hasScale?: boolean;
}

const colorPresets = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#000000", // black
  "#ffffff", // white
];

export const PhotoAnnotationToolbar = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onExport,
  onClose,
  canUndo,
  canRedo,
  isSaving,
  hasScale = false,
}: PhotoAnnotationToolbarProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMeasurementTools, setShowMeasurementTools] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg z-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={activeTool === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => onToolChange("select")}
              className="h-10 w-10 p-0"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "pencil" ? "default" : "outline"}
              size="sm"
              onClick={() => onToolChange("pencil")}
              className="h-10 w-10 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "eraser" ? "default" : "outline"}
              size="sm"
              onClick={() => onToolChange("eraser")}
              className="h-10 w-10 p-0"
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => onToolChange("text")}
              className="h-10 w-10 p-0"
            >
              <Type className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-10 hidden md:block" />

          {/* Measurement Tools */}
          <div className="flex items-center gap-1 relative">
            <Button
              variant={activeTool === "calibrate-scale" ? "default" : "outline"}
              size="sm"
              onClick={() => onToolChange("calibrate-scale")}
              className="h-10 w-10 p-0"
            >
              <Ruler className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button
                variant={activeTool.startsWith("measure-") ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMeasurementTools(!showMeasurementTools)}
                className="h-10 px-3"
              >
                <Triangle className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-xs">Measure</span>
              </Button>
              {showMeasurementTools && (
                <div className="absolute bottom-full mb-2 left-0 bg-popover border rounded-lg shadow-lg p-2 flex flex-col gap-1 min-w-[140px]">
                  <Button
                    variant={activeTool === "measure-distance" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onToolChange("measure-distance");
                      setShowMeasurementTools(false);
                    }}
                    className="justify-start h-9"
                  >
                    <Ruler className="h-4 w-4 mr-2" />
                    Distance
                  </Button>
                  <Button
                    variant={activeTool === "measure-angle" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onToolChange("measure-angle");
                      setShowMeasurementTools(false);
                    }}
                    className="justify-start h-9"
                  >
                    <Triangle className="h-4 w-4 mr-2" />
                    Angle
                  </Button>
                  <Button
                    variant={activeTool === "measure-area" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onToolChange("measure-area");
                      setShowMeasurementTools(false);
                    }}
                    className="justify-start h-9"
                    disabled={!hasScale}
                    title={!hasScale ? "Set scale calibration first" : ""}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Area
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator orientation="vertical" className="h-10 hidden md:block" />

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="h-10 w-10 rounded border-2 border-border hover:border-primary transition-colors"
                style={{ backgroundColor: activeColor }}
              />
              {showColorPicker && (
                <div className="absolute bottom-full mb-2 left-0 bg-popover border rounded-lg p-2 shadow-lg grid grid-cols-3 gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onColorChange(color);
                        setShowColorPicker(false);
                      }}
                      className="h-8 w-8 rounded border-2 hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: color,
                        borderColor: color === activeColor ? "hsl(var(--primary))" : "transparent",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
              <Label className="text-xs whitespace-nowrap">Size: {brushSize}</Label>
              <Slider
                value={[brushSize]}
                onValueChange={(values) => onBrushSizeChange(values[0])}
                min={2}
                max={20}
                step={1}
                className="w-20"
              />
            </div>
          </div>

          <Separator orientation="vertical" className="h-10 hidden md:block" />

          {/* History Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-10 w-10 p-0"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-10 w-10 p-0"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="h-10 w-10 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-10 hidden md:block" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="h-10 px-3"
            >
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-10 px-3"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile-only brush size slider */}
        <div className="sm:hidden mt-3 flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">Size: {brushSize}</Label>
          <Slider
            value={[brushSize]}
            onValueChange={(values) => onBrushSizeChange(values[0])}
            min={2}
            max={20}
            step={1}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};
