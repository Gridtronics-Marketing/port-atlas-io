import { useState } from 'react';
import { Save, Upload, PenTool } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FloorPlanUploadDialog } from './FloorPlanUploadDialog';
import { PhotoAnnotationCanvas } from './PhotoAnnotationCanvas';
import { supabase } from '@/integrations/supabase/client';
import { getSignedStorageUrl } from '@/lib/storage-utils';
import { useToast } from '@/hooks/use-toast';

interface EditFloorPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  floorKey: string;
  floorName: string;
  imagePath: string | null;
  floorPlanFiles: Record<string, any> | null;
  onSaved: () => void;
}

export const EditFloorPlanDialog = ({
  open,
  onOpenChange,
  locationId,
  floorKey,
  floorName,
  imagePath,
  floorPlanFiles,
  onSaved,
}: EditFloorPlanDialogProps) => {
  const [name, setName] = useState(floorName);
  const [isSaving, setIsSaving] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [annotationUrl, setAnnotationUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const floorNumber = floorKey.startsWith('outbuilding_') ? 0 : parseInt(floorKey) || 1;

  const handleSaveName = async () => {
    setIsSaving(true);
    try {
      const currentFiles = { ...(floorPlanFiles || {}) };
      const existing = currentFiles[floorKey];

      if (existing && typeof existing === 'object') {
        currentFiles[floorKey] = { ...existing, name };
      } else if (typeof existing === 'string') {
        currentFiles[floorKey] = { image_path: existing, name };
      } else {
        currentFiles[floorKey] = { name };
      }

      const { error } = await supabase
        .from('locations')
        .update({ floor_plan_files: currentFiles })
        .eq('id', locationId);

      if (error) throw error;

      toast({ title: 'Saved', description: 'Floor plan name updated.' });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving name:', err);
      toast({ title: 'Error', description: 'Failed to save name.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    onSaved();
    onOpenChange(false);
  };

  const handleAnnotate = async () => {
    if (!imagePath) {
      toast({ title: 'No image', description: 'Upload a map first before annotating.', variant: 'destructive' });
      return;
    }
    const url = await getSignedStorageUrl('floor-plans', imagePath);
    setAnnotationUrl(url);
    setShowAnnotation(true);
  };

  const handleAnnotationSave = async (_annotationData: string, _metadata: any) => {
    // The annotation canvas bakes into the image — we re-upload
    toast({ title: 'Annotations saved', description: 'Your changes have been applied.' });
  };

  const handleAnnotationReupload = async (newPhotoUrl: string, _annotationData: string) => {
    // Download the baked image and re-upload to floor-plans bucket
    try {
      const response = await fetch(newPhotoUrl);
      const blob = await response.blob();
      const timestamp = Date.now();
      const newPath = `${locationId}/floor_${floorKey}_annotated_${timestamp}.png`;

      const { error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(newPath, blob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      // Update floor_plan_files
      const currentFiles = { ...(floorPlanFiles || {}) };
      const existing = currentFiles[floorKey];
      if (existing && typeof existing === 'object') {
        currentFiles[floorKey] = { ...existing, image_path: newPath };
      } else {
        currentFiles[floorKey] = { image_path: newPath, name };
      }

      const { error } = await supabase
        .from('locations')
        .update({ floor_plan_files: currentFiles })
        .eq('id', locationId);

      if (error) throw error;

      toast({ title: 'Map updated', description: 'Annotated map saved successfully.' });
      onSaved();
    } catch (err) {
      console.error('Error saving annotated map:', err);
      toast({ title: 'Error', description: 'Failed to save annotated map.', variant: 'destructive' });
    }
  };

  if (showAnnotation && annotationUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <PhotoAnnotationCanvas
          photoUrl={annotationUrl}
          photoId={`floorplan-${floorKey}`}
          onSave={handleAnnotationSave}
          onReupload={handleAnnotationReupload}
          onClose={() => {
            setShowAnnotation(false);
            setAnnotationUrl(null);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Floor Plan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="floor-name">Name</Label>
              <Input
                id="floor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ground Floor, Mezzanine"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Replace Map
              </Button>
              <Button variant="outline" onClick={handleAnnotate} disabled={!imagePath}>
                <PenTool className="h-4 w-4 mr-2" />
                Annotate Map
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSaveName} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Name'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FloorPlanUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        locationId={locationId}
        floorNumber={floorNumber}
        onUploadSuccess={handleUploadSuccess}
        defaultTab="upload"
      />
    </>
  );
};
