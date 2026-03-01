import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, FileText, Loader2, Globe, MapPin, Navigation, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { convertPDFToImages, isPDFFile } from '@/lib/pdf-converter';
import { Progress } from '@/components/ui/progress';
import { useGoogleMapsAPI } from '@/hooks/useGoogleMapsAPI';
import { Slider } from '@/components/ui/slider';

interface FloorPlanUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  floorNumber: number;
  onUploadSuccess: (fileUrl: string) => void;
  defaultTab?: 'upload' | 'satellite';
}

export const FloorPlanUploadDialog = ({
  isOpen,
  onClose,
  locationId,
  floorNumber,
  onUploadSuccess,
  defaultTab = 'upload',
}: FloorPlanUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Satellite state
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [addressInput, setAddressInput] = useState('');
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(18);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const { apiKey, isLoaded: mapsLoaded, error: mapsError } = useGoogleMapsAPI();

  // Sync defaultTab when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setActiveTab(defaultTab);
    }
  };

  // --- Satellite logic ---

  const satellitePreviewUrl = mapCoordinates && apiKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${mapCoordinates.lat},${mapCoordinates.lng}&zoom=${zoomLevel}&size=800x600&maptype=satellite&key=${apiKey}`
    : null;

  const handleSearchAddress = async () => {
    if (!addressInput.trim() || !mapsLoaded || !window.google?.maps) return;
    setIsSearching(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ address: addressInput });
      if (result.results.length > 0) {
        const loc = result.results[0].geometry.location;
        setMapCoordinates({ lat: loc.lat(), lng: loc.lng() });
      } else {
        toast({ title: "Address Not Found", description: "Could not find that address. Try a more specific query.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Geocoding Error", description: error instanceof Error ? error.message : "Failed to search address.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseMyLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
        setAddressInput(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        setIsLocating(false);
      },
      (error) => {
        toast({ title: "Location Error", description: error.message, variant: "destructive" });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCaptureSatellite = async () => {
    if (!mapCoordinates || !apiKey) return;
    setIsUploading(true);
    try {
      const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${mapCoordinates.lat},${mapCoordinates.lng}&zoom=${zoomLevel}&size=1280x1280&maptype=satellite&scale=2&key=${apiKey}`;
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch satellite image');
      const blob = await response.blob();
      const file = new File([blob], `floor_${floorNumber}_satellite.png`, { type: 'image/png' });

      // Upload to storage (same logic as handleUpload)
      const filePath = `${locationId}/floor_${floorNumber}.png`;
      const { error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(filePath);

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

      window.dispatchEvent(new CustomEvent('FLOORPLAN_SAVED', {
        detail: { locationId, floorNumber, filePath }
      }));

      toast({
        title: "Satellite Captured",
        description: "Satellite view saved as floor plan.",
      });

      onUploadSuccess(publicUrl);
      handleClose();
    } catch (error) {
      console.error('Satellite capture error:', error);
      toast({
        title: "Capture Failed",
        description: error instanceof Error ? error.message : "Failed to capture satellite view.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // --- File upload logic (unchanged) ---

  const handleFileSelection = async (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File Too Large", description: "Please select a file smaller than 10MB.", variant: "destructive" });
      return;
    }

    if (isPDFFile(file)) {
      setIsConverting(true);
      setConversionProgress(0);
      try {
        const pages = await convertPDFToImages(file, (progress) => {
          setConversionProgress(Math.round((progress.currentPage / progress.totalPages) * 100));
        });
        if (pages.length === 0) throw new Error('No pages found in PDF');
        const firstPage = pages[0];
        const convertedFile = new File([firstPage.blob], `floor_${floorNumber}.png`, { type: 'image/png' });
        setSelectedFile(convertedFile);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(firstPage.blob);
        toast({ title: "PDF Converted", description: `Successfully converted page 1 of ${pages.length}.` });
      } catch (error) {
        console.error('PDF conversion error:', error);
        toast({ title: "PDF Conversion Failed", description: error instanceof Error ? error.message : "Could not convert PDF to image.", variant: "destructive" });
      } finally {
        setIsConverting(false);
      }
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid File Type", description: "Please select a PNG, JPG, SVG, or PDF file.", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      const img = new Image();
      img.onload = () => {
        if (img.width < 400 || img.height < 400) {
          toast({ title: "Image Too Small", description: "Please select an image at least 400x400 pixels.", variant: "destructive" });
          setSelectedFile(null);
          setPreviewUrl(null);
          return;
        }
        if (img.width > 4000 || img.height > 4000) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let newWidth = img.width;
          let newHeight = img.height;
          if (img.width > img.height) {
            newWidth = 4000;
            newHeight = (img.height / img.width) * 4000;
          } else {
            newHeight = 4000;
            newWidth = (img.width / img.height) * 4000;
          }
          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx?.drawImage(img, 0, 0, newWidth, newHeight);
          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, { type: 'image/png' });
              setSelectedFile(resizedFile);
              toast({ title: "Image Resized", description: `Image was automatically resized from ${img.width}x${img.height} to ${Math.round(newWidth)}x${Math.round(newHeight)}` });
            }
          }, 'image/png', 0.95);
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
      const { error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(filePath, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(filePath);
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
      window.dispatchEvent(new CustomEvent('FLOORPLAN_SAVED', {
        detail: { locationId, floorNumber, filePath }
      }));
      toast({ title: "Upload Successful", description: "Floor plan map uploaded and saved to location." });
      onUploadSuccess(publicUrl);
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Upload Failed", description: error instanceof Error ? error.message : "Failed to upload floor plan. Please try again.", variant: "destructive" });
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
    setAddressInput('');
    setMapCoordinates(null);
    setZoomLevel(18);
    onClose();
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === e.target) setIsDragActive(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFileSelection(files[0]);
  };

  const isSatelliteTab = activeTab === 'satellite';
  const canCapture = isSatelliteTab && mapCoordinates && apiKey;
  const canUpload = !isSatelliteTab && selectedFile;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else handleOpenChange(open); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Floor Plan Map</DialogTitle>
          <DialogDescription>
            Upload a file or capture a satellite view to use as your floor plan background.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="satellite" className="flex-1">
              <Globe className="h-4 w-4 mr-2" />
              Satellite View
            </TabsTrigger>
          </TabsList>

          {/* Upload File Tab */}
          <TabsContent value="upload">
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
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary'
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
                      <p className="text-sm font-medium text-primary mb-2">Drop file here</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">Click to select or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, SVG, or PDF (max 10MB, 400-4000px)</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative border rounded-lg overflow-hidden bg-muted">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewUrl(null); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-96 object-contain" />
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
          </TabsContent>

          {/* Satellite View Tab */}
          <TabsContent value="satellite">
            <div className="space-y-4">
              {!apiKey && !mapsError ? (
                <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading Maps API...</p>
                </div>
              ) : mapsError ? (
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">Google Maps API Not Configured</p>
                  <p className="text-xs text-muted-foreground">
                    Go to Settings &gt; API Keys to add your Google Maps API key.
                  </p>
                </div>
              ) : (
                <>
                  {/* Address search */}
                  <div className="space-y-2">
                    <Label>Search Address</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter address or coordinates..."
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSearchAddress}
                        disabled={isSearching || !addressInput.trim()}
                        className="shrink-0"
                      >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUseMyLocation}
                        disabled={isLocating}
                        className="shrink-0"
                        title="Use my location"
                      >
                        {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Zoom control */}
                  <div className="space-y-2">
                    <Label>Zoom Level: {zoomLevel}</Label>
                    <div className="flex items-center gap-3">
                      <Minus className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        value={[zoomLevel]}
                        onValueChange={(v) => setZoomLevel(v[0])}
                        min={15}
                        max={21}
                        step={1}
                        className="flex-1"
                      />
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Satellite preview */}
                  {satellitePreviewUrl ? (
                    <div className="relative border rounded-lg overflow-hidden bg-muted">
                      <img
                        src={satellitePreviewUrl}
                        alt="Satellite preview"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
                      <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Search for an address or use your GPS location
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The satellite image will appear here as a preview
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading || isConverting}>
            Cancel
          </Button>
          {isSatelliteTab ? (
            <Button
              onClick={handleCaptureSatellite}
              disabled={!canCapture || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Capture &amp; Use
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={!canUpload || isUploading || isConverting}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload &amp; Draw
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
