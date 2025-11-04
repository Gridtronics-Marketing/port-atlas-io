import { useState, useRef, useEffect } from 'react';
import { Plus, Minus, RotateCcw, ZoomIn, ZoomOut, RefreshCw, Camera, Paintbrush, Save, FileImage, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddDropPointModal } from './AddDropPointModal';
import { DropPointDetailsModal } from './DropPointDetailsModal';
import { AddRoomViewModal } from './AddRoomViewModal';
import { RoomViewModal } from './RoomViewModal';
import { FloorPlanDrawingToolbar, type DrawingTool } from './FloorPlanDrawingToolbar';
import { FloorPlanDrawingCanvas, type DrawingCanvasRef } from './FloorPlanDrawingCanvas';
import { FloorPlanDrawingViewer } from './FloorPlanDrawingViewer';
import { DropPointColorLegend } from './DropPointColorLegend';
import { FloorPlanUploadDialog } from './FloorPlanUploadDialog';
import { FloorPlanFilterDialog, type FloorPlanFilters } from './FloorPlanFilterDialog';
import { WalkThroughNotesPanel } from './WalkThroughNotesPanel';
import { useDropPoints } from '@/hooks/useDropPoints';
import { useRoomViews } from '@/hooks/useRoomViews';
import { useCanvasDrawings } from '@/hooks/useCanvasDrawings';
import { getStorageUrl, repairFloorPlanFiles } from '@/lib/storage-utils';
import { saveDrawingAsFloorPlan, deleteCanvasDrawing } from '@/lib/floor-plan-utils';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/uuid-utils';
import { supabase } from '@/integrations/supabase/client';

interface InteractiveFloorPlanProps {
  locationId: string;
  floorNumber: number;
  fileUrl?: string;
  filePath?: string; // Raw storage path
  fileName?: string;
  className?: string;
  onFloorPlanSaved?: () => void; // Callback when floor plan is saved
}

