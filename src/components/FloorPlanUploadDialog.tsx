import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { convertPDFToImages, isPDFFile } from '@/lib/pdf-converter';
import { Progress } from '@/components/ui/progress';

interface FloorPlanUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  floorNumber: number;
  onUploadSuccess: (fileUrl: string) => void;
}

export const FloorPlanUploadDialog = ({
  isOpen,
  onClose,
  locationId,
  floorNumber,
  onUploadSuccess,
}: FloorPlanUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelection = async (file: File) => {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Handle PDF files
    if (isPDFFile(file)) {
      setIsConverting(true);
      setConversionProgress(0);
      
      try {
        const pages = await convertPDFToImages(file, (progress) => {
          setConversionProgress(Math.round((progress.currentPage / progress.totalPages) * 100));
        });

        if (pages.length === 0) {
          throw new Error('No pages found in PDF');
        }

        // Use first page
        const firstPage = pages[0];
        const convertedFile = new File([firstPage.blob], `floor_${floorNumber}.png`, {
          type: 'image/png',
        });

        setSelectedFile(convertedFile);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(firstPage.blob);

        toast({
          title: "PDF Converted",
          description: `Successfully converted page 1 of ${pages.length}.`,
        });
      } catch (error) {
        console.error('PDF conversion error:', error);
        toast({
          title: "PDF Conversion Failed",
          description: error instanceof Error ? error.message : "Could not convert PDF to image.",
          variant: "destructive",
        });
      } finally {
        setIsConverting(false);
      }
      return;
    }

    // Validate image file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PNG, JPG, SVG, or PDF file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);

      // Validate image dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width < 400 || img.height < 400) {
          toast({
            title: "Image Too Small",
            description: "Please select an image at least 400x400 pixels.",
            variant: "destructive",
          });
          setSelectedFile(null);
          setPreviewUrl(null);
          return;
        }
        if (img.width > 4000 || img.height > 4000) {
          toast({
            title: "Image Too Large",
            description: "Please select an image smaller than 4000x4000 pixels.",
            variant: "destructive",
          });
          setSelectedFile(null);
          setPreviewUrl(null);
          return;
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileSelection(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${locationId}/floor_${floorNumber}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(filePath);

      // Update database with file path
      const { data: location, error: fetchError } = await supabase
        .from('locations')
        .select('floor_plan_files')
        .eq('id', locationId)
        .single();

      if (fetchError) throw fetchError;

      const updatedFloorPlans: { [key: number]: string } = {
        ...(location?.floor_plan_files as Record<number, string> || {}),
        [floorNumber]: filePath
      };

      const { error: updateError } = await supabase
        .from('locations')
        .update({ floor_plan_files: updatedFloorPlans })
        .eq('id', locationId);

      if (updateError) throw updateError;

      // Notify other components
      window.dispatchEvent(new CustomEvent('FLOORPLAN_SAVED', { 
        detail: { locationId, floorNumber, filePath } 
      }));

      toast({
        title: "Upload Successful",
        description: "Floor plan map uploaded and saved to location.",
      });

      onUploadSuccess(publicUrl);
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload floor plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsConverting(false);
    setConversionProgress(0);
    setIsDragActive(false);
    onClose();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Floor Plan Map</DialogTitle>
          <DialogDescription>
            Upload a base image (PNG, JPG, SVG, or PDF) to use as your floor plan background.
            You'll be able to draw annotations on top of it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isConverting ? (
            <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-sm font-medium mb-2">Converting PDF...</p>
              <Progress value={conversionProgress} className="w-full max-w-xs mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">{conversionProgress}%</p>
            </div>
          ) : !previewUrl ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-primary'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragActive ? (
                <>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="text-sm font-medium text-primary mb-2">
                    Drop file here
                  </p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to select or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, SVG, or PDF (max 10MB, 400-4000px)
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="relative border rounded-lg overflow-hidden bg-muted">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading || isConverting}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || isConverting}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Draw
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
