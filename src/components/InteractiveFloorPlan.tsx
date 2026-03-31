import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Camera, FileImage, Upload, Trash2, Route, Lock, Unlock, Globe, Filter, MoreHorizontal, RefreshCw, Edit } from 'lucide-react';
import { DropPointShape } from '@/lib/drop-point-shapes';
import { formatCableLabel } from '@/lib/cable-label-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
import { FloorPlanUploadDialog } from './FloorPlanUploadDialog';
import { FloorPlanFilterDialog, type FloorPlanFilters } from './FloorPlanFilterDialog';
import { AddWirePathModal } from './AddWirePathModal';
import { useDropPoints } from '@/hooks/useDropPoints';
import { useRoomViews } from '@/hooks/useRoomViews';
import { useWirePaths, WirePath } from '@/hooks/useWirePaths';
import { useFloorPlanDrawing } from '@/hooks/useFloorPlanDrawing';
import { getSignedStorageUrl, getFloorPlanImagePath, removeFloorPlanFromLocation } from '@/lib/storage-utils';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/uuid-utils';
import { supabase } from '@/integrations/supabase/client';

interface InteractiveFloorPlanProps {
  locationId: string;
  floorNumber: number;
  fileUrl?: string;
  filePath?: string;
  fileName?: string;
  className?: string;
  onFloorPlanSaved?: () => void;
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
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [isAddingRoomView, setIsAddingRoomView] = useState(false);
  const [isDrawingWirePath, setIsDrawingWirePath] = useState(false);
  const [currentWirePathPoints, setCurrentWirePathPoints] = useState<{ x: number; y: number }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddRoomViewModal, setShowAddRoomViewModal] = useState(false);
  const [showAddWirePathModal, setShowAddWirePathModal] = useState(false);
  const [clickCoordinates, setClickCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [selectedDropPoint, setSelectedDropPoint] = useState<any>(null);
  const [selectedRoomView, setSelectedRoomView] = useState<any>(null);
  const [selectedWirePath, setSelectedWirePath] = useState<WirePath | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [roomViewModalOpen, setRoomViewModalOpen] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState<any>(null);
  const [draggedRoomView, setDraggedRoomView] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [filters, setFilters] = useState<FloorPlanFilters>({
    showDropPointLabels: true,
    showRoomViewDots: true,
    showWirePaths: true,
    dropPointTypes: ['data', 'wifi', 'camera', 'mdf', 'idf', 'access_control', 'av', 'other'],
    dropPointStatuses: ['planned', 'roughed_in', 'finished', 'tested'],
    trades: [],
    markerScale: 1,
  });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadDialogDefaultTab, setUploadDialogDefaultTab] = useState<'upload' | 'satellite'>('upload');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | undefined>(undefined);
  const [floorPlanFiles, setFloorPlanFiles] = useState<Record<string, any> | null>(null);
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    item: any;
    type: 'dropPoint' | 'roomView';
    originalPosition: { x: number; y: number };
  } | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pinch zoom tracking
  const lastPinchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  const { isSaving: isDrawingSaving } = useFloorPlanDrawing(locationId, floorNumber);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const validLocationId = locationId && isValidUUID(locationId) ? locationId : undefined;
  const { dropPoints, loading: dropPointsLoading, updateDropPoint, deleteDropPoint, fetchDropPoints } = useDropPoints(validLocationId);
  const [contextDeleteTarget, setContextDeleteTarget] = useState<any>(null);
  const [contextDeleteRoomViewTarget, setContextDeleteRoomViewTarget] = useState<any>(null);
  const [contextDeleteWirePathTarget, setContextDeleteWirePathTarget] = useState<WirePath | null>(null);
  const { roomViews, loading: roomViewsLoading, updateRoomView, deleteRoomView, fetchRoomViews } = useRoomViews(validLocationId);
  const { wirePaths, loading: wirePathsLoading, deleteWirePath, refetch: fetchWirePaths } = useWirePaths(validLocationId, floorNumber);

  const [resolvedFileUrl, setResolvedFileUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (uploadedFileUrl || fileUrl) {
      setResolvedFileUrl(uploadedFileUrl || fileUrl);
    } else if (filePath) {
      getSignedStorageUrl('floor-plans', filePath).then(url => setResolvedFileUrl(url));
    } else {
      setResolvedFileUrl(undefined);
    }
  }, [uploadedFileUrl, fileUrl, filePath]);

  const actualFileUrl = resolvedFileUrl;

  const floorDropPoints = dropPoints.filter(dp => dp.floor === floorNumber);
  const floorRoomViews = roomViews.filter(rv => rv.floor === floorNumber);

  const filteredDropPoints = floorDropPoints.filter(dp => {
    const typeMatch = filters.dropPointTypes.includes(dp.point_type || 'data');
    const statusMatch = filters.dropPointStatuses.includes(dp.status || 'planned');
    const tradeMatch = filters.trades.length === 0 || filters.trades.includes((dp as any).trade || 'low_voltage');
    return typeMatch && statusMatch && tradeMatch;
  });
  const filteredRoomViews = filters.showRoomViewDots ? floorRoomViews : [];
  const filteredWirePaths = filters.showWirePaths ? wirePaths : [];

  const getFileExtension = (url?: string, path?: string, name?: string) => {
    if (!url && !path && !name) return '';
    const source = name || path || url || '';
    const cleanSource = source.split('?')[0].split('#')[0];
    return cleanSource.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(actualFileUrl, filePath, fileName);
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp', 'tiff'].includes(fileExtension);

  const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if ('clientX' in e) {
      return { clientX: e.clientX, clientY: e.clientY };
    }
    return { clientX: 0, clientY: 0 };
  };

  // Load floor plan files from location
  useEffect(() => {
    if (!validLocationId) return;
    const loadFloorPlanFiles = async () => {
      const { data } = await supabase
        .from('locations')
        .select('floor_plan_files')
        .eq('id', locationId)
        .single();
      if (data?.floor_plan_files) {
        setFloorPlanFiles(data.floor_plan_files as Record<string, any>);
        if (!fileUrl && !filePath) {
          const imagePath = getFloorPlanImagePath(
            data.floor_plan_files as Record<string, any>,
            floorNumber.toString()
          );
          if (imagePath) {
            const url = await getSignedStorageUrl('floor-plans', imagePath);
            if (url) setResolvedFileUrl(url);
          }
        }
      }
    };
    loadFloorPlanFiles();
  }, [locationId, validLocationId, floorNumber, fileUrl, filePath]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setContainerDimensions({ width: rect.width || 800, height: actualFileUrl ? rect.height : 600 });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [actualFileUrl]);

  // --- Pan & Zoom ---

  // Convert screen coordinates to percentage coordinates on the floor plan content
  const screenToContentPercent = useCallback((clientX: number, clientY: number) => {
    if (!contentRef.current) return { x: 50, y: 50 };
    const rect = contentRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  // Wheel zoom (zoom toward cursor)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(5, scale * delta));

    // Adjust pan so zoom centers on cursor
    const scaleChange = newScale / scale;
    const newPanX = cursorX - scaleChange * (cursorX - panOffset.x);
    const newPanY = cursorY - scaleChange * (cursorY - panOffset.y);

    setScale(newScale);
    setPanOffset({ x: newPanX, y: newPanY });
  }, [scale, panOffset]);

  // Touch handlers for pinch zoom + pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isMouseDown) return; // drop point drag in progress
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1 && !isAddingPoint && !isAddingRoomView && !isDrawingWirePath) {
      setIsPanning(true);
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [isMouseDown, isAddingPoint, isAddingRoomView, isDrawingWirePath]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isMouseDown) return;
    if (e.touches.length === 2 && lastPinchDistance.current !== null && containerRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = dist / lastPinchDistance.current;
      const newScale = Math.max(0.3, Math.min(5, scale * delta));

      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = centerX - rect.left;
      const cy = centerY - rect.top;

      const scaleChange = newScale / scale;
      const newPanX = cx - scaleChange * (cx - panOffset.x);
      const newPanY = cy - scaleChange * (cy - panOffset.y);

      // Also pan with two-finger drag
      if (lastTouchCenter.current) {
        const panDx = centerX - lastTouchCenter.current.x;
        const panDy = centerY - lastTouchCenter.current.y;
        setPanOffset({ x: newPanX + panDx, y: newPanY + panDy });
      } else {
        setPanOffset({ x: newPanX, y: newPanY });
      }

      setScale(newScale);
      lastPinchDistance.current = dist;
      lastTouchCenter.current = { x: centerX, y: centerY };
    } else if (e.touches.length === 1 && isPanning) {
      const dx = e.touches[0].clientX - lastPanPoint.x;
      const dy = e.touches[0].clientY - lastPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [isMouseDown, scale, panOffset, isPanning, lastPanPoint]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
    lastTouchCenter.current = null;
    setIsPanning(false);
  }, []);

  // Mouse pan (drag on empty space)
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on left click when not in add/draw mode and not clicking a drop point
    if (e.button !== 0) return;
    if (isAddingPoint || isAddingRoomView || isDrawingWirePath) return;
    if (isMouseDown) return; // drop point drag
    // Start panning
    setIsPanning(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  }, [isAddingPoint, isAddingRoomView, isDrawingWirePath, isMouseDown]);

  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && !isMouseDown) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, isMouseDown, lastPanPoint]);

  const handleContainerMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // --- End Pan & Zoom ---

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    if (isPanning) return;
    if (!contentRef.current) return;

    const { x, y } = screenToContentPercent(e.clientX, e.clientY);

    if (isDrawingWirePath) {
      setCurrentWirePathPoints(prev => [...prev, { x, y }]);
      return;
    }

    if (!isAddingPoint && !isAddingRoomView) return;

    setClickCoordinates({ x, y });
    if (isAddingPoint) {
      setShowAddModal(true);
      setIsAddingPoint(false);
    } else if (isAddingRoomView) {
      setShowAddRoomViewModal(true);
      setIsAddingRoomView(false);
    }
  };

  const handleFinishWirePath = () => {
    if (currentWirePathPoints.length >= 2) {
      setShowAddWirePathModal(true);
    } else {
      toast({ title: "Not enough points", description: "Draw at least 2 points to create a wire path", variant: "destructive" });
    }
    setIsDrawingWirePath(false);
  };

  const handleCancelWirePath = () => {
    setIsDrawingWirePath(false);
    setCurrentWirePathPoints([]);
  };

  const handleWirePathSuccess = () => {
    setCurrentWirePathPoints([]);
    fetchWirePaths();
  };

  const handleDeleteWirePath = async (pathId: string) => {
    try {
      await deleteWirePath(pathId);
      setSelectedWirePath(null);
    } catch (error) {
      console.error('Error deleting wire path:', error);
    }
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, item: any, type: 'dropPoint' | 'roomView') => {
    e.stopPropagation();
    e.preventDefault();
    if (!contentRef.current) return;

    if (type === 'dropPoint' && (item as any).is_locked) {
      toast({ title: "Drop Point Locked", description: "This drop point is locked. Unlock it in the details modal to move it.", variant: "destructive" });
      return;
    }

    const { clientX, clientY } = getEventCoordinates(e);
    const rect = contentRef.current.getBoundingClientRect();
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
    if (!isMouseDown || (!draggedPoint && !draggedRoomView) || !contentRef.current) return;

    const distanceMoved = Math.sqrt(
      Math.pow(e.clientX - mouseDownPosition.x, 2) +
      Math.pow(e.clientY - mouseDownPosition.y, 2)
    );

    if (!isDragging && distanceMoved > 5) setIsDragging(true);
    if (!isDragging) return;

    const rect = contentRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));

    if (draggedPoint) {
      setDraggedPoint(prev => ({ ...prev, x_coordinate: constrainedX, y_coordinate: constrainedY }));
    } else if (draggedRoomView) {
      setDraggedRoomView(prev => ({ ...prev, x_coordinate: constrainedX, y_coordinate: constrainedY }));
    }
  };

  const handleMouseUp = async () => {
    if (!isMouseDown) return;

    if (isDragging && draggedPoint) {
      const originalPoint = dropPoints.find(dp => dp.id === draggedPoint.id);
      setPendingMove({ item: draggedPoint, type: 'dropPoint', originalPosition: { x: originalPoint?.x_coordinate || draggedPoint.x_coordinate, y: originalPoint?.y_coordinate || draggedPoint.y_coordinate } });
      setShowMoveConfirmation(true);
    } else if (isDragging && draggedRoomView) {
      const originalView = roomViews.find(rv => rv.id === draggedRoomView.id);
      setPendingMove({ item: draggedRoomView, type: 'roomView', originalPosition: { x: originalView?.x_coordinate || draggedRoomView.x_coordinate, y: originalView?.y_coordinate || draggedRoomView.y_coordinate } });
      setShowMoveConfirmation(true);
    }

    setIsMouseDown(false);
    setIsDragging(false);
  };

  const handleConfirmMove = async () => {
    if (!pendingMove) return;
    try {
      if (pendingMove.type === 'dropPoint') {
        await updateDropPoint(pendingMove.item.id, { x_coordinate: pendingMove.item.x_coordinate, y_coordinate: pendingMove.item.y_coordinate });
        toast({ title: "Drop Point Moved", description: `${pendingMove.item.label} has been repositioned.` });
      } else if (pendingMove.type === 'roomView') {
        await updateRoomView(pendingMove.item.id, { x_coordinate: pendingMove.item.x_coordinate, y_coordinate: pendingMove.item.y_coordinate });
        toast({ title: "Room View Moved", description: `${pendingMove.item.room_name || 'Room view'} has been repositioned.` });
      }
    } catch (error) {
      console.error('Error updating position:', error);
      toast({ title: "Error", description: "Failed to update position.", variant: "destructive" });
      if (pendingMove.type === 'dropPoint') await fetchDropPoints();
      else await fetchRoomViews();
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
    if (pendingMove?.type === 'dropPoint') await fetchDropPoints();
    else if (pendingMove?.type === 'roomView') await fetchRoomViews();
    setShowMoveConfirmation(false);
    setPendingMove(null);
    setDraggedPoint(null);
    setDraggedRoomView(null);
    setDragOffset({ x: 0, y: 0 });
    setMouseDownPosition({ x: 0, y: 0 });
  };

  // Global drag listeners
  useEffect(() => {
    if (isMouseDown) {
      const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
        if (!contentRef.current || (!draggedPoint && !draggedRoomView)) return;
        const { clientX, clientY } = getEventCoordinates(e);
        const distanceMoved = Math.sqrt(Math.pow(clientX - mouseDownPosition.x, 2) + Math.pow(clientY - mouseDownPosition.y, 2));
        if (!isDragging && distanceMoved > 5) setIsDragging(true);
        if (!isDragging) return;
        const rect = contentRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left - dragOffset.x) / rect.width) * 100;
        const y = ((clientY - rect.top - dragOffset.y) / rect.height) * 100;
        const constrainedX = Math.max(0, Math.min(100, x));
        const constrainedY = Math.max(0, Math.min(100, y));
        if (draggedPoint) setDraggedPoint(prev => ({ ...prev, x_coordinate: constrainedX, y_coordinate: constrainedY }));
        else if (draggedRoomView) setDraggedRoomView(prev => ({ ...prev, x_coordinate: constrainedX, y_coordinate: constrainedY }));
      };
      const handleGlobalEnd = () => handleMouseUp();
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

  const handleToggleLock = async (point: any) => {
    try {
      await updateDropPoint(point.id, { is_locked: !point.is_locked });
      toast({ title: point.is_locked ? "Drop Point Unlocked" : "Drop Point Locked", description: `${point.label || 'Drop point'} has been ${point.is_locked ? 'unlocked' : 'locked'}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update lock status.", variant: "destructive" });
    }
  };

  const handleContextDeleteDropPoint = async (point: any) => {
    try {
      await deleteDropPoint(point.id);
      toast({ title: "Drop Point Deleted", description: `${point.label || 'Drop point'} has been removed.` });
      setContextDeleteTarget(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete drop point.", variant: "destructive" });
    }
  };

  const handleDropPointDetailsClose = (open: boolean) => {
    setDetailsModalOpen(open);
    if (!open) { setSelectedDropPoint(null); fetchDropPoints(); }
  };

  const handleRepairFiles = async () => {
    setIsRepairing(true);
    try {
      const { repairFloorPlanFiles } = await import('@/lib/storage-utils');
      await repairFloorPlanFiles(locationId);
      toast({ title: "Files Repaired", description: "Floor plan files have been repaired and linked to the location." });
      window.location.reload();
    } catch (error) {
      console.error('Error repairing files:', error);
      toast({ title: "Repair Failed", description: "Failed to repair floor plan files.", variant: "destructive" });
    } finally {
      setIsRepairing(false);
    }
  };

  const handleUploadSuccess = (newFileUrl: string) => {
    setUploadedFileUrl(newFileUrl);
  };

  const handleDeleteFloorPlan = async () => {
    if (!validLocationId) return;
    setIsDeleting(true);
    try {
      await removeFloorPlanFromLocation(locationId, floorNumber, true);
      setUploadedFileUrl(undefined);
      setFloorPlanFiles(prev => {
        if (!prev) return null;
        const updated = { ...prev };
        delete updated[floorNumber];
        return updated;
      });
      onFloorPlanSaved?.();
      toast({ title: "Floor Plan Deleted", description: `Floor plan for Floor ${floorNumber} has been removed.` });
    } catch (error) {
      console.error('Error deleting floor plan:', error);
      toast({ title: "Delete Failed", description: "Failed to delete floor plan. Please try again.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const getStatusHexColor = (status: string) => {
    switch (status) {
      case 'planned': return '#ef4444';
      case 'roughed_in': return '#f97316';
      case 'finished': return '#22c55e';
      case 'tested': return '#22c55e';
      case 'installed': return '#3b82f6';
      case 'active': return '#22c55e';
      case 'inactive': return '#ef4444';
      default: return '#ef4444';
    }
  };

  const handleExportPDF = async () => {
    if (!actualFileUrl) return;
    try {
      toast({ title: "Generating PDF", description: "Creating composite image with all annotations..." });
      const { createCompositeFloorPlan } = await import('@/lib/floor-plan-composite');
      const compositeUrl = await createCompositeFloorPlan({
        baseImageUrl: actualFileUrl,
        dropPoints: floorDropPoints.map(dp => ({ x: dp.x_coordinate || 0, y: dp.y_coordinate || 0, label: dp.label, type: dp.point_type || 'data', status: dp.status || 'planned' })),
        roomViews: floorRoomViews.map(rv => ({ x: rv.x_coordinate || 0, y: rv.y_coordinate || 0, label: rv.room_name || 'Room' })),
        width: containerDimensions.width || 800, height: containerDimensions.height || 600
      });
      const { exportFloorPlanToPDF } = await import('@/lib/floor-plan-exporter');
      await exportFloorPlanToPDF(locationId, floorNumber, actualFileUrl, { title: `Floor ${floorNumber} Plan`, includeDropPoints: true, includeRoomViews: true, includeMetadata: true }, compositeUrl);
      toast({ title: "PDF Export Complete", description: "Floor plan exported successfully." });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ title: "Export Failed", description: "Failed to export floor plan to PDF.", variant: "destructive" });
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Pan & Zoom Container */}
      <div
        ref={containerRef}
        className={`relative bg-muted rounded-lg overflow-hidden ${
          isPanning ? 'cursor-grabbing' : isDragging ? 'cursor-grabbing' : (isAddingPoint || isAddingRoomView || isDrawingWirePath) ? 'cursor-crosshair' : 'cursor-grab'
        }`}
        style={{
          height: '85vh',
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        } as React.CSSProperties}
        onWheel={handleWheel}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={(e) => {
          handleContainerMouseMove(e);
          handleMouseMove(e);
        }}
        onMouseUp={() => {
          handleContainerMouseUp();
          handleMouseUp();
        }}
        onMouseLeave={() => {
          setIsPanning(false);
        }}
        onClick={handleContainerClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Transformed content layer */}
        <div
          ref={contentRef}
          className="relative"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            minHeight: '400px',
          }}
        >
          {/* Background Content */}
          {isImage && actualFileUrl ? (
            <img
              src={actualFileUrl}
              alt={`Floor ${floorNumber} plan`}
              className="w-full h-auto"
              draggable={false}
              style={{ display: 'block', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' } as React.CSSProperties}
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
                <Button variant="outline" size="sm" onClick={handleRepairFiles} disabled={isRepairing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
                  Repair File Access
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-96 bg-muted/10 flex items-center justify-center border border-dashed border-muted-foreground/20">
              <div className="text-center space-y-4">
                <div className="text-muted-foreground">
                  <FileImage className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Floor Plan Uploaded</p>
                  <p className="text-sm mt-2">Click the ⋯ menu to upload a floor plan image</p>
                </div>
              </div>
            </div>
          )}

          {/* Drop Points Overlay */}
          {validLocationId && (
            <TooltipProvider>
              {filteredDropPoints.map((point) => {
                const displayPoint = draggedPoint && draggedPoint.id === point.id ? draggedPoint : point;
                return (
                  <ContextMenu key={point.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ContextMenuTrigger asChild>
                          <div
                            className="absolute"
                            style={{
                              left: `${displayPoint.x_coordinate || 50}%`,
                              top: `${displayPoint.y_coordinate || 50}%`,
                              zIndex: draggedPoint && draggedPoint.id === point.id ? 50 : 10,
                            }}
                          >
                            <div
                              className={`transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center hover:scale-110 transition-transform drop-shadow-lg ${
                                draggedPoint && draggedPoint.id === point.id ? 'cursor-grabbing scale-110' : 'cursor-grab'
                              }`}
                              onMouseDown={(e) => handlePointerDown(e, point, 'dropPoint')}
                              onTouchStart={(e) => handlePointerDown(e, point, 'dropPoint')}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isDragging) { setSelectedDropPoint(point); setDetailsModalOpen(true); }
                              }}
                              style={{
                                width: `${24 * filters.markerScale}px`,
                                height: `${24 * filters.markerScale}px`,
                                color: getStatusHexColor(point.status),
                              }}
                            >
                              <DropPointShape type={point.point_type} size={24 * filters.markerScale} />
                              {point.status === 'tested' && (
                                <div className="absolute inset-0 flex items-center justify-center text-white font-bold" style={{ fontSize: `${8 * filters.markerScale}px` }}>✓</div>
                              )}
                            </div>
                            {filters.showDropPointLabels && (
                              <div className="pointer-events-none select-none" style={{ position: 'absolute', left: `${20 * filters.markerScale}px`, top: '50%', transform: 'translateY(-50%)' }}>
                                <div className="bg-black/60 text-white px-1 py-0.5 rounded whitespace-nowrap shadow-sm border border-white/10 flex items-center gap-0.5" style={{ fontSize: `${9 * filters.markerScale}px` }}>
                                  <span className="text-blue-400 font-semibold">{point.cable_count || 1}-</span>
                                  <span className="font-medium">{formatCableLabel(point.type_specific_data, point.label) || point.label || 'TBD'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </ContextMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border">
                        <div className="text-sm">
                          <p className="font-medium">{point.label}</p>
                          <p className="text-muted-foreground">{point.room}</p>
                          <p className="text-xs capitalize">{point.point_type} • {point.status}</p>
                          <p className="text-xs text-muted-foreground mt-1">Right-click for options • Drag to move</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => { setSelectedDropPoint(point); setDetailsModalOpen(true); }}>
                        <Edit className="h-4 w-4 mr-2" /> Edit Details
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleToggleLock(point)}>
                        {point.is_locked ? <><Unlock className="h-4 w-4 mr-2" /> Unlock</> : <><Lock className="h-4 w-4 mr-2" /> Lock</>}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => setContextDeleteTarget(point)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}

              {/* Room Views Overlay */}
              {filteredRoomViews.map((roomView) => {
                const displayRoomView = draggedRoomView && draggedRoomView.id === roomView.id ? draggedRoomView : roomView;
                return (
                  <ContextMenu key={roomView.id}>
                    <Tooltip>
                      <ContextMenuTrigger asChild>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 border-2 border-blue-700 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg ${
                              draggedRoomView && draggedRoomView.id === roomView.id ? 'cursor-grabbing scale-110' : 'cursor-grab'
                            }`}
                            style={{
                              left: `${displayRoomView.x_coordinate || 50}%`,
                              top: `${displayRoomView.y_coordinate || 50}%`,
                              zIndex: draggedRoomView && draggedRoomView.id === roomView.id ? 50 : 15,
                              width: `${32 * filters.markerScale}px`,
                              height: `${32 * filters.markerScale}px`,
                            }}
                            onMouseDown={(e) => handlePointerDown(e, roomView, 'roomView')}
                            onTouchStart={(e) => handlePointerDown(e, roomView, 'roomView')}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isDragging) { setSelectedRoomView(roomView); setRoomViewModalOpen(true); }
                            }}
                          >
                            <Camera style={{ width: `${16 * filters.markerScale}px`, height: `${16 * filters.markerScale}px` }} />
                          </div>
                        </TooltipTrigger>
                      </ContextMenuTrigger>
                      <TooltipContent className="bg-popover border">
                        <div className="text-sm">
                          <p className="font-medium">{roomView.room_name || 'Room View'}</p>
                          {roomView.description && <p className="text-muted-foreground">{roomView.description}</p>}
                          <p className="text-xs text-muted-foreground mt-1">By {roomView.employee?.first_name} {roomView.employee?.last_name}</p>
                          <p className="text-xs text-muted-foreground">Click to view • Right-click for options</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => { setSelectedRoomView(roomView); setRoomViewModalOpen(true); }}>
                        <Camera className="h-4 w-4 mr-2" /> View Details
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => setContextDeleteRoomViewTarget(roomView)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </TooltipProvider>
          )}

          {/* Wire Paths SVG Overlay */}
          {validLocationId && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
              {filteredWirePaths.map((path) => {
                if (!path.path_points || path.path_points.length < 2) return null;
                const points = path.path_points as { x: number; y: number }[];
                const pathString = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`).join(' ');
                return (
                  <g key={path.id} className="pointer-events-auto cursor-pointer"
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedWirePath(path); }}
                  >
                    <path d={pathString} fill="none" stroke="transparent" strokeWidth="16"
                      onClick={(e) => { e.stopPropagation(); setSelectedWirePath(path); }}
                    />
                    <path d={pathString} fill="none" stroke={path.color || '#3b82f6'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray={path.status === 'planned' ? '8 4' : 'none'} className="transition-all hover:stroke-[4]"
                      onClick={(e) => { e.stopPropagation(); setSelectedWirePath(path); }}
                    />
                    {path.label && points.length >= 2 && (
                      <text x={`${points[Math.floor(points.length / 2)].x}%`} y={`${points[Math.floor(points.length / 2)].y}%`}
                        fill={path.color || '#3b82f6'} fontSize="10" fontWeight="bold" textAnchor="middle" dy="-6" className="pointer-events-none"
                      >{path.label}</text>
                    )}
                  </g>
                );
              })}
              {isDrawingWirePath && currentWirePathPoints.length > 0 && (
                <>
                  <path d={currentWirePathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`).join(' ')}
                    fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
                  {currentWirePathPoints.map((p, i) => (
                    <circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r="5" fill="#22c55e" stroke="white" strokeWidth="2" />
                  ))}
                </>
              )}
            </svg>
          )}
        </div>

        {/* Floating action buttons (top-right) — outside transform */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <Button
            size="sm"
            variant={isAddingPoint ? "default" : "secondary"}
            onClick={(e) => { e.stopPropagation(); setIsAddingPoint(!isAddingPoint); setIsAddingRoomView(false); setIsDrawingWirePath(false); }}
            disabled={!validLocationId}
            className="shadow-lg bg-background/90 backdrop-blur-sm border"
          >
            <Plus className="h-4 w-4 mr-1" /> Drop Point
          </Button>
          <Button
            size="sm"
            variant={isAddingRoomView ? "default" : "secondary"}
            onClick={(e) => { e.stopPropagation(); setIsAddingRoomView(!isAddingRoomView); setIsAddingPoint(false); setIsDrawingWirePath(false); }}
            disabled={!validLocationId}
            className="shadow-lg bg-background/90 backdrop-blur-sm border"
          >
            <Camera className="h-4 w-4 mr-1" /> Room View
          </Button>
          <FloorPlanFilterDialog
            filters={filters}
            onFiltersChange={setFilters}
            open={filterOpen}
            onOpenChange={setFilterOpen}
            hideTrigger
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); setFilterOpen(true); }}
            className="shadow-lg bg-background/90 backdrop-blur-sm border"
          >
            <Filter className="h-4 w-4 mr-1" /> Filter
          </Button>
        </div>

        {/* Secondary actions menu (bottom-right) */}
        <div className="absolute bottom-3 right-3 z-30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary" className="shadow-lg bg-background/90 backdrop-blur-sm border h-9 w-9" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              <DropdownMenuItem onClick={() => { setUploadDialogDefaultTab('upload'); setShowUploadDialog(true); }}>
                <Upload className="h-4 w-4 mr-2" /> Upload Map
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setUploadDialogDefaultTab('satellite'); setShowUploadDialog(true); }}>
                <Globe className="h-4 w-4 mr-2" /> Satellite View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!validLocationId}
                onClick={() => {
                  setIsDrawingWirePath(!isDrawingWirePath);
                  setIsAddingPoint(false);
                  setIsAddingRoomView(false);
                  if (isDrawingWirePath) setCurrentWirePathPoints([]);
                }}
              >
                <Route className="h-4 w-4 mr-2" />
                {isDrawingWirePath ? 'Cancel Wire Path' : 'Draw Wire Path'}
              </DropdownMenuItem>
              {actualFileUrl && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileImage className="h-4 w-4 mr-2" /> Export PDF
                  </DropdownMenuItem>
                </>
              )}
              {actualFileUrl && (
                <DropdownMenuItem onClick={() => setShowDeleteConfirmation(true)} disabled={isDeleting} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Floor Plan
                </DropdownMenuItem>
              )}
              {!actualFileUrl && filePath && (
                <DropdownMenuItem onClick={handleRepairFiles} disabled={isRepairing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} /> Repair Files
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Selected Wire Path Actions (bottom-left) */}
        {selectedWirePath && (
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur border rounded-lg p-3 z-30 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="text-sm">
                <p className="font-medium">{selectedWirePath.label || 'Wire Path'}</p>
                <p className="text-xs text-muted-foreground">{selectedWirePath.cable_type}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setContextDeleteWirePathTarget(selectedWirePath)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedWirePath(null)}>Close</Button>
            </div>
          </div>
        )}

        {/* Mode indicators (top-left) */}
        {isAddingPoint && (
          <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium z-30">
            Click anywhere on the plan to add a drop point
          </div>
        )}
        {isAddingRoomView && (
          <div className="absolute top-4 left-4 bg-blue-600/90 text-white px-3 py-2 rounded-lg text-sm font-medium z-30">
            Click anywhere on the plan to add a room view camera
          </div>
        )}
        {isDrawingWirePath && (
          <div className="absolute top-4 left-4 bg-green-600/90 text-white px-3 py-2 rounded-lg text-sm font-medium z-30 flex items-center gap-2">
            <span>Click to add points ({currentWirePathPoints.length} points)</span>
            {currentWirePathPoints.length >= 2 && (
              <Button size="sm" variant="secondary" onClick={handleFinishWirePath} className="h-6 text-xs">Finish Path</Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleCancelWirePath} className="h-6 text-xs text-white hover:text-white hover:bg-white/20">Cancel</Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddDropPointModal
        open={showAddModal}
        onOpenChange={(open) => { setShowAddModal(open); if (!open) { setClickCoordinates(null); fetchDropPoints(); } }}
        locationId={locationId}
        coordinates={clickCoordinates || undefined}
        floor={floorNumber}
      />
      <AddRoomViewModal
        open={showAddRoomViewModal}
        onOpenChange={(open) => { setShowAddRoomViewModal(open); if (!open) setClickCoordinates(null); }}
        locationId={locationId}
        coordinates={clickCoordinates || undefined}
        floor={floorNumber}
        onSuccess={() => fetchRoomViews()}
      />
      <DropPointDetailsModal open={detailsModalOpen} onOpenChange={handleDropPointDetailsClose} dropPoint={selectedDropPoint} locationId={locationId} />
      <RoomViewModal open={roomViewModalOpen} onOpenChange={setRoomViewModalOpen} roomView={selectedRoomView} locationId={locationId} />

      {/* Move Confirmation */}
      <AlertDialog open={showMoveConfirmation} onOpenChange={setShowMoveConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Move</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this {pendingMove?.type === 'dropPoint' ? 'drop point' : 'room view'}?
              {pendingMove?.type === 'dropPoint' && pendingMove.item?.label && ` (${pendingMove.item.label})`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelMove}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMove}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Floor Plan Confirmation */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Floor Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the floor plan for Floor {floorNumber}? This will remove the file from storage and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFloorPlan} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Context Menu Delete Confirmations */}
      <AlertDialog open={!!contextDeleteTarget} onOpenChange={(open) => !open && setContextDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Drop Point</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{contextDeleteTarget?.label || 'this drop point'}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleContextDeleteDropPoint(contextDeleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!contextDeleteRoomViewTarget} onOpenChange={(open) => !open && setContextDeleteRoomViewTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room View</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{contextDeleteRoomViewTarget?.room_name || 'this room view'}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { try { await deleteRoomView(contextDeleteRoomViewTarget.id); setContextDeleteRoomViewTarget(null); } catch (error) { console.error('Error deleting room view:', error); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!contextDeleteWirePathTarget} onOpenChange={(open) => !open && setContextDeleteWirePathTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wire Path</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{contextDeleteWirePathTarget?.label || 'this wire path'}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { try { await handleDeleteWirePath(contextDeleteWirePathTarget!.id); setContextDeleteWirePathTarget(null); } catch (error) { console.error('Error deleting wire path:', error); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloorPlanUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        locationId={locationId}
        floorNumber={floorNumber}
        onUploadSuccess={handleUploadSuccess}
        defaultTab={uploadDialogDefaultTab}
      />

      <AddWirePathModal
        open={showAddWirePathModal}
        onOpenChange={(open) => { setShowAddWirePathModal(open); if (!open) setCurrentWirePathPoints([]); }}
        locationId={locationId}
        floor={floorNumber}
        pathPoints={currentWirePathPoints}
        onSuccess={handleWirePathSuccess}
      />
    </div>
  );
};
