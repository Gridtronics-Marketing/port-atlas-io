import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, FabricText, Path, FabricObject, PencilBrush } from 'fabric';
import { useToast } from '@/hooks/use-toast';
import { TextEditDialog } from './TextEditDialog';
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
  autoSaveDelay?: number; // Delay in ms before auto-saving, default 500
}

export interface DrawingCanvasRef {
  drawingActions: {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    save: () => void;
    load: (data: string) => void;
    exportToPNG: () => string | null;
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
  className = "",
  autoSaveDelay = 500
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [editingTextObject, setEditingTextObject] = useState<FabricText | null>(null);
  const [pendingTextPosition, setPendingTextPosition] = useState<{ x: number; y: number } | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initDimensionsRef = useRef({ width: 0, height: 0 });
  const isDisposingRef = useRef(false);
  const { toast } = useToast();

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || isDisposingRef.current) return;
    
    // Prevent re-initialization for minor dimension changes
    const dimensionThreshold = 10; // pixels
    const widthDiff = Math.abs(width - initDimensionsRef.current.width);
    const heightDiff = Math.abs(height - initDimensionsRef.current.height);
    
    if (fabricCanvas && widthDiff < dimensionThreshold && heightDiff < dimensionThreshold) {
      // Just resize existing canvas
      fabricCanvas.setDimensions({ width, height });
      fabricCanvas.renderAll();
      return;
    }
    
    console.log('🎨 Initializing canvas with dimensions:', width, 'x', height);
    initDimensionsRef.current = { width, height };
    
    // Clean up existing canvas
    if (fabricCanvas) {
      console.log('🧹 Disposing old canvas before re-initialization');
      try {
        fabricCanvas.dispose();
      } catch (error) {
        console.error('❌ Error disposing old canvas:', error);
      }
    }

    try {
      // Check if canvas already has fabric initialized
      if (canvasRef.current.hasAttribute('data-fabric')) {
        console.warn('⚠️ Canvas already initialized, cleaning up first');
        canvasRef.current.removeAttribute('data-fabric');
      }

      const canvas = new FabricCanvas(canvasRef.current, {
        width,
        height,
        backgroundColor: '#f8f9fa',
        preserveObjectStacking: true,
      });

      // Initialize the freeDrawingBrush explicitly for Fabric.js v6
      const brush = new PencilBrush(canvas);
      brush.color = brushColor;
      brush.width = brushSize;
      canvas.freeDrawingBrush = brush;

      setFabricCanvas(canvas);

      // Load saved data if available
      if (savedData) {
        try {
          canvas.loadFromJSON(savedData, () => {
            canvas.renderAll();
            saveToHistory(canvas);
          });
        } catch (error) {
          console.error('❌ Error loading saved drawing data:', error);
          toast({
            title: "Load Failed",
            description: "Failed to load previous drawing. Starting fresh.",
            variant: "destructive",
          });
        }
      } else {
        saveToHistory(canvas);
      }
      
      console.log('✅ Canvas initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing canvas:', error);
      toast({
        title: "Canvas Error",
        description: "Failed to initialize drawing canvas.",
        variant: "destructive",
      });
    }

    return () => {
      // Clear auto-save timer on cleanup
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      
      isDisposingRef.current = true;
      
      // Properly dispose of the canvas when component unmounts
      if (fabricCanvas) {
        try {
          console.log('🧹 Cleaning up canvas on component unmount');
          fabricCanvas.dispose();
          // Clear the data-fabric attribute
          if (canvasRef.current) {
            canvasRef.current.removeAttribute('data-fabric');
          }
        } catch (error) {
          console.error('❌ Error disposing canvas on cleanup:', error);
        }
      }
      
      setFabricCanvas(null);
      isDisposingRef.current = false;
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

    console.log('Fabric canvas tool change:', activeTool); // Debug log

    // Reset selection and drawing modes
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = 'default';

    switch (activeTool) {
      case 'select':
        fabricCanvas.selection = true;
        fabricCanvas.defaultCursor = 'default';
        // Make all objects selectable in select mode
        fabricCanvas.getObjects().forEach(obj => {
          obj.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
          });
        });
        fabricCanvas.renderAll();
        break;
      
