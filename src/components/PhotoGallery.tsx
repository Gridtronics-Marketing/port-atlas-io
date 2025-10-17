import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, User, Calendar, FileText } from 'lucide-react';
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

interface PhotoItem {
  id: string;
  photo_url: string;
  description?: string;
  photo_type?: 'standard' | 'panoramic';
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
}

interface PhotoGalleryProps {
  photos: PhotoItem[];
  onDeletePhoto: (photoId: string, photoUrl: string) => Promise<void>;
  loading?: boolean;
  emptyMessage?: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onDeletePhoto,
  loading = false,
  emptyMessage = "No photos available"
}) => {
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="relative group">
          <div className="aspect-square rounded-lg overflow-hidden border">
            <img
              src={photo.photo_url}
              alt={photo.description || "Photo"}
              className="w-full h-full object-cover"
            />
            {photo.photo_type === 'panoramic' && (
              <Badge className="absolute top-2 left-2" variant="secondary">
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
  );
};