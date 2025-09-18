import { useState, useRef, useEffect } from 'react';
import { Plus, Minus, RotateCcw, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PDFRenderer } from './PDFRenderer';
import { AddDropPointModal } from './AddDropPointModal';
import { useDropPoints } from '@/hooks/useDropPoints';
import { getStorageUrl, repairFloorPlanFiles } from '@/lib/storage-utils';
import { useToast } from '@/hooks/use-toast';

interface InteractiveFloorPlanProps {
  locationId: string;
  floorNumber: number;
  fileUrl?: string;
  filePath?: string; // Raw storage path
  fileName?: string;
  className?: string;
}

export const InteractiveFloorPlan = ({
  locationId,
  floorNumber,
  fileUrl,
  filePath,
  fileName,
  className = ""
}: InteractiveFloorPlanProps) => {
  const [scale, setScale] = useState(1.0);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [clickCoordinates, setClickCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { dropPoints, loading: dropPointsLoading } = useDropPoints(locationId);
  
  // Generate the actual file URL from path or use provided URL
  const actualFileUrl = fileUrl || (filePath ? getStorageUrl('floor-plans', filePath) : undefined);

  // Filter drop points for current floor
  const floorDropPoints = dropPoints.filter(dp => dp.floor === floorNumber);

  const getFileExtension = (url?: string, path?: string, name?: string) => {
    if (!url && !path && !name) return '';
    const source = name || path || url || '';
    return source.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(actualFileUrl, filePath, fileName);
  const isPDF = fileExtension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp', 'tiff'].includes(fileExtension);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isAddingPoint || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickCoordinates({ x, y });
    setShowAddModal(true);
    setIsAddingPoint(false);
  };

  const adjustScale = (increment: boolean) => {
    setScale(prev => {
      const newScale = increment ? prev + 0.2 : prev - 0.2;
      return Math.max(0.5, Math.min(3.0, newScale));
    });
  };

  const resetScale = () => setScale(1.0);

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
        return 'bg-gray-500 border-gray-600';
      case 'installed':
        return 'bg-blue-500 border-blue-600';
      case 'tested':
        return 'bg-yellow-500 border-yellow-600';
      case 'active':
        return 'bg-green-500 border-green-600';
      case 'inactive':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-gray-500 border-gray-600';
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
              variant={isAddingPoint ? "default" : "outline"}
              size="sm"
              onClick={() => setIsAddingPoint(!isAddingPoint)}
              disabled={!actualFileUrl}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Drop Point
            </Button>
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
        {floorDropPoints.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{floorDropPoints.length} drop points on this floor</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          className="relative bg-muted rounded-lg overflow-hidden cursor-pointer"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            height: 'auto',
            minHeight: '400px'
          }}
          onClick={handleContainerClick}
        >
          {/* Background Content */}
          {isPDF && actualFileUrl ? (
            <PDFRenderer
              fileUrl={actualFileUrl}
              pageNumber={floorNumber}
              scale={1.0}
              onCanvasReady={setCanvasElement}
              className="w-full"
            />
          ) : isImage && actualFileUrl ? (
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
            <div className="w-full h-96 bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-sm font-medium">No floor plan uploaded</p>
                <p className="text-xs">Upload a floor plan to enable interactive placement</p>
              </div>
            </div>
          )}

          {/* Drop Points Overlay */}
          <TooltipProvider>
            {floorDropPoints.map((point) => (
              <Tooltip key={point.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-white font-bold cursor-pointer hover:scale-110 transition-transform shadow-lg ${getDropPointColor(point.status)}`}
                    style={{
                      left: `${point.x_coordinate || 50}%`,
                      top: `${point.y_coordinate || 50}%`,
                    }}
                  >
                    <span className="text-xs">{getDropPointIcon(point.point_type)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-popover border">
                  <div className="text-sm">
                    <p className="font-medium">{point.label}</p>
                    <p className="text-muted-foreground">{point.room}</p>
                    <p className="text-xs capitalize">{point.point_type} • {point.status}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>

          {/* Add Point Indicator */}
          {isAddingPoint && (
            <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium z-10">
              Click anywhere on the plan to add a drop point
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-1">Interactive Controls:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Add Drop Point:</strong> Click the button above, then click on the plan</li>
            <li>• <strong>Zoom:</strong> Use the zoom controls or mouse wheel</li>
            <li>• <strong>View Details:</strong> Hover over existing drop points</li>
            <li>• <strong>Scale:</strong> Adjust view scale with zoom controls</li>
          </ul>
        </div>
      </CardContent>

      {/* Add Drop Point Modal */}
      <AddDropPointModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        locationId={locationId}
        coordinates={clickCoordinates || undefined}
        floor={floorNumber}
      />
    </Card>
  );
};