      case 'pencil':
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.freeDrawingBrush.color = brushColor;
        fabricCanvas.freeDrawingBrush.width = brushSize;
        fabricCanvas.defaultCursor = 'crosshair';
        // Ensure objects remain selectable for later editing
        fabricCanvas.getObjects().forEach(obj => {
          obj.set({ selectable: true, evented: true });
        });
        console.log('Pencil mode enabled, drawing mode:', fabricCanvas.isDrawingMode); // Debug
        break;
      
      case 'text':
        fabricCanvas.defaultCursor = 'text';
        break;
      
      case 'eraser':
        fabricCanvas.isDrawingMode = true;
        // Use white color with increased width for eraser effect
        fabricCanvas.freeDrawingBrush.color = '#f8f9fa'; // Match background color
        fabricCanvas.freeDrawingBrush.width = brushSize * 2;
        fabricCanvas.defaultCursor = 'crosshair';
        break;
    }
    
    // Force render after tool change
    fabricCanvas.renderAll();
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
        // Check if clicking on an existing text object
        const target = e.target;
        if (!target || target === fabricCanvas) {
          // Open dialog to create new text
          const pointer = fabricCanvas.getPointer(e.e);
          setPendingTextPosition({ x: pointer.x, y: pointer.y });
          setEditingTextObject(null);
          setIsTextDialogOpen(true);
        }
      }
    };

    const handleMouseDoubleClick = (e: any) => {
      if (activeTool === 'text') {
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject && activeObject.type === 'text') {
          // Open dialog to edit existing text
          setEditingTextObject(activeObject as FabricText);
          setPendingTextPosition(null);
          setIsTextDialogOpen(true);
        }
      }
    };

    const handlePathCreated = (e: any) => {
      if (activeTool === 'pencil' || activeTool === 'eraser') {
        // Make the newly created path selectable and movable
        if (e.path) {
          e.path.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
          });
        }
        fabricCanvas.renderAll(); // Immediate visual feedback
        saveToHistory(fabricCanvas);
        triggerAutoSave();
      }
    };

    const handleObjectModified = () => {
      saveToHistory(fabricCanvas);
      triggerAutoSave();
    };

    const handleTextEdited = () => {
      saveToHistory(fabricCanvas);
      triggerAutoSave();
    };

    const handleObjectRemoved = () => {
      saveToHistory(fabricCanvas);
      triggerAutoSave();
    };
    
    // Auto-save with debouncing
    const triggerAutoSave = () => {
      // Clear any existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Set new timer for responsive auto-save
      autoSaveTimerRef.current = setTimeout(() => {
        try {
          const data = JSON.stringify(fabricCanvas.toJSON());
          onSave(data);
          console.log('💾 Auto-save triggered');
        } catch (error) {
          console.error('❌ Auto-save failed:', error);
        }
      }, autoSaveDelay);
    };

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:dblclick', handleMouseDoubleClick);
    fabricCanvas.on('path:created', handlePathCreated);
    fabricCanvas.on('object:modified', handleObjectModified);
    fabricCanvas.on('text:changed', handleTextEdited);
    fabricCanvas.on('object:removed', handleObjectRemoved);

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:dblclick', handleMouseDoubleClick);
      fabricCanvas.off('path:created', handlePathCreated);
      fabricCanvas.off('object:modified', handleObjectModified);
      fabricCanvas.off('text:changed', handleTextEdited);
      fabricCanvas.off('object:removed', handleObjectRemoved);
    };
  }, [fabricCanvas, activeTool, brushColor, brushSize, saveToHistory]);

  // Handle keyboard events for deleting selected objects
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace key pressed
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects && activeObjects.length > 0) {
          // Prevent default browser behavior (like going back in history)
          e.preventDefault();
          
          // Remove all selected objects
          activeObjects.forEach(obj => {
            fabricCanvas.remove(obj);
          });
          
          // Discard active selection
          fabricCanvas.discardActiveObject();
          fabricCanvas.renderAll();
          
          // Save to history and trigger auto-save
          saveToHistory(fabricCanvas);
          
          // Auto-save after deletion
          if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
          }
          autoSaveTimerRef.current = setTimeout(() => {
            try {
              const data = JSON.stringify(fabricCanvas.toJSON());
              onSave(data);
              console.log('💾 Auto-save after deletion');
            } catch (error) {
              console.error('❌ Auto-save failed:', error);
            }
          }, autoSaveDelay);

          toast({
            title: "Object Deleted",
            description: `Deleted ${activeObjects.length} object(s)`,
          });
        }
      }
    };

    // Add global keyboard listener
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fabricCanvas, saveToHistory, onSave, autoSaveDelay, toast]);

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
    fabricCanvas.backgroundColor = '#f8f9fa';
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
    if (!fabricCanvas) {
      console.warn('⚠️ Cannot load: Canvas not initialized');
      return;
    }
    
    try {
      console.log('📂 Loading drawing data into canvas');
      fabricCanvas.loadFromJSON(data, () => {
        fabricCanvas.renderAll();
        saveToHistory(fabricCanvas);
        console.log('✅ Drawing loaded successfully');
      });
    } catch (error) {
      console.error('❌ Error loading drawing data:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load drawing data.",
        variant: "destructive",
      });
    }
  }, [fabricCanvas, saveToHistory, toast]);

  // Handle text dialog save
  const handleTextDialogSave = useCallback((text: string, fontSize: number, color: string) => {
    if (!fabricCanvas) return;

    if (editingTextObject) {
      // Update existing text object
      editingTextObject.set({
        text: text,
        fontSize: fontSize,
        fill: color,
      });
      fabricCanvas.renderAll();
    } else if (pendingTextPosition) {
      // Create new text object
      const textObject = new FabricText(text, {
        left: pendingTextPosition.x,
        top: pendingTextPosition.y,
        fontSize: fontSize,
        fill: color,
        selectable: true,
      });
      
      fabricCanvas.add(textObject);
      fabricCanvas.setActiveObject(textObject);
    }
    
    saveToHistory(fabricCanvas);
    setIsTextDialogOpen(false);
    setEditingTextObject(null);
    setPendingTextPosition(null);
  }, [fabricCanvas, editingTextObject, pendingTextPosition, saveToHistory]);

  // Export canvas to PNG
  const exportToPNG = useCallback(() => {
    if (!fabricCanvas) return null;
    try {
      return fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2, // Higher resolution
      });
    } catch (error) {
      console.error('Error exporting canvas to PNG:', error);
      return null;
    }
  }, [fabricCanvas]);

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    drawingActions: {
      undo,
      redo,
      clear,
      save,
      load,
      exportToPNG
    }
  }), [undo, redo, clear, save, load, exportToPNG]);

  return (
    <>
      <div className={`absolute inset-0 ${className}`} style={{ pointerEvents: 'auto' }}>
        <canvas 
          ref={canvasRef}
          className="absolute top-0 left-0 border border-dashed border-muted"
          style={{ 
            zIndex: 30,
            pointerEvents: 'auto',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.03)'
          }}
        />
      </div>
      
      <TextEditDialog
        isOpen={isTextDialogOpen}
        onClose={() => {
          setIsTextDialogOpen(false);
          setEditingTextObject(null);
          setPendingTextPosition(null);
        }}
        onSave={handleTextDialogSave}
        initialText={editingTextObject?.text || 'Enter text here'}
        initialFontSize={editingTextObject?.fontSize || Math.max(12, brushSize)}
        initialColor={editingTextObject?.fill as string || brushColor}
      />
    </>
  );
});