export const InteractiveFloorPlan = ({
  locationId,
  floorNumber,
  fileUrl,
  filePath,
  fileName,
  className = "",
  onFloorPlanSaved
}: InteractiveFloorPlanProps) => {
  const [scale, setScale] = useState(1.0);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [isAddingRoomView, setIsAddingRoomView] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddRoomViewModal, setShowAddRoomViewModal] = useState(false);
  const [clickCoordinates, setClickCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [selectedDropPoint, setSelectedDropPoint] = useState<any>(null);
  const [selectedRoomView, setSelectedRoomView] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [roomViewModalOpen, setRoomViewModalOpen] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState<any>(null);
  const [draggedRoomView, setDraggedRoomView] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 });
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [drawingData, setDrawingData] = useState<string>('');
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [filters, setFilters] = useState<FloorPlanFilters>({
    showDropPointLabels: true,
    showRoomViewDots: true,
    dropPointTypes: ['data', 'wifi', 'camera', 'mdf_idf', 'access_control', 'av', 'other'],
    dropPointStatuses: ['planned', 'roughed_in', 'finished', 'tested'],
  });
  const [hasSavedDrawing, setHasSavedDrawing] = useState(false);
  const [showUseAsFloorPlanDialog, setShowUseAsFloorPlanDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | undefined>(undefined);
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    item: any;
    type: 'dropPoint' | 'roomView';
    originalPosition: { x: number; y: number };
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
  const { toast } = useToast();
  
  // Only use hooks with valid UUID
  const validLocationId = locationId && isValidUUID(locationId) ? locationId : undefined;
  const { dropPoints, loading: dropPointsLoading, updateDropPoint, fetchDropPoints } = useDropPoints(validLocationId);
  const { roomViews, loading: roomViewsLoading, updateRoomView, fetchRoomViews } = useRoomViews(validLocationId);
  const { getDrawingForFloor, saveDrawing, refetch: refetchDrawings } = useCanvasDrawings(validLocationId);

  // Temporary storage for drawings when location doesn't exist yet
  const [tempDrawingData, setTempDrawingData] = useState<any>(() => {
    // Load from localStorage on init
    const storageKey = `temp-drawing-${floorNumber}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  });
  
  // Track if drawing data has been loaded to prevent infinite loops
  const drawingDataLoadedRef = useRef(false);
  
  // Generate the actual file URL from path or use provided URL
  const actualFileUrl = uploadedFileUrl || fileUrl || (filePath ? getStorageUrl('floor-plans', filePath) : undefined);

  // Filter drop points and room views for current floor
  const floorDropPoints = dropPoints.filter(dp => dp.floor === floorNumber);
  const floorRoomViews = roomViews.filter(rv => rv.floor === floorNumber);

  // Filter drop points and room views based on filters
  const filteredDropPoints = floorDropPoints.filter(dp => {
    const typeMatch = filters.dropPointTypes.includes(dp.point_type || 'data');
    const statusMatch = filters.dropPointStatuses.includes(dp.status || 'planned');
    return typeMatch && statusMatch;
  });

  const filteredRoomViews = filters.showRoomViewDots ? floorRoomViews : [];

  const getFileExtension = (url?: string, path?: string, name?: string) => {
    if (!url && !path && !name) return '';
    const source = name || path || url || '';
    return source.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(actualFileUrl, filePath, fileName);
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp', 'tiff'].includes(fileExtension);

  // Helper to extract coordinates from mouse or touch events
  const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if ('clientX' in e) {
      return { clientX: e.clientX, clientY: e.clientY };
    }
    return { clientX: 0, clientY: 0 };
  };

  // Update container dimensions for drawing canvas
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      // Provide fallback dimensions when no floor plan is uploaded
      const width = rect.width || 800;
      const height = actualFileUrl ? rect.height : 600; // Default height for blank canvas
      setContainerDimensions({ width, height });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [actualFileUrl]);

  // Cleanup save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);


  const handleContainerClick = (e: React.MouseEvent) => {
    // Don't handle clicks in drawing mode or when dragging
    if (isDrawingMode || isDragging) return;
    if ((!isAddingPoint && !isAddingRoomView) || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickCoordinates({ x, y });
    
    if (isAddingPoint) {
      setShowAddModal(true);
      setIsAddingPoint(false);
    } else if (isAddingRoomView) {
      setShowAddRoomViewModal(true);
      setIsAddingRoomView(false);
    }
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, item: any, type: 'dropPoint' | 'roomView') => {
    e.stopPropagation();
    e.preventDefault(); // Prevent scrolling on touch
    if (!containerRef.current) return;

    // Prevent dragging locked drop points
    if (type === 'dropPoint' && (item as any).is_locked) {
      toast({
        title: "Drop Point Locked",
        description: "This drop point is locked. Unlock it in the details modal to move it.",
        variant: "destructive",
      });
      return;
    }

    const { clientX, clientY } = getEventCoordinates(e);
    const rect = containerRef.current.getBoundingClientRect();
    const pointX = (item.x_coordinate / 100) * rect.width;
    const pointY = (item.y_coordinate / 100) * rect.height;
    
    if (type === 'dropPoint') {
      setDraggedPoint(item);
      setDraggedRoomView(null);
    } else {
      setDraggedRoomView(item);
      setDraggedPoint(null);
    }
    
    setIsMouseDown(true);
    setMouseDownPosition({ x: clientX, y: clientY });
    setDragOffset({
      x: clientX - rect.left - pointX,
      y: clientY - rect.top - pointY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !draggedPoint || !containerRef.current) return;

    // Calculate distance moved from initial mouse down position
    const distanceMoved = Math.sqrt(
      Math.pow(e.clientX - mouseDownPosition.x, 2) + 
      Math.pow(e.clientY - mouseDownPosition.y, 2)
    );

    // Only start dragging if mouse has moved more than 5 pixels
    if (!isDragging && distanceMoved > 5) {
      setIsDragging(true);
    }

    if (!isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

    // Constrain to container bounds
    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));

    // Update the dragged item's position temporarily
    if (draggedPoint) {
      setDraggedPoint(prev => ({
        ...prev,
        x_coordinate: constrainedX,
        y_coordinate: constrainedY
      }));
    } else if (draggedRoomView) {
      setDraggedRoomView(prev => ({
        ...prev,
        x_coordinate: constrainedX,
        y_coordinate: constrainedY
      }));
    }
  };

  const handleMouseUp = async () => {
    if (!isMouseDown) return;

    // If we were dragging, show confirmation dialog
    if (isDragging && draggedPoint) {
      const originalPoint = dropPoints.find(dp => dp.id === draggedPoint.id);
      setPendingMove({
        item: draggedPoint,
        type: 'dropPoint',
        originalPosition: {
          x: originalPoint?.x_coordinate || draggedPoint.x_coordinate,
          y: originalPoint?.y_coordinate || draggedPoint.y_coordinate
        }
      });
      setShowMoveConfirmation(true);
    } else if (isDragging && draggedRoomView) {
      const originalView = roomViews.find(rv => rv.id === draggedRoomView.id);
      setPendingMove({
        item: draggedRoomView,
        type: 'roomView',
        originalPosition: {
          x: originalView?.x_coordinate || draggedRoomView.x_coordinate,
          y: originalView?.y_coordinate || draggedRoomView.y_coordinate
        }
      });
      setShowMoveConfirmation(true);
    }

    setIsMouseDown(false);
    setIsDragging(false);
  };

  const handleConfirmMove = async () => {
    if (!pendingMove) return;
    
    try {
      if (pendingMove.type === 'dropPoint') {
        await updateDropPoint(pendingMove.item.id, {
          x_coordinate: pendingMove.item.x_coordinate,
          y_coordinate: pendingMove.item.y_coordinate
        });
        toast({
          title: "Drop Point Moved",
          description: `${pendingMove.item.label} has been repositioned.`,
        });
      } else if (pendingMove.type === 'roomView') {
        await updateRoomView(pendingMove.item.id, {
          x_coordinate: pendingMove.item.x_coordinate,
          y_coordinate: pendingMove.item.y_coordinate
        });
        toast({
          title: "Room View Moved",
          description: `${pendingMove.item.room_name || 'Room view'} has been repositioned.`,
        });
      }
    } catch (error) {
      console.error('Error updating position:', error);
      toast({
        title: "Error",
        description: "Failed to update position.",
        variant: "destructive",
      });
      // Refresh to revert to original position
      if (pendingMove.type === 'dropPoint') {
        await fetchDropPoints();
      } else {
        await fetchRoomViews();
      }
    } finally {
      setShowMoveConfirmation(false);
      setPendingMove(null);
      setDraggedPoint(null);
      setDraggedRoomView(null);
      setDragOffset({ x: 0, y: 0 });
      setMouseDownPosition({ x: 0, y: 0 });
    }
  };

  const handleCancelMove = async () => {
    // Refresh data to revert to original positions
    if (pendingMove?.type === 'dropPoint') {
      await fetchDropPoints();
    } else if (pendingMove?.type === 'roomView') {
      await fetchRoomViews();
    }
    
    setShowMoveConfirmation(false);
    setPendingMove(null);
    setDraggedPoint(null);
    setDraggedRoomView(null);
    setDragOffset({ x: 0, y: 0 });
    setMouseDownPosition({ x: 0, y: 0 });
  };

  // Add mouse and touch event listeners to handle dragging outside the container
  useEffect(() => {
    if (isMouseDown) {
      const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
        if (!containerRef.current || (!draggedPoint && !draggedRoomView)) return;
        
        const { clientX, clientY } = getEventCoordinates(e);
        
        // Calculate distance moved from initial mouse down position
        const distanceMoved = Math.sqrt(
          Math.pow(clientX - mouseDownPosition.x, 2) + 
          Math.pow(clientY - mouseDownPosition.y, 2)
        );

        // Only start dragging if pointer has moved more than 5 pixels
        if (!isDragging && distanceMoved > 5) {
          setIsDragging(true);
        }

        if (!isDragging) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left - dragOffset.x) / rect.width) * 100;
        const y = ((clientY - rect.top - dragOffset.y) / rect.height) * 100;

        const constrainedX = Math.max(0, Math.min(100, x));
        const constrainedY = Math.max(0, Math.min(100, y));

        if (draggedPoint) {
          setDraggedPoint(prev => ({
            ...prev,
            x_coordinate: constrainedX,
            y_coordinate: constrainedY
          }));
        } else if (draggedRoomView) {
          setDraggedRoomView(prev => ({
            ...prev,
            x_coordinate: constrainedX,
            y_coordinate: constrainedY
          }));
        }
      };

      const handleGlobalEnd = () => {
        handleMouseUp();
      };

      document.addEventListener('mousemove', handleGlobalMove);
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchmove', handleGlobalMove, { passive: false });
      document.addEventListener('touchend', handleGlobalEnd);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMove);
        document.removeEventListener('mouseup', handleGlobalEnd);
        document.removeEventListener('touchmove', handleGlobalMove);
        document.removeEventListener('touchend', handleGlobalEnd);
      };
    }
  }, [isMouseDown, isDragging, draggedPoint, draggedRoomView, dragOffset, mouseDownPosition]);

  const adjustScale = (increment: boolean) => {
    setScale(prev => {
      const newScale = increment ? prev + 0.2 : prev - 0.2;
      return Math.max(0.5, Math.min(3.0, newScale));
    });
  };

  const resetScale = () => setScale(1.0);

  // Handle drop point modal close with refresh
  const handleDropPointDetailsClose = (open: boolean) => {
    setDetailsModalOpen(open);
    if (!open) {
      setSelectedDropPoint(null);
      // Refresh drop points to show any updates
      fetchDropPoints();
    }
  };

  // Drawing functions
  const handleDrawingToolChange = (tool: DrawingTool) => {
    console.log('✅ Drawing tool changed to:', tool);
    
    setActiveTool(tool);
    
    // When switching to select mode, reset adding states and exit drawing mode
    if (tool === 'select') {
      setIsAddingPoint(false);
      setIsAddingRoomView(false);
      setIsDrawingMode(false);
    } else {
      // For any drawing tool, ensure drawing mode is enabled
      setIsDrawingMode(true);
      setIsAddingPoint(false);
      setIsAddingRoomView(false);
      
      // Validate drawing canvas is ready
      if (!drawingCanvasRef.current) {
        console.warn('⚠️ Drawing canvas not ready, waiting...');
        toast({
          title: "Drawing Mode",
          description: "Initializing drawing canvas, please wait a moment...",
        });
        return;
      }
      
      console.log('✅ Drawing mode activated successfully');
    }
  };

  const handleDrawingHistoryChange = (canUndoValue: boolean, canRedoValue: boolean) => {
    setCanUndo(canUndoValue);
    setCanRedo(canRedoValue);
  };

  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const handleDrawingSave = async (data: string) => {
    // Debounce to prevent double submit
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (isSaving) {
        console.log('⏳ Save already in progress, skipping...');
        return;
      }

      console.log('💾 Saving drawing data...');
      setIsSaving(true);
      setDrawingData(data);
      
      if (!locationId || !isValidUUID(locationId)) {
        // Store temporarily in state and localStorage
        const parsedData = JSON.parse(data);
        setTempDrawingData(parsedData);
        
        const storageKey = `temp-drawing-${floorNumber}`;
        localStorage.setItem(storageKey, data);
        
        console.log('💾 Drawing saved to localStorage');
        setHasSavedDrawing(true);
        setIsSaving(false);
        
        toast({
          title: "Floorplan updated",
          description: "Drawing saved locally",
        });
        
        // Emit event
        window.dispatchEvent(new CustomEvent('FLOORPLAN_SAVED', { 
          detail: { locationId, floorNumber, local: true } 
        }));
        return;
      }
      
      try {
        // Save to database
        const result = await saveDrawing({
          location_id: locationId,
          floor_number: floorNumber,
          canvas_data: JSON.parse(data)
        });
        
        if (result) {
          // Clear temporary storage after successful save
          const storageKey = `temp-drawing-${floorNumber}`;
          localStorage.removeItem(storageKey);
          setHasSavedDrawing(true);
          
          // Refetch latest data to ensure UI is in sync
          await refetchDrawings();
          
          console.log('💾 Drawing saved to database');
          
          toast({
            title: "Floorplan updated",
            description: "Drawing saved successfully",
          });
          
          // Emit events
          window.dispatchEvent(new CustomEvent('FLOORPLAN_SAVED', { 
            detail: { locationId, floorNumber, drawingId: result.id } 
          }));
          window.dispatchEvent(new CustomEvent('DROPS_UPDATED', { 
            detail: { locationId, floorNumber } 
          }));
        } else {
          throw new Error('Save operation returned no result');
        }
      } catch (error) {
        console.error('❌ Error saving drawing:', error);
        
        toast({
          title: "Save failed",
          description: error instanceof Error ? error.message : "Failed to save drawing. Please try again.",
          variant: "destructive",
        });
        
        // Rollback optimistic UI update if needed
        // Drawing data already set, but we can show error state
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  const handleDrawingLoad = () => {
    const savedDrawing = getDrawingForFloor(floorNumber);
    if (savedDrawing && drawingCanvasRef.current?.drawingActions) {
      const canvasDataStr = JSON.stringify(savedDrawing.canvas_data);
      drawingCanvasRef.current.drawingActions.load(canvasDataStr);
      setDrawingData(canvasDataStr);
    }
  };

  // Load saved drawing data on mount and when floor changes
  useEffect(() => {
    console.log('🔄 Drawing data load effect triggered');
    
    // Reset the loaded flag when floor changes
    if (!drawingDataLoadedRef.current) {
      if (!isValidUUID(locationId)) {
        // Load temporary data if available
        if (tempDrawingData && isDrawingMode && drawingCanvasRef.current?.drawingActions) {
          console.log('📂 Loading temporary drawing data');
          const canvasDataStr = JSON.stringify(tempDrawingData);
          drawingCanvasRef.current.drawingActions.load(canvasDataStr);
          setDrawingData(canvasDataStr);
          setHasSavedDrawing(true);
          drawingDataLoadedRef.current = true;
        }
        return;
      }

      const savedDrawing = getDrawingForFloor(floorNumber);
      if (savedDrawing) {
        console.log('📂 Loading saved drawing data from database');
        const canvasDataStr = JSON.stringify(savedDrawing.canvas_data);
        setDrawingData(canvasDataStr);
        setHasSavedDrawing(true);
        
        // Auto-load into canvas if drawing mode is active
        if (isDrawingMode && drawingCanvasRef.current?.drawingActions) {
          drawingCanvasRef.current.drawingActions.load(canvasDataStr);
          drawingDataLoadedRef.current = true;
        }
      } else {
        setHasSavedDrawing(false);
      }
    }
  }, [locationId, floorNumber, getDrawingForFloor, isDrawingMode]);
  
  // Reset loaded flag when floor changes
  useEffect(() => {
    drawingDataLoadedRef.current = false;
  }, [floorNumber]);

  // Real-time subscription for canvas drawings
  useEffect(() => {
    if (!validLocationId) return;
    
    const channel = supabase
      .channel('canvas-drawing-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'canvas_drawings', 
          filter: `location_id=eq.${validLocationId}` 
        },
        (payload) => {
          if (payload.new.floor_number === floorNumber) {
            const newData = JSON.stringify(payload.new.canvas_data);
            setDrawingData(newData);
            
            // Auto-load into canvas if in draw mode
            if (isDrawingMode && drawingCanvasRef.current?.drawingActions) {
              drawingCanvasRef.current.drawingActions.load(newData);
            }
          }
        }
      )
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [validLocationId, floorNumber, isDrawingMode]);

  const handleRepairFiles = async () => {
    setIsRepairing(true);
    try {
      await repairFloorPlanFiles(locationId);
      toast({
        title: "Files Repaired",
        description: "Floor plan files have been repaired and linked to the location.",
      });
      // Refresh the page to see updated data
      window.location.reload();
    } catch (error) {
      console.error('Error repairing files:', error);
      toast({
        title: "Repair Failed",
        description: "Failed to repair floor plan files. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const handleUseAsFloorPlan = () => {
    setShowUseAsFloorPlanDialog(true);
  };

  const confirmUseAsFloorPlan = async () => {
    if (isSaving) {
      console.log('⏳ Save already in progress, skipping...');
      return;
    }

    if (!drawingCanvasRef.current?.drawingActions || !validLocationId) {
      toast({
        title: "Error",
        description: "Cannot convert drawing to floor plan.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const pngDataURL = drawingCanvasRef.current.drawingActions.exportToPNG();
      if (!pngDataURL) {
        toast({
          title: "Error",
          description: "Failed to export drawing. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Converting to floor plan",
        description: "Please wait...",
      });

      const result = await saveDrawingAsFloorPlan(validLocationId, floorNumber, pngDataURL);
      
      if (result.success) {
        // Delete the canvas drawing since it's now a permanent floor plan
        await deleteCanvasDrawing(validLocationId, floorNumber);
        
        // Refetch latest data to ensure UI is in sync
        await refetchDrawings();
        await fetchDropPoints();
        
        // Exit drawing mode and refresh
        setIsDrawingMode(false);
        setHasSavedDrawing(false);
        
        toast({
          title: "Floorplan updated",
          description: "Floor plan saved successfully. You can now add drop points or continue editing.",
        });
        
        // Refresh room views to ensure they're up to date
        if (validLocationId) {
          fetchRoomViews();
        }
        
        // Emit events
        window.dispatchEvent(new CustomEvent('FLOORPLAN_SAVED', { 
          detail: { locationId: validLocationId, floorNumber, filePath: result.filePath } 
        }));
        window.dispatchEvent(new CustomEvent('DROPS_UPDATED', { 
          detail: { locationId: validLocationId, floorNumber } 
        }));
        
        // Call the callback to refresh the parent component
        if (onFloorPlanSaved) {
          onFloorPlanSaved();
        }
      } else {
        throw new Error(result.error || 'Failed to save as floor plan');
      }
    } catch (error) {
      console.error('❌ Error converting to floor plan:', error);
      
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save as floor plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setShowUseAsFloorPlanDialog(false);
    }
  };

  const handleUploadSuccess = (newFileUrl: string) => {
    setUploadedFileUrl(newFileUrl);
    setIsDrawingMode(true);
    setActiveTool('pencil');
  };

  const getDropPointIcon = (type: string) => {
    const icons = {
      data: '📡',
      fiber: '🌐', 
      security: '🔒',
      wireless: '📶',
      power: '⚡'
    };
    return icons[type as keyof typeof icons] || '📡';
  };

  const getDropPointColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-red-500 border-red-600';
      case 'roughed_in':
        return 'bg-yellow-500 border-yellow-600';
      case 'finished':
        return 'bg-green-500 border-green-600';
      case 'tested':
        return 'bg-green-500 border-green-600';
      // Legacy status support
      case 'installed':
        return 'bg-blue-500 border-blue-600';
      case 'active':
        return 'bg-green-500 border-green-600';
      case 'inactive':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-red-500 border-red-600';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'text-red-600';
      case 'roughed_in':
        return 'text-yellow-600';
      case 'finished':
        return 'text-green-600';
      case 'tested':
        return 'text-green-600';
      // Legacy status support
      case 'installed':
        return 'text-blue-600';
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-red-600';
      default:
        return 'text-red-600';
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Floor {floorNumber} - Interactive Plan
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Map
            </Button>
            <FloorPlanFilterDialog
              filters={filters}
              onFiltersChange={setFilters}
              isDrawingMode={isDrawingMode}
            />
            <Button
              variant={isDrawingMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const newDrawingMode = !isDrawingMode;
                setIsDrawingMode(newDrawingMode);
                
                // Auto-activate pencil tool when entering drawing mode
                if (newDrawingMode) {
                  setActiveTool('pencil');
                  toast({
                    title: "Drawing Mode Active",
                    description: "Use the toolbar to start drawing on your floor plan",
                  });
                } else {
                  setActiveTool('select');
                }
              }}
              data-draw-mode-button
            >
              <Paintbrush className="h-4 w-4 mr-2" />
              {isDrawingMode ? 'Exit Draw' : 'Draw Mode'}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant={isAddingPoint ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsAddingPoint(!isAddingPoint);
                        setIsAddingRoomView(false);
                        setIsDrawingMode(false);
                        setActiveTool('select');
                      }}
                      disabled={isDrawingMode || !validLocationId}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Drop Point
                    </Button>
                  </span>
                </TooltipTrigger>
                {!validLocationId && (
                  <TooltipContent>
                    <p>Save the location first to add drop points</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant={isAddingRoomView ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsAddingRoomView(!isAddingRoomView);
                        setIsAddingPoint(false);
                        setIsDrawingMode(false);
                        setActiveTool('select');
                      }}
                      disabled={isDrawingMode || !validLocationId}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Add Room View
                    </Button>
                  </span>
                </TooltipTrigger>
                {!validLocationId && (
                  <TooltipContent>
                    <p>Save the location first to add room views</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            {actualFileUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    toast({
                      title: "Generating PDF",
                      description: "Creating composite image with all annotations...",
                    });

                    // Get canvas drawing as PNG if in drawing mode
                    const canvasDrawingUrl = drawingCanvasRef.current?.drawingActions?.exportToPNG();
                    
                    // Create composite image with all layers
                    const { createCompositeFloorPlan } = await import('@/lib/floor-plan-composite');
                    const compositeUrl = await createCompositeFloorPlan({
                      baseImageUrl: actualFileUrl,
                      canvasDrawingDataUrl: canvasDrawingUrl,
                      dropPoints: floorDropPoints.map(dp => ({
                        x: dp.x_coordinate || 0,
                        y: dp.y_coordinate || 0,
                        label: dp.label,
                        type: dp.point_type || 'data',
                        status: dp.status || 'planned'
                      })),
                      roomViews: floorRoomViews.map(rv => ({
                        x: rv.x_coordinate || 0,
                        y: rv.y_coordinate || 0,
                        label: rv.room_name || 'Room'
                      })),
                      width: containerDimensions.width || 800,
                      height: containerDimensions.height || 600
                    });

                    // Export to PDF with composite image
                    const { exportFloorPlanToPDF } = await import('@/lib/floor-plan-exporter');
                    await exportFloorPlanToPDF(
                      locationId, 
                      floorNumber, 
                      actualFileUrl, 
                      {
                        title: `Floor ${floorNumber} Plan`,
                        includeDropPoints: true,
                        includeRoomViews: true,
                        includeMetadata: true,
                      },
                      compositeUrl
                    );
                    
                    toast({
                      title: "PDF Export Complete",
                      description: "Floor plan with all annotations has been exported successfully.",
                    });
                  } catch (error) {
                    console.error('Error exporting PDF:', error);
                    toast({
                      title: "Export Failed",
                      description: "Failed to export floor plan to PDF. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <FileImage className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            )}
            {!actualFileUrl && filePath && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRepairFiles}
                disabled={isRepairing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
                Repair Files
              </Button>
            )}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => adjustScale(false)}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="px-2">
                {Math.round(scale * 100)}%
              </Badge>
              <Button variant="outline" size="sm" onClick={() => adjustScale(true)}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetScale}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {(floorDropPoints.length > 0 || floorRoomViews.length > 0) && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {floorDropPoints.length > 0 && (
                <span>{floorDropPoints.length} drop points on this floor</span>
              )}
              {floorRoomViews.length > 0 && (
                <span>{floorRoomViews.length} room views on this floor</span>
              )}
            </div>
            {floorDropPoints.length > 0 && (
              <DropPointColorLegend />
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drawing Toolbar */}
        {isDrawingMode && (
          <FloorPlanDrawingToolbar
            activeTool={activeTool}
            onToolChange={handleDrawingToolChange}
            onUndo={() => drawingCanvasRef.current?.drawingActions?.undo()}
            onRedo={() => drawingCanvasRef.current?.drawingActions?.redo()}
            onClear={() => drawingCanvasRef.current?.drawingActions?.clear()}
            onSave={() => drawingCanvasRef.current?.drawingActions?.save()}
            onLoad={handleDrawingLoad}
            canUndo={canUndo}
            canRedo={canRedo}
            brushColor={brushColor}
            onBrushColorChange={setBrushColor}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            onUseAsFloorPlan={validLocationId ? handleUseAsFloorPlan : undefined}
            hasSavedDrawing={hasSavedDrawing}
            isSaving={isSaving}
          />
        )}
        <div 
          ref={containerRef}
          className={`relative bg-muted rounded-lg overflow-hidden ${
            isDragging ? 'cursor-grabbing' : 
            isDrawingMode ? '' : 'cursor-pointer'
          }`}
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            height: 'auto',
            minHeight: '400px',
            pointerEvents: isDrawingMode ? 'none' : 'auto',
            touchAction: isDragging ? 'none' : 'auto',
          }}
          onClick={handleContainerClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Background Content */}
          {isImage && actualFileUrl ? (
            <img
              src={actualFileUrl}
              alt={`Floor ${floorNumber} plan`}
              className="w-full h-auto"
              style={{ display: 'block' }}
              onError={(e) => {
                console.error('Image failed to load:', actualFileUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : filePath ? (
            <div className="w-full h-96 bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground space-y-2">
                <p className="text-sm font-medium">Floor plan file found but not accessible</p>
                <p className="text-xs">File path: {filePath}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRepairFiles}
                  disabled={isRepairing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
                  Repair File Access
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-96 bg-muted/10 flex items-center justify-center border border-dashed border-muted-foreground/20">
              <div className="text-center space-y-4">
                <div className="text-muted-foreground">
                  {!isDrawingMode ? (
                    <>
                      <FileImage className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No Floor Plan Uploaded</p>
                      <p className="text-sm mt-2">Click "Draw Mode" button above to start drawing</p>
                    </>
                  ) : (
                    <>
                      <Paintbrush className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Blank Canvas Ready</p>
                      <p className="text-sm mt-2">Use the toolbar above to draw your floor plan</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Drawing Canvas Overlay - Edit Mode */}
          {containerDimensions.width > 0 && isDrawingMode && (
            <FloorPlanDrawingCanvas
              key="drawing-canvas-edit"
              ref={drawingCanvasRef}
              width={containerDimensions.width * scale}
              height={containerDimensions.height * scale}
              activeTool={activeTool}
              brushColor={brushColor}
              brushSize={brushSize}
              onHistoryChange={handleDrawingHistoryChange}
              onSave={handleDrawingSave}
              savedData={drawingData}
              className="pointer-events-auto"
            />
          )}

          {/* Drawing Canvas Overlay - View Mode */}
          {containerDimensions.width > 0 && !isDrawingMode && drawingData && (
            <FloorPlanDrawingViewer
              key="drawing-canvas-view"
              width={containerDimensions.width * scale}
              height={containerDimensions.height * scale}
              drawingData={drawingData}
            />
          )}

          {/* Drop Points Overlay - Only show for valid locations */}
          {validLocationId && (
            <TooltipProvider>
              {filteredDropPoints.map((point) => {
                // Use dragged point coordinates if this point is being dragged
                const displayPoint = draggedPoint && draggedPoint.id === point.id ? draggedPoint : point;
                
                return (
                  <Tooltip key={point.id}>
                    <TooltipTrigger asChild>
                       <>
                          <div
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-white font-bold hover:scale-110 transition-transform shadow-lg ${
                              draggedPoint && draggedPoint.id === point.id 
                                ? `cursor-grabbing scale-110 ${getDropPointColor(point.status)}` 
                                : `cursor-grab ${getDropPointColor(point.status)}`
                            }`}
                           onMouseDown={(e) => !isDrawingMode && handlePointerDown(e, point, 'dropPoint')}
                           onTouchStart={(e) => !isDrawingMode && handlePointerDown(e, point, 'dropPoint')}
                           onClick={(e) => {
                             e.stopPropagation();
                             if (!isDragging && !isDrawingMode) {
                               setSelectedDropPoint(point);
                               setDetailsModalOpen(true);
                             }
                           }}
                           style={{
                             ...{
                               left: `${displayPoint.x_coordinate || 50}%`,
                               top: `${displayPoint.y_coordinate || 50}%`,
                               zIndex: draggedPoint && draggedPoint.id === point.id ? 50 : 10,
                             },
                             pointerEvents: isDrawingMode ? 'none' : 'auto'
                           }}
                         >
                            <span className="text-[10px]">{getDropPointIcon(point.point_type)}</span>
                            {point.status === 'tested' && (
                              <div className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold">✓</div>
                            )}
                         </div>
                          
                           {/* Persistent Label for Drop Point - Updated with Cable Count */}
                           {filters.showDropPointLabels && (
                            <div
                              className="absolute pointer-events-none select-none"
                              style={{
                                left: `${displayPoint.x_coordinate || 50}%`,
                                top: `${displayPoint.y_coordinate || 50}%`,
                                transform: 'translate(20px, -50%)',
                                zIndex: 5,
                              }}
                            >
                            <div className="bg-black/80 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-md text-[10px] whitespace-nowrap shadow-md border border-white/20">
                                <div className="font-medium text-blue-300 text-[10px]">
                                  {point.cable_count ? `${point.cable_count} Cable${point.cable_count > 1 ? 's' : ''}` : 'TBD'}
                                </div>
                                <div className="font-medium">{point.label || 'TBD'}</div>
                              </div>
                            </div>
                          )}
                       </>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover border">
                      <div className="text-sm">
                        <p className="font-medium">{point.label}</p>
                        <p className="text-muted-foreground">{point.room}</p>
                        <p className="text-xs capitalize">{point.point_type} • {point.status}</p>
                        <p className="text-xs text-muted-foreground mt-1">Click and drag to move</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Room Views Overlay - Only show for valid locations */}
              {floorRoomViews.map((roomView) => {
              // Use dragged room view coordinates if this room view is being dragged
              const displayRoomView = draggedRoomView && draggedRoomView.id === roomView.id ? draggedRoomView : roomView;
              
              return (
                <Tooltip key={roomView.id}>
                  <TooltipTrigger asChild>
                     <>
                       <div
                         className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-600 border-2 border-blue-700 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg ${
                           draggedRoomView && draggedRoomView.id === roomView.id 
                             ? 'cursor-grabbing scale-110' 
                             : 'cursor-grab'
                         }`}
                         style={{
                           left: `${displayRoomView.x_coordinate || 50}%`,
                           top: `${displayRoomView.y_coordinate || 50}%`,
                           zIndex: draggedRoomView && draggedRoomView.id === roomView.id ? 50 : 15,
                           pointerEvents: isDrawingMode ? 'none' : 'auto'
                         }}
                         onMouseDown={(e) => !isDrawingMode && handlePointerDown(e, roomView, 'roomView')}
                         onTouchStart={(e) => !isDrawingMode && handlePointerDown(e, roomView, 'roomView')}
                         onClick={(e) => {
                           e.stopPropagation();
                           if (!isDragging && !isDrawingMode) {
                             setSelectedRoomView(roomView);
                             setRoomViewModalOpen(true);
                           }
                         }}
                       >
                         <Camera className="h-4 w-4" />
                        </div>
                      </>
                 </TooltipTrigger>
                <TooltipContent className="bg-popover border">
                  <div className="text-sm">
                    <p className="font-medium">{roomView.room_name || 'Room View'}</p>
                    {roomView.description && (
                      <p className="text-muted-foreground">{roomView.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      By {roomView.employee?.first_name} {roomView.employee?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Click to view photo</p>
                  </div>
                </TooltipContent>
                </Tooltip>
              );
              })}
            </TooltipProvider>
          )}

          {/* Add Point Indicators */}
          {isAddingPoint && (
            <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium z-10">
              Click anywhere on the plan to add a drop point
            </div>
          )}
          {isAddingRoomView && (
            <div className="absolute top-4 left-4 bg-blue-600/90 text-white px-3 py-2 rounded-lg text-sm font-medium z-10">
              Click anywhere on the plan to add a room view camera
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-1">Interactive Controls:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Add Drop Point:</strong> Click the button above, then click on the plan</li>
            <li>• <strong>Add Room View:</strong> Click the camera button above, then click on the plan to capture a photo</li>
            <li>• <strong>Move Drop Point:</strong> Click and drag existing points to reposition them</li>
            <li>• <strong>Drawing Mode:</strong> Use pencil, text, or eraser tools to annotate the floor plan</li>
            <li>• <strong>Edit Drawings:</strong> Use select tool to click, move, resize or delete drawn elements (Delete/Backspace key)</li>
            <li>• <strong>Zoom:</strong> Use the zoom controls or mouse wheel</li>
            <li>• <strong>View Details:</strong> Click on existing drop points or room view cameras</li>
          </ul>
        </div>
      </CardContent>

      {/* Add Drop Point Modal */}
      <AddDropPointModal
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) {
            setClickCoordinates(null);
            fetchDropPoints(); // Refresh drop points after adding
          }
        }}
        locationId={locationId}
        coordinates={clickCoordinates || undefined}
        floor={floorNumber}
      />

      {/* Add Room View Modal */}
      <AddRoomViewModal
        open={showAddRoomViewModal}
        onOpenChange={(open) => {
          setShowAddRoomViewModal(open);
          if (!open) {
            setClickCoordinates(null);
          }
        }}
        locationId={locationId}
        coordinates={clickCoordinates || undefined}
        floor={floorNumber}
        onSuccess={() => {
          // Refresh room views after successful addition
          fetchRoomViews();
        }}
      />

      {/* Drop Point Details Modal */}
      <DropPointDetailsModal
        open={detailsModalOpen}
        onOpenChange={handleDropPointDetailsClose}
        dropPoint={selectedDropPoint}
        locationId={locationId}
      />

      {/* Room View Modal */}
        <RoomViewModal
          open={roomViewModalOpen}
          onOpenChange={setRoomViewModalOpen}
          roomView={selectedRoomView}
          locationId={locationId}
        />

      {/* Move Confirmation Dialog */}
      <AlertDialog open={showMoveConfirmation} onOpenChange={setShowMoveConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Move</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this {pendingMove?.type === 'dropPoint' ? 'drop point' : 'room view'}?
              {pendingMove?.type === 'dropPoint' && pendingMove.item?.label && 
                ` (${pendingMove.item.label})`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelMove}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMove}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Use As Floor Plan Confirmation Dialog */}
      <AlertDialog open={showUseAsFloorPlanDialog} onOpenChange={setShowUseAsFloorPlanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use Drawing as Floor Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will convert your drawing into a permanent floor plan image for Floor {floorNumber}.
              The current floor plan (if any) will be replaced, and your drawing annotations will become
              part of the background image.
              <br /><br />
              <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUseAsFloorPlan}>
              Confirm & Create Floor Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Floor Plan Dialog */}
      <FloorPlanUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        locationId={locationId}
        floorNumber={floorNumber}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Walk-Through Notes Panel */}
      {validLocationId && (
        <WalkThroughNotesPanel locationId={locationId} floor={floorNumber} />
      )}
    </Card>
  );
};