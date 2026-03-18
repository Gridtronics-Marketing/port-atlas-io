import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, RotateCcw, Grid3X3, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SignedImage } from '@/components/ui/signed-image';

interface AnglePhoto {
  id: string;
  photo_url: string;
  angle: number;
  description?: string;
  storage_bucket?: string;
  created_at: string;
}

interface MultiAnglePhotoViewerProps {
  photos: AnglePhoto[];
  title?: string;
  onClose: () => void;
}

export const MultiAnglePhotoViewer: React.FC<MultiAnglePhotoViewerProps> = ({
  photos,
  title = '360° Room View',
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [expandedPhoto, setExpandedPhoto] = useState<AnglePhoto | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort photos by angle
  const sortedPhotos = [...photos].sort((a, b) => a.angle - b.angle);
  const currentPhoto = sortedPhotos[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigatePrevious();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      } else if (e.key === 'Escape') {
        if (expandedPhoto) {
          setExpandedPhoto(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, expandedPhoto, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const navigatePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? sortedPhotos.length - 1 : prev - 1));
  };

  const navigateNext = () => {
    setCurrentIndex(prev => (prev === sortedPhotos.length - 1 ? 0 : prev + 1));
  };

  // Touch swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        navigateNext();
      } else {
        navigatePrevious();
      }
    }
  };

  // Circular navigation indicator
  const renderCircularNav = () => (
    <div className="relative w-32 h-32 mx-auto mb-4">
      <div className="absolute inset-0 rounded-full border-2 border-muted">
        {sortedPhotos.map((photo, index) => {
          const angle = photo.angle || index * (360 / sortedPhotos.length);
          const radians = (angle - 90) * (Math.PI / 180);
          const x = 50 + 42 * Math.cos(radians);
          const y = 50 + 42 * Math.sin(radians);
          const isActive = index === currentIndex;
          
          return (
            <button
              key={photo.id}
              className={`absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${
                isActive 
                  ? 'bg-primary scale-125 ring-2 ring-primary ring-offset-2' 
                  : 'bg-muted hover:bg-muted-foreground/20'
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => setCurrentIndex(index)}
            >
              <span className="sr-only">{photo.angle}°</span>
            </button>
          );
        })}
      </div>
      
      {/* Center angle display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{currentPhoto?.angle || 0}°</span>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} of {sortedPhotos.length}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background/90 backdrop-blur-sm border-b p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <Badge variant="secondary">{sortedPhotos.length} photos</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('single')}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
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
      <div className="flex-1 overflow-hidden">
        {viewMode === 'single' ? (
          <div 
            ref={containerRef}
            className="h-full flex flex-col items-center justify-center p-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Circular Navigation */}
            {renderCircularNav()}
            
            {/* Current Photo */}
            {currentPhoto && (
              <div className="relative flex-1 w-full max-w-4xl flex items-center justify-center">
                <img
                  src={currentPhoto.photo_url}
                  alt={`View at ${currentPhoto.angle}°`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg cursor-zoom-in"
                  onClick={() => setExpandedPhoto(currentPhoto)}
                />
                
                {/* Navigation Arrows */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                  onClick={navigatePrevious}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                  onClick={navigateNext}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
            
            {/* Photo Details */}
            {currentPhoto?.description && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {currentPhoto.description}
              </p>
            )}
          </div>
        ) : (
          /* Grid View */
          <div className="h-full overflow-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {sortedPhotos.map((photo, index) => (
                <div 
                  key={photo.id} 
                  className={`relative aspect-square cursor-pointer group rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-muted'
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setExpandedPhoto(photo);
                  }}
                >
                  <img
                    src={photo.photo_url}
                    alt={`View at ${photo.angle}°`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-2 left-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    {photo.angle}°
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Swipe Hint (mobile) */}
      {viewMode === 'single' && (
        <div className="md:hidden text-center py-2 text-sm text-muted-foreground border-t bg-background/90">
          Swipe left/right to navigate
        </div>
      )}

      {/* Expanded Photo Dialog */}
      <Dialog open={!!expandedPhoto} onOpenChange={() => setExpandedPhoto(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Photo at {expandedPhoto?.angle}°</DialogTitle>
          </DialogHeader>
          {expandedPhoto && (
            <img
              src={expandedPhoto.photo_url}
              alt={`View at ${expandedPhoto.angle}°`}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
