import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ConfigurableSelect } from '@/components/ui/configurable-select';
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
  Edit, 
  Trash2, 
  Save, 
  X, 
  MapPin, 
  Tag, 
  User, 
  Calendar,
  Camera,
  Plus,
  History,
  Maximize2,
  Upload
} from 'lucide-react';
import { useDropPoints, type DropPoint } from '@/hooks/useDropPoints';
import { useDropPointPhotos } from '@/hooks/useDropPointPhotos';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPhotoGallery } from './EnhancedPhotoGallery';
import { PhotoCaptureCard } from './PhotoCaptureCard';
import { TestResultsUpload } from './TestResultsUpload';
import { DropPointTypeSpecificFields } from './DropPointTypeSpecificFields';
import { MdfIdfConnectionFields, MdfIdfConnection } from './MdfIdfConnectionFields';
import { useDistributionFrames } from '@/hooks/useDistributionFrames';
import { Lock, Unlock } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';

interface DropPointDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dropPoint: DropPoint | null;
  locationId?: string;
}

export const DropPointDetailsModal: React.FC<DropPointDetailsModalProps> = ({
  open,
  onOpenChange,
  dropPoint,
  locationId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [editData, setEditData] = useState<Partial<DropPoint>>({});
  const [typeSpecificData, setTypeSpecificData] = useState<any>({});
  const [mdfConnections, setMdfConnections] = useState<MdfIdfConnection[]>([]);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  
  const { updateDropPoint, deleteDropPoint } = useDropPoints(locationId);
  const { photos, loading: photosLoading, addPhoto, updatePhoto, deletePhoto } = useDropPointPhotos(dropPoint?.id);
  const { employee: currentEmployee } = useCurrentEmployee();
  const { capturePhoto, selectFromGallery } = usePhotoCapture();
  const { toast } = useToast();
  const { hasAnyRole } = useUserRoles();
  const { frames, loading: framesLoading } = useDistributionFrames(locationId);

  React.useEffect(() => {
    if (dropPoint) {
      setEditData({
        label: dropPoint.label,
        room: dropPoint.room,
        cable_count: dropPoint.cable_count,
        notes: dropPoint.notes,
        point_type: dropPoint.point_type,
        status: dropPoint.status,
      });
      const tsd = (dropPoint as any).type_specific_data || {};
      setTypeSpecificData(tsd);
      setMdfConnections(tsd.mdf_idf_connections || []);
    }
  }, [dropPoint]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!dropPoint) return;
    
    try {
      // Allow cable_count to be null for "to be determined"
      const validConnections = mdfConnections.filter(c => c.frame_id.trim() || c.port.trim());
      const mergedTypeData = {
        ...typeSpecificData,
        ...(validConnections.length > 0 ? { mdf_idf_connections: validConnections } : {}),
      };
      // Remove key if no connections
      if (validConnections.length === 0) {
        delete mergedTypeData.mdf_idf_connections;
      }
      const dataToSave = {
        ...editData,
        cable_count: editData.cable_count === null || editData.cable_count === undefined 
          ? null 
          : parseInt(editData.cable_count as any),
        type_specific_data: mergedTypeData,
      };
      
      await updateDropPoint(dropPoint.id, dataToSave);
      setIsEditing(false);
      toast({
        title: "Drop Point Updated",
        description: "Drop point details have been saved successfully.",
      });
      // Force parent component to refresh to show updated data
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error updating drop point:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update drop point. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleLock = async () => {
    if (!dropPoint) return;

    // Check permissions
    const canLock = await hasAnyRole(['admin', 'hr_manager', 'project_manager']);
    if (!canLock) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to lock/unlock drop points.",
        variant: "destructive",
      });
      return;
    }

    setIsTogglingLock(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newLockState = !(dropPoint as any).is_locked;
      await updateDropPoint(dropPoint.id, {
        is_locked: newLockState,
        locked_by: newLockState ? user?.id : null,
        locked_at: newLockState ? new Date().toISOString() : null,
      } as any);

      toast({
        title: newLockState ? "Drop Point Locked" : "Drop Point Unlocked",
        description: newLockState 
          ? "This drop point is now locked and cannot be moved." 
          : "This drop point can now be moved on the floor plan.",
      });

      // Refresh to show updated data
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast({
        title: "Error",
        description: "Failed to update lock status.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingLock(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (dropPoint) {
      setEditData({
        label: dropPoint.label,
        room: dropPoint.room,
        notes: dropPoint.notes,
        point_type: dropPoint.point_type,
        status: dropPoint.status,
      });
    }
  };

  const handleDelete = async () => {
    if (!dropPoint) return;
    
    try {
      await deleteDropPoint(dropPoint.id);
      onOpenChange(false);
      toast({
        title: "Drop Point Deleted",
        description: "Drop point has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting drop point:', error);
    }
  };

  const handlePhotoCapture = async (isPanoramic: boolean = false) => {
    if (!dropPoint || !currentEmployee) return;

    try {
      const result = await capturePhoto(
        `${isPanoramic ? 'Panoramic ' : ''}Photo for drop point ${dropPoint.label}`, // description
        'drop_point',                               // category
        undefined,                                  // projectId
        locationId,                                 // locationId
        undefined,                                  // workOrderId
        currentEmployee.id,                          // employeeId
        false,                                      // isAdmin
        isPanoramic                                 // isPanoramic
      );

      if (result && result.url) {
        await addPhoto({
          drop_point_id: dropPoint.id,
          photo_url: result.url,
          description: `${isPanoramic ? 'Panoramic ' : ''}Photo for drop point ${dropPoint.label}`,
          employee_id: currentEmployee.id,
          photo_type: isPanoramic ? 'panoramic' : 'standard',
        });
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  const handleGallerySelect = async (isPanoramic: boolean = false) => {
    if (!dropPoint || !currentEmployee) return;

    try {
      const result = await selectFromGallery(
        `${isPanoramic ? 'Panoramic ' : ''}Photo for drop point ${dropPoint.label}`, // description
        'drop_point',                               // category
        undefined,                                  // projectId
        locationId,                                 // locationId
        undefined,                                  // workOrderId
        currentEmployee.id,                          // employeeId
        false,                                      // isAdmin
        isPanoramic                                 // isPanoramic
      );

      if (result && result.url) {
        await addPhoto({
          drop_point_id: dropPoint.id,
          photo_url: result.url,
          description: `${isPanoramic ? 'Panoramic ' : ''}Photo for drop point ${dropPoint.label}`,
          employee_id: currentEmployee.id,
          photo_type: isPanoramic ? 'panoramic' : 'standard',
        });
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
    }
  };

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      await deletePhoto(photoId, photoUrl);
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleUpdatePhoto = async (
    photoId: string,
    updates: { annotation_data?: string; annotation_metadata?: Record<string, any> }
  ) => {
    await updatePhoto(photoId, updates);
  };

  if (!dropPoint) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none max-h-none sm:w-[95vw] sm:h-[95vh] sm:max-w-[95vw] sm:max-h-[95vh] overflow-y-auto sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Drop Point Details: {dropPoint.label}
          </DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            {(dropPoint as any).is_locked && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Locked
              </Badge>
            )}
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleToggleLock}
                  disabled={isTogglingLock}
                >
                  {(dropPoint as any).is_locked ? (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Lock
                    </>
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Drop Point</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this drop point? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="label">Label</Label>
                  {isEditing ? (
                    <Input
                      id="label"
                      value={editData.label || ''}
                      onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{dropPoint.label}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="room">Room</Label>
                  {isEditing ? (
                    <Input
                      id="room"
                      value={editData.room || ''}
                      onChange={(e) => setEditData({ ...editData, room: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm">{dropPoint.room || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="point_type">Type</Label>
                  {isEditing ? (
                    <select
                      id="point_type"
                      className="w-full p-2 border rounded-md"
                      value={editData.point_type as string || ''}
                      onChange={(e) => setEditData({ ...editData, point_type: e.target.value as any })}
                    >
                      <option value="data">Data</option>
                      <option value="wifi">WiFi</option>
                      <option value="camera">Camera</option>
                      <option value="mdf">MDF</option>
                      <option value="idf">IDF</option>
                      <option value="access_control">Access Control</option>
                      <option value="av">A/V</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <Badge variant="outline">{dropPoint.point_type}</Badge>
                  )}
                </div>

                <div>
                  <Label htmlFor="cable_count">Number of Cables</Label>
                  {isEditing ? (
                    <Input
                      id="cable_count"
                      type="number"
                      min="1"
                      value={editData.cable_count || ''}
                      onChange={(e) => setEditData({ ...editData, cable_count: parseInt(e.target.value) || null })}
                    />
                  ) : (
                    <p className="text-sm">{dropPoint.cable_count || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  {isEditing ? (
                    <ConfigurableSelect
                      category="drop_point_status"
                      value={editData.status as string || ''}
                      onValueChange={(value) => setEditData({ ...editData, status: value as any })}
                      placeholder="Select status"
                    />
                  ) : (
                    <Badge 
                      className={
                        dropPoint.status === 'planned' ? 'bg-red-500/20 text-red-700 border-red-500/40' :
                        dropPoint.status === 'roughed_in' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/40' :
                        dropPoint.status === 'finished' ? 'bg-green-500/20 text-green-700 border-green-500/40' :
                        dropPoint.status === 'tested' ? 'bg-green-500/20 text-green-700 border-green-500/40' :
                        'bg-secondary text-secondary-foreground'
                      }
                    >
                      {dropPoint.status === 'tested' && <span className="mr-1">✓</span>}
                      {dropPoint.status}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label htmlFor="cable_count">Number of Cables</Label>
                  {isEditing ? (
                    <Input
                      id="cable_count"
                      type="number"
                      min="0"
                      value={editData.cable_count?.toString() || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string, store as null for "to be determined"
                        if (value === '') {
                          setEditData({ ...editData, cable_count: null });
                        } else {
                          const numValue = parseInt(value);
                          setEditData({ 
                            ...editData, 
                            cable_count: isNaN(numValue) ? null : Math.max(0, numValue)
                          });
                        }
                      }}
                    />
                  ) : (
                    <p className="text-sm">{dropPoint.cable_count || 'Not specified'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Location Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>Floor: {dropPoint.floor || 'Not specified'}</span>
                    </div>
                    {dropPoint.x_coordinate && dropPoint.y_coordinate && (
                      <div className="text-sm text-muted-foreground">
                        Position: ({Math.round(dropPoint.x_coordinate)}, {Math.round(dropPoint.y_coordinate)})
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Installation Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dropPoint.installer && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4" />
                        <span>Installer: {dropPoint.installer.first_name} {dropPoint.installer.last_name}</span>
                      </div>
                    )}
                    {dropPoint.installed_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Installed: {new Date(dropPoint.installed_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {dropPoint.tested_by && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4" />
                        <span>Tested by: {dropPoint.tester?.first_name} {dropPoint.tester?.last_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              {isEditing ? (
                <Textarea
                  id="notes"
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                />
              ) : (
                <p className="text-sm">{dropPoint.notes || 'No notes available'}</p>
              )}
            </div>

            {/* Type-Specific Fields */}
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-medium mb-3">Type-Specific Configuration</h3>
              <DropPointTypeSpecificFields
                pointType={editData.point_type as string || dropPoint.point_type}
                typeSpecificData={typeSpecificData}
                onDataChange={setTypeSpecificData}
                isEditing={isEditing}
              />
            </div>

            {/* MDF/IDF Connection Fields */}
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-medium mb-3">MDF / IDF Connections</h3>
              {isEditing ? (
                <MdfIdfConnectionFields
                  connections={mdfConnections}
                  onChange={setMdfConnections}
                  frames={frames}
                  framesLoading={framesLoading}
                  currentFloor={dropPoint.floor || undefined}
                />
              ) : (
                <div className="space-y-2">
                  {mdfConnections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No MDF/IDF connections specified.</p>
                  ) : (
                    mdfConnections.map((conn, idx) => {
                      const frame = frames.find(f => f.id === conn.frame_id);
                      const frameLabel = frame
                        ? (frame.name || `${frame.frame_type} – Floor ${frame.floor}${frame.room ? ` (${frame.room})` : ''}`)
                        : conn.frame_id || 'Unknown';
                      return (
                        <div key={idx} className="border rounded-md p-3 space-y-1 text-sm">
                          <div><span className="text-muted-foreground">MDF/IDF:</span> {frameLabel}</div>
                          {conn.port && <div><span className="text-muted-foreground">Port/Panel:</span> {conn.port}</div>}
                          {conn.notes && <div><span className="text-muted-foreground">Notes:</span> {conn.notes}</div>}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <TestResultsUpload 
              dropPointId={dropPoint.id} 
              onUploadComplete={() => {
                // Optionally refresh drop point data
              }}
            />
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Drop Point Photos</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePhotoCapture(false)}>
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleGallerySelect(false)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePhotoCapture(true)}>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Take Panoramic
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleGallerySelect(true)}>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Upload Panoramic
                </Button>
              </div>
            </div>

            <EnhancedPhotoGallery
              photos={photos.map(photo => ({
                id: photo.id,
                photo_url: photo.photo_url,
                description: photo.description,
                annotation_data: photo.annotation_data,
                annotation_metadata: photo.annotation_metadata,
                created_at: photo.created_at,
                employee: photo.employee,
                drop_point: photo.drop_point,
                photo_type: photo.photo_type,
              }))}
              onDeletePhoto={handleDeletePhoto}
              onUpdatePhoto={handleUpdatePhoto}
              loading={photosLoading}
              emptyMessage="No photos for this drop point yet"
              title={`Photos for ${dropPoint.label}`}
              showBreadcrumb={true}
              contextType="drop_point"
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Drop Point History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(dropPoint.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{new Date(dropPoint.updated_at).toLocaleString()}</span>
                  </div>
                  {dropPoint.installed_date && (
                    <div className="flex justify-between">
                      <span>Installed:</span>
                      <span>{new Date(dropPoint.installed_date).toLocaleString()}</span>
                    </div>
                  )}
                  {dropPoint.tested_date && (
                    <div className="flex justify-between">
                      <span>Tested:</span>
                      <span>{new Date(dropPoint.tested_date).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};