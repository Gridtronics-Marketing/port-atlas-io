import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Pencil, 
  Type, 
  Eraser, 
  Undo2, 
  Redo2, 
  Trash2, 
  MousePointer, 
  Download,
  Upload,
  Palette,
  Image
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type DrawingTool = 'select' | 'pencil' | 'text' | 'eraser';

interface FloorPlanDrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
  canUndo: boolean;
  canRedo: boolean;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onUseAsFloorPlan?: () => void;
  hasSavedDrawing?: boolean;
  isSaving?: boolean;
}

const colors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#orange', '#purple'
];

const brushSizes = [1, 2, 4, 6, 8, 12, 16, 20];

export const FloorPlanDrawingToolbar = ({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onLoad,
  canUndo,
  canRedo,
  brushColor,
  onBrushColorChange,
  brushSize,
  onBrushSizeChange,
  onUseAsFloorPlan,
  hasSavedDrawing = false,
  isSaving = false
}: FloorPlanDrawingToolbarProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrushSizes, setShowBrushSizes] = useState(false);

  return (
    <Card className="w-full">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tool Selection */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToolChange('select')}
                    className="h-8 w-8 p-0"
                  >
                    <MousePointer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select, Move & Delete</p>
                  <p className="text-xs text-muted-foreground mt-1">Press Delete/Backspace to remove selected</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button
              variant={activeTool === 'pencil' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToolChange('pencil')}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Button
              variant={activeTool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToolChange('text')}
              className="h-8 w-8 p-0"
            >
              <Type className="h-4 w-4" />
            </Button>
            
            <Button
              variant={activeTool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToolChange('eraser')}
              className="h-8 w-8 p-0"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Brush Settings */}
          <div className="flex items-center gap-1 relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="h-8 w-8 p-0"
            >
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: brushColor }}
              />
            </Button>
            
            {showColorPicker && (
              <div className="absolute top-10 left-0 z-50 bg-popover border rounded-lg p-2 shadow-lg">
                <div className="grid grid-cols-5 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        onBrushColorChange(color);
                        setShowColorPicker(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBrushSizes(!showBrushSizes)}
              className="h-8 px-2"
            >
              <Palette className="h-4 w-4 mr-1" />
              {brushSize}px
            </Button>
            
            {showBrushSizes && (
              <div className="absolute top-10 left-12 z-50 bg-popover border rounded-lg p-2 shadow-lg">
                <div className="flex flex-col gap-1">
                  {brushSizes.map((size) => (
                    <button
                      key={size}
                      className="px-3 py-1 text-sm hover:bg-accent rounded text-left"
                      onClick={() => {
                        onBrushSizeChange(size);
                        setShowBrushSizes(false);
                      }}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* History Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 w-8 p-0"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 w-8 p-0"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* File Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="h-8 px-2"
              data-testid="btn-save-floorplan"
            >
              <Download className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onLoad}
              disabled={isSaving}
              className="h-8 px-2"
            >
              <Upload className="h-4 w-4 mr-1" />
              Load
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={isSaving}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {hasSavedDrawing && onUseAsFloorPlan && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="default"
                size="sm"
                onClick={onUseAsFloorPlan}
                disabled={isSaving}
                className="h-8 px-3"
                data-testid="btn-used-for-design"
              >
                <Image className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Use as Floor Plan'}
              </Button>
            </>
          )}

          {/* Current Tool Badge */}
          <div className="ml-auto">
            <Badge variant="secondary" className="capitalize">
              {activeTool} Mode
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};