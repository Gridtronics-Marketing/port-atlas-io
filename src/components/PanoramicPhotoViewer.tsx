import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Move, ChevronLeft, ChevronRight, Pen } from 'lucide-react';
import { PhotoAnnotationCanvas } from './PhotoAnnotationCanvas';

interface PanoramicPhotoViewerProps {
  photoUrl: string;
  description?: string;
  photoId?: string;
  existingAnnotations?: string;
  annotationMetadata?: Record<string, any>;
  onAnnotationSave?: (annotationData: string, metadata: any) => Promise<void>;
  onClose: () => void;
}

export const PanoramicPhotoViewer: React.FC<PanoramicPhotoViewerProps> = ({
  photoUrl,
  description,
  photoId,
  existingAnnotations,
  annotationMetadata,
  onAnnotationSave,
  onClose
}) => {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAnnotating, setIsAnnotating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle touch drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoom <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Handle scroll for horizontal panning
  const handleScroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.5;
      containerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Reset position when zoom changes
  useEffect(() => {
    if (zoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle pinch to zoom on mobile
  useEffect(() => {
    const handlePinch = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
      }
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('touchmove', handlePinch, { passive: false });
      return () => {
        element.removeEventListener('touchmove', handlePinch);
      };
    }
  }, []);

  // Render annotation canvas if annotating
  if (isAnnotating && photoId && onAnnotationSave) {
    return (
      <PhotoAnnotationCanvas
        photoUrl={photoUrl}
        photoId={photoId}
        existingAnnotations={existingAnnotations}
        metadata={annotationMetadata}
        onSave={onAnnotationSave}
        onClose={() => setIsAnnotating(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/90 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">
              {description || 'Panoramic Photo'}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Move className="w-4 h-4" />
              {zoom > 1 ? 'Drag to pan' : 'Scroll horizontally to view • Pinch to zoom on mobile'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {photoId && onAnnotationSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAnnotating(true)}
              >
                <Pen className="w-4 h-4 mr-2" />
                {existingAnnotations ? 'Edit Annotations' : 'Annotate'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute inset-0 pt-24 pb-20">
        <div
          ref={containerRef}
          className="w-full h-full overflow-auto"
          style={{
            scrollbarWidth: 'thin',
            cursor: zoom > 1 && isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative w-max min-w-full h-full flex items-center justify-center p-4">
            <img
              ref={imageRef}
              src={photoUrl}
              alt={description || 'Panoramic photo'}
              className="max-h-full w-auto transition-transform duration-200 select-none"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                minWidth: zoom === 1 ? '100%' : 'auto'
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Scroll Indicators - Only show when zoom is 1 */}
        {zoom === 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
              onClick={() => handleScroll('left')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
              onClick={() => handleScroll('right')}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-background/90 backdrop-blur-sm border-t">
        <div className="flex items-center justify-center gap-4 p-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <div className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
