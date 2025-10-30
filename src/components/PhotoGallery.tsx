import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, User, Calendar, FileText, Maximize2, Pen } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PanoramicPhotoViewer } from './PanoramicPhotoViewer';
import { PhotoAnnotationCanvas } from './PhotoAnnotationCanvas';
import { PhotoAnnotationViewer } from './PhotoAnnotationViewer';

interface PhotoItem {
  id: string;
  photo_url: string;
  description?: string;
  photo_type?: 'standard' | 'panoramic';
  annotation_data?: string;
  annotation_metadata?: Record<string, any>;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
}

interface PhotoGalleryProps {
  photos: PhotoItem[];
  onDeletePhoto: (photoId: string, photoUrl: string) => Promise<void>;
  onUpdatePhoto?: (photoId: string, updates: { annotation_data?: string; annotation_metadata?: Record<string, any> }) => Promise<void>;
  loading?: boolean;
  emptyMessage?: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onDeletePhoto,
  onUpdatePhoto,
  loading = false,
  emptyMessage = "No photos available"
}) => {
  const [expandedPhoto, setExpandedPhoto] = React.useState<PhotoItem | null>(null);
  const [isAnnotating, setIsAnnotating] = React.useState(false);
  
  React.useEffect(() => {
    if (expandedPhoto) {
      console.log("📸 Photo opened:", { id: expandedPhoto.id, isAnnotating });
    }
    if (isAnnotating) {
      console.log("✏️ Entering annotation mode for photo:", expandedPhoto?.id);
    }
  }, [expandedPhoto, isAnnotating]);
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="relative group cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedPhoto(photo);
            }}
          >
          <div className="aspect-square rounded-lg overflow-hidden border">
            <img
              src={photo.photo_url}
              alt={photo.description || "Photo"}
              className="w-full h-full object-cover"
            />
            {photo.annotation_data && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                <Pen className="w-3 h-3" />
              </div>
            )}
            {photo.photo_type === 'panoramic' && (
              <Badge className="absolute top-2 left-2" variant="secondary">
                <Maximize2 className="w-3 h-3 mr-1" />
                Panoramic
              </Badge>
            )}
          </div>
          
          {/* Photo overlay with info and delete button */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-between p-2">
            <div className="flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this photo? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeletePhoto(photo.id, photo.photo_url)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="space-y-1">
              {photo.description && (
                <p className="text-white text-xs line-clamp-2">
                  {photo.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  <User className="w-3 h-3 mr-1" />
                  {photo.employee 
                    ? `${photo.employee.first_name} ${photo.employee.last_name}` 
                    : 'Unknown User'
                  }
                </Badge>
                <Badge variant="outline" className="text-xs text-white border-white/50">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(photo.created_at).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Annotation Canvas, Panoramic Photo Viewer, or Standard Dialog */}
    {isAnnotating && expandedPhoto ? (
      <PhotoAnnotationCanvas
        photoUrl={expandedPhoto.photo_url}
        photoId={expandedPhoto.id}
        existingAnnotations={expandedPhoto.annotation_data}
        metadata={expandedPhoto.annotation_metadata}
        onSave={async (annotationData, metadata) => {
          if (onUpdatePhoto) {
            await onUpdatePhoto(expandedPhoto.id, {
              annotation_data: annotationData,
              annotation_metadata: metadata,
            });
          }
        }}
        onClose={() => {
          setIsAnnotating(false);
          setExpandedPhoto(null);
        }}
      />
    ) : expandedPhoto?.photo_type === 'panoramic' ? (
      <PanoramicPhotoViewer
        photoUrl={expandedPhoto.photo_url}
        description={expandedPhoto.description}
        photoId={expandedPhoto.id}
        existingAnnotations={expandedPhoto.annotation_data}
        annotationMetadata={expandedPhoto.annotation_metadata}
        onAnnotationSave={onUpdatePhoto ? async (annotationData, metadata) => {
          await onUpdatePhoto(expandedPhoto.id, {
            annotation_data: annotationData,
            annotation_metadata: metadata,
          });
        } : undefined}
        onClose={() => setExpandedPhoto(null)}
      />
    ) : (
      <Dialog open={!!expandedPhoto} onOpenChange={() => setExpandedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {expandedPhoto && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <DialogTitle>{expandedPhoto.description || 'Photo'}</DialogTitle>
                  <DialogDescription>Click "Annotate" to draw on this photo</DialogDescription>
                </div>
                {onUpdatePhoto && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      console.log("🖊️ Annotate button clicked");
                      setIsAnnotating(true);
                    }} 
                    className="shrink-0"
                  >
                    <Pen className="w-4 h-4 mr-2" />
                    {expandedPhoto.annotation_data ? 'Edit Annotations' : 'Annotate'}
                  </Button>
                )}
              </DialogHeader>
              
              <div className="relative w-full" style={{ minHeight: '400px', maxHeight: '70vh' }}>
                {expandedPhoto.annotation_data ? (
                  <PhotoAnnotationViewer
                    photoUrl={expandedPhoto.photo_url}
                    annotationData={expandedPhoto.annotation_data}
                    className="h-full"
                  />
                ) : (
                  <img src={expandedPhoto.photo_url} alt={expandedPhoto.description || "Photo"} className="w-full h-auto" />
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {expandedPhoto.employee && (
                  <Badge variant="secondary">
                    <User className="w-3 h-3 mr-1" />
                    {`${expandedPhoto.employee.first_name} ${expandedPhoto.employee.last_name}`}
                  </Badge>
                )}
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(expandedPhoto.created_at).toLocaleDateString()}
                </Badge>
                {expandedPhoto.annotation_data && (
                  <Badge variant="default">
                    <Pen className="w-3 h-3 mr-1" />
                    Has Annotations
                  </Badge>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    )}
    </>
  );
};