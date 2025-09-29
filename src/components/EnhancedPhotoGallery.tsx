import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, User, Calendar, FileText, MapPin, Tag, Filter } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface PhotoItem {
  id: string;
  photo_url: string;
  description?: string;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
  drop_point?: {
    label: string;
    room?: string;
    point_type?: string;
  };
  room_view?: {
    name: string;
    description?: string;
  };
}

interface EnhancedPhotoGalleryProps {
  photos: PhotoItem[];
  onDeletePhoto: (photoId: string, photoUrl: string) => Promise<void>;
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  showBreadcrumb?: boolean;
  locationName?: string;
  contextType?: 'drop_point' | 'room_view' | 'location';
}

export const EnhancedPhotoGallery: React.FC<EnhancedPhotoGalleryProps> = ({
  photos,
  onDeletePhoto,
  loading = false,
  emptyMessage = "No photos available",
  title = "Photos",
  showBreadcrumb = false,
  locationName,
  contextType = 'location'
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');

  // Get unique types and rooms for filtering
  const uniqueTypes = [...new Set(photos.map(p => p.drop_point?.point_type || p.room_view ? 'room_view' : 'unknown').filter(Boolean))];
  const uniqueRooms = [...new Set(photos.map(p => p.drop_point?.room || p.room_view?.name).filter(Boolean))];

  // Filter photos based on selected filters
  const filteredPhotos = photos.filter(photo => {
    if (filterType !== 'all') {
      const photoType = photo.drop_point?.point_type || (photo.room_view ? 'room_view' : 'unknown');
      if (photoType !== filterType) return false;
    }
    
    if (filterRoom !== 'all') {
      const photoRoom = photo.drop_point?.room || photo.room_view?.name;
      if (photoRoom !== filterRoom) return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {title}
            <Badge variant="secondary" className="ml-auto">
              {filteredPhotos.length} of {photos.length}
            </Badge>
          </CardTitle>
          
          {showBreadcrumb && locationName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{locationName}</span>
              {contextType !== 'location' && (
                <>
                  <span>•</span>
                  <span>{contextType === 'drop_point' ? 'Drop Points' : 'Room Views'}</span>
                </>
              )}
            </div>
          )}

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type === 'room_view' ? 'Room View' : type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {uniqueRooms.length > 0 && (
                <Select value={filterRoom} onValueChange={setFilterRoom}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {uniqueRooms.map(room => (
                      <SelectItem key={room} value={room}>
                        {room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{photos.length === 0 ? emptyMessage : "No photos match the selected filters"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPhotos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={photo.photo_url}
                    alt={photo.description || "Photo"}
                    className="w-full h-full object-cover"
                  />
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
                    
                    {/* Context tags */}
                    <div className="flex flex-wrap gap-1">
                      {photo.drop_point && (
                        <Badge variant="outline" className="text-xs text-white border-white/50">
                          <Tag className="w-3 h-3 mr-1" />
                          {photo.drop_point.label}
                        </Badge>
                      )}
                      
                      {photo.room_view && (
                        <Badge variant="outline" className="text-xs text-white border-white/50">
                          <Tag className="w-3 h-3 mr-1" />
                          {photo.room_view.name}
                        </Badge>
                      )}
                      
                      {(photo.drop_point?.room || photo.room_view) && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {photo.drop_point?.room || 'Room View'}
                        </Badge>
                      )}
                      
                      {photo.drop_point?.point_type && (
                        <Badge variant="outline" className="text-xs text-white border-blue-300">
                          {photo.drop_point.point_type}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {photo.employee && (
                        <Badge variant="secondary" className="text-xs">
                          <User className="w-3 h-3 mr-1" />
                          {`${photo.employee.first_name} ${photo.employee.last_name}`}
                        </Badge>
                      )}
                      
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
        )}
      </CardContent>
    </Card>
  );
};