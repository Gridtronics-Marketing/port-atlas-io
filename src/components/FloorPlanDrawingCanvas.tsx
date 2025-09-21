import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, FabricText, Path, FabricObject } from 'fabric';
import { useToast } from '@/hooks/use-toast';
import type { DrawingTool } from './FloorPlanDrawingToolbar';

interface FloorPlanDrawingCanvasProps {
  width: number;
  height: number;
  activeTool: DrawingTool;
  brushColor: string;
  brushSize: number;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  onSave: (data: string) => void;
  savedData?: string;
  className?: string;
}

export interface DrawingCanvasRef {
  drawingActions: {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    save: () => void;
    load: (data: string) => void;
  };
}

export const FloorPlanDrawingCanvas = forwardRef<DrawingCanvasRef, FloorPlanDrawingCanvasProps>(({
  width,
  height,
  activeTool,
  brushColor,
  brushSize,
  onHistoryChange,
  onSave,
  savedData,
  className = ""
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    });

    // Configure drawing brush
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushSize;

    setFabricCanvas(canvas);

    // Load saved data if available
    if (savedData) {
      try {
        canvas.loadFromJSON(savedData, () => {
          canvas.renderAll();
          saveToHistory(canvas);
        });
      } catch (error) {
        console.error('Error loading saved drawing data:', error);
      }
    } else {
      saveToHistory(canvas);
    }

    return () => {
      canvas.dispose();
    };
  }, [width, height]);

  // Save current state to history
  const saveToHistory = useCallback((canvas: FabricCanvas) => {
    const state = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      return newHistory.slice(-50); // Keep only last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Update history change callback
  useEffect(() => {
    onHistoryChange(historyIndex > 0, historyIndex < history.length - 1);
  }, [historyIndex, history.length, onHistoryChange]);

  // Handle tool changes
  useEffect(() => {
    if (!fabricCanvas) return;

    // Reset selection and drawing modes
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = 'default';

    switch (activeTool) {
      case 'select':
        fabricCanvas.selection = true;
        fabricCanvas.defaultCursor = 'default';
        break;
      
      case 'pencil':
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.freeDrawingBrush.color = brushColor;
        fabricCanvas.freeDrawingBrush.width = brushSize;
        break;
      
      case 'text':
        fabricCanvas.defaultCursor = 'text';
        break;
      
      case 'eraser':
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.freeDrawingBrush.color = 'transparent';
        fabricCanvas.freeDrawingBrush.width = brushSize * 2;
        // Use destination-out composition for erasing
        break;
    }
  }, [activeTool, fabricCanvas, brushColor, brushSize]);

  // Handle brush property changes
  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'pencil') return;
    
    fabricCanvas.freeDrawingBrush.color = brushColor;
    fabricCanvas.freeDrawingBrush.width = brushSize;
  }, [brushColor, brushSize, fabricCanvas, activeTool]);

  // Handle canvas events
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (e: any) => {
      if (activeTool === 'text') {
        const pointer = fabricCanvas.getPointer(e.e);
        const text = new FabricText('Double-click to edit', {
          left: pointer.x,
          top: pointer.y,
          fontSize: Math.max(12, brushSize),
          fill: brushColor,
          editable: true,
        });
        
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        // text.enterEditing(); // This method doesn't exist in Fabric v6
        saveToHistory(fabricCanvas);
      }
    };

    const handlePathCreated = () => {
      if (activeTool === 'pencil' || activeTool === 'eraser') {
        saveToHistory(fabricCanvas);
      }
    };

    const handleObjectModified = () => {
      saveToHistory(fabricCanvas);
    };

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('path:created', handlePathCreated);
    fabricCanvas.on('object:modified', handleObjectModified);

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('path:created', handlePathCreated);
      fabricCanvas.off('object:modified', handleObjectModified);
    };
  }, [fabricCanvas, activeTool, brushColor, brushSize, saveToHistory]);

  // Undo function
  const undo = useCallback(() => {
    if (!fabricCanvas || historyIndex <= 0) return;
    
    const prevIndex = historyIndex - 1;
    const prevState = history[prevIndex];
    
    fabricCanvas.loadFromJSON(prevState, () => {
      fabricCanvas.renderAll();
      setHistoryIndex(prevIndex);
    });
  }, [fabricCanvas, history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (!fabricCanvas || historyIndex >= history.length - 1) return;
    
    const nextIndex = historyIndex + 1;
    const nextState = history[nextIndex];
    
    fabricCanvas.loadFromJSON(nextState, () => {
      fabricCanvas.renderAll();
      setHistoryIndex(nextIndex);
    });
  }, [fabricCanvas, history, historyIndex]);

  // Clear canvas
  const clear = useCallback(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'transparent';
    fabricCanvas.renderAll();
    saveToHistory(fabricCanvas);
    
    toast({
      title: "Canvas Cleared",
      description: "All drawings have been removed.",
    });
  }, [fabricCanvas, saveToHistory, toast]);

  // Save drawing data
  const save = useCallback(() => {
    if (!fabricCanvas) return;
    
    const data = JSON.stringify(fabricCanvas.toJSON());
    onSave(data);
    
    toast({
      title: "Drawing Saved",
      description: "Your floor plan annotations have been saved.",
    });
  }, [fabricCanvas, onSave, toast]);

  // Load drawing data
  const load = useCallback((data: string) => {
    if (!fabricCanvas) return;
    
    try {
      fabricCanvas.loadFromJSON(data, () => {
        fabricCanvas.renderAll();
        saveToHistory(fabricCanvas);
        toast({
          title: "Drawing Loaded",
          description: "Floor plan annotations have been loaded.",
        });
      });
    } catch (error) {
      console.error('Error loading drawing data:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load drawing data.",
        variant: "destructive",
      });
    }
  }, [fabricCanvas, saveToHistory, toast]);

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    drawingActions: {
      undo,
      redo,
      clear,
      save,
      load
    }
  }), [undo, redo, clear, save, load]);

  return (
    <div className={`absolute inset-0 pointer-events-auto ${className}`}>
      <canvas 
        ref={canvasRef}
        className="absolute inset-0"
        style={{ 
          zIndex: activeTool !== 'select' ? 20 : 5,
          pointerEvents: activeTool !== 'select' ? 'auto' : 'none'
        }}
      />
    </div>
  );
});