import { useState } from 'react';
import { Upload, Globe, PenTool } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FloorPlanUploadDialog } from './FloorPlanUploadDialog';
import { PhotoAnnotationCanvas } from './PhotoAnnotationCanvas';
import { supabase } from '@/integrations/supabase/client';
import { getSignedStorageUrl } from '@/lib/storage-utils';
import { useToast } from '@/hooks/use-toast';

interface AddFloorPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  locationName: string;
  currentFloors: number;
  floorPlanFiles: Record<string, any> | null;
  onSaved: () => void;
}

export const AddFloorPlanDialog = ({
  open,
  onOpenChange,
  locationId,
  locationName,
  currentFloors,
  floorPlanFiles,
  onSaved,
}: AddFloorPlanDialogProps) => {
  const [floorName, setFloorName] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadTab, setUploadTab] = useState<'upload' | 'satellite'>('upload');
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [drawImageUrl, setDrawImageUrl] = useState<string | null>(null);
  const [drawImagePath, setDrawImagePath] = useState<string | null>(null);
  const { toast } = useToast();

  // Figure out the next floor key
  const getNextFloorKey = (): string => {
    // Find the highest numeric floor key
    const existingKeys = Object.keys(floorPlanFiles || {})
      .filter(k => !k.startsWith('outbuilding_') && !k.startsWith('riser'))
      .map(k => parseInt(k))
      .filter(n => !isNaN(n));
    const maxExisting = Math.max(currentFloors, ...existingKeys, 0);
    return (maxExisting + 1).toString();
  };

  const nextFloorKey = getNextFloorKey();
  const nextFloorNumber = parseInt(nextFloorKey) || 1;

  const handleUpload = () => {
    setUploadTab('upload');
    setShowUploadDialog(true);
  };

  const handleSatellite = () => {
    setUploadTab('satellite');
    setShowUploadDialog(true);
  };

  const handleDraw = async () => {
    try {
      // Create a white canvas blob
      const canvas = document.createElement('canvas');
      canvas.width = 3000;
      canvas.height = 2000;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 3000, 2000);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob creation failed'))), 'image/png');
      });

      // Upload to storage
      const timestamp = Date.now();
      const filePath = `${locationId}/floor_${nextFloorKey}_drawn_${timestamp}.png`;

      const { error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(filePath, blob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      // Update floor_plan_files with the new floor
      const currentFiles = { ...(floorPlanFiles || {}) };
      currentFiles[nextFloorKey] = {
        image_path: filePath,
        name: floorName || `Floor ${nextFloorKey}`,
        is_drawn: true,
        created_at: new Date().toISOString(),
      };

      // Also bump the floor count if needed
      const newFloorCount = Math.max(currentFloors, nextFloorNumber);

      const { error } = await supabase
        .from('locations')
        .update({
          floor_plan_files: currentFiles,
          floors: newFloorCount,
        })
        .eq('id', locationId);

      if (error) throw error;

      // Get signed URL and open annotation canvas
      const url = await getSignedStorageUrl('floor-plans', filePath);
      setDrawImageUrl(url);
      setDrawImagePath(filePath);
      setShowAnnotation(true);
    } catch (err) {
      console.error('Error creating draw canvas:', err);
      toast({ title: 'Error', description: 'Failed to create drawing canvas.', variant: 'destructive' });
    }
  };

  const handleUploadSuccess = async () => {
    setShowUploadDialog(false);

    // Save name if provided
    if (floorName) {
      try {
        const { data } = await supabase
          .from('locations')
          .select('floor_plan_files')
          .eq('id', locationId)
          .single();

        if (data?.floor_plan_files) {
          const files = data.floor_plan_files as Record<string, any>;
          const existing = files[nextFloorKey];
          if (existing && typeof existing === 'object') {
            files[nextFloorKey] = { ...existing, name: floorName };
          }
          await supabase.from('locations').update({ floor_plan_files: files }).eq('id', locationId);
        }
      } catch (err) {
        console.error('Error saving name after upload:', err);
      }
    }

    onSaved();
    onOpenChange(false);
    setFloorName('');
  };

  const handleAnnotationSave = async () => {
    toast({ title: 'Drawing saved', description: 'Your floor plan drawing has been saved.' });
  };

  const handleAnnotationReupload = async (newPhotoUrl: string) => {
    try {
      const response = await fetch(newPhotoUrl);
      const blob = await response.blob();

      if (!drawImagePath) return;

      // Overwrite the original path
      const { error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(drawImagePath, blob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      toast({ title: 'Drawing saved', description: 'Floor plan drawing saved successfully.' });
      onSaved();
    } catch (err) {
      console.error('Error saving drawing:', err);
      toast({ title: 'Error', description: 'Failed to save drawing.', variant: 'destructive' });
    }
  };

  const handleAnnotationClose = () => {
    setShowAnnotation(false);
    setDrawImageUrl(null);
    setDrawImagePath(null);
    onSaved();
    onOpenChange(false);
    setFloorName('');
  };

  if (showAnnotation && drawImageUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <PhotoAnnotationCanvas
          photoUrl={drawImageUrl}
          photoId={`floorplan-draw-${nextFloorKey}`}
          onSave={handleAnnotationSave}
          onReupload={handleAnnotationReupload}
          onClose={handleAnnotationClose}
        />
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Floor Plan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-floor-name">Floor Name (optional)</Label>
              <Input
                id="new-floor-name"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                placeholder={`e.g. Floor ${nextFloorKey}, Basement, Roof`}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Choose a method:</p>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start h-12" onClick={handleUpload}>
                  <Upload className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Upload</p>
                    <p className="text-xs text-muted-foreground">Upload an image file</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-12" onClick={handleSatellite}>
                  <Globe className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Satellite View</p>
                    <p className="text-xs text-muted-foreground">Capture from Google Maps</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-12" onClick={handleDraw}>
                  <PenTool className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Draw Floorplan</p>
                    <p className="text-xs text-muted-foreground">Draw on a blank canvas</p>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FloorPlanUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        locationId={locationId}
        floorNumber={nextFloorNumber}
        onUploadSuccess={handleUploadSuccess}
        defaultTab={uploadTab}
      />
    </>
  );
};
