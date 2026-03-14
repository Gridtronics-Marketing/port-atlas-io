import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, FileText, Loader2, Globe, Navigation } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { convertPDFToImages, isPDFFile } from '@/lib/pdf-converter';
import { Progress } from '@/components/ui/progress';
import { useGoogleMapsAPI } from '@/hooks/useGoogleMapsAPI';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const { toast } = useToast();

  // Satellite state
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(18);
  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const { apiKey, isLoaded: mapsLoaded, error: mapsError } = useGoogleMapsAPI();

  // Sync defaultTab when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setActiveTab(defaultTab);
    }
  };

  // Initialize interactive map (deferred to ensure DOM is ready)
  useEffect(() => {
    if (!mapsLoaded || !apiKey || activeTab !== 'satellite') return;

    const timerId = setTimeout(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = new (window as any).google.maps.Map(mapContainerRef.current, {
        center: mapCoordinates || { lat: 37.7749, lng: -122.4194 },
        zoom: zoomLevel,
        mapTypeId: 'satellite',
        gestureHandling: 'greedy',
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      map.addListener('idle', () => {
        const center = map.getCenter();
        if (center) {
          setMapCoordinates({ lat: center.lat(), lng: center.lng() });
          setZoomLevel(map.getZoom() || 18);
        }
      });

      mapInstanceRef.current = map;
      setMapReady(true);
    }, 100);

    return () => clearTimeout(timerId);
  }, [mapsLoaded, apiKey, activeTab]);

  // Initialize Places Autocomplete with deferred timing
  useEffect(() => {
    if (!mapsLoaded || activeTab !== 'satellite') return;

    // Defer to ensure the input is mounted in the DOM after tab switch
    const timerId = setTimeout(() => {
      const input = autocompleteInputRef.current;
      if (!input || autocompleteRef.current) return;

      const autocomplete = new (window as any).google.maps.places.Autocomplete(
        input,
        { types: ['geocode', 'establishment'] }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const loc = place.geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          setMapCoordinates(coords);
          mapInstanceRef.current?.panTo(coords);
          mapInstanceRef.current?.setZoom(19);
        }
      });

      autocompleteRef.current = autocomplete;
    }, 100);

    return () => clearTimeout(timerId);
  }, [mapsLoaded, activeTab]);

  // Cleanup map on close
  const cleanupMap = useCallback(() => {
    mapInstanceRef.current = null;
    autocompleteRef.current = null;
    setMapReady(false);
  }, []);

  const handleUseMyLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setMapCoordinates(coords);
        mapInstanceRef.current?.panTo(coords);
        mapInstanceRef.current?.setZoom(19);
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
    const map = mapInstanceRef.current;
    if (!map || !apiKey) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    if (!center) return;

    setIsUploading(true);
    try {
      const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat()},${center.lng()}&zoom=${zoom}&size=1280x1280&maptype=satellite&scale=2&key=${apiKey}`;
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch satellite image');
      const blob = await response.blob();
      const file = new File([blob], `floor_${floorNumber}_satellite.png`, { type: 'image/png' });

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
    setMapCoordinates(null);
    setZoomLevel(18);
    cleanupMap();
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
  const canCapture = isSatelliteTab && mapReady && apiKey;
  const canUpload = !isSatelliteTab && selectedFile;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else handleOpenChange(open); }}>
      <DialogContent
        className="max-w-2xl"
        onPointerDownOutside={(e) => {
          if ((e.target as HTMLElement).closest('.pac-container')) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement).closest('.pac-container')) e.preventDefault();
        }}
      >
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
                  {/* Address search with autocomplete */}
                  <div className="space-y-2">
                    <Label>Search Address</Label>
                    <div className="flex gap-2">
                      <input
                        ref={autocompleteInputRef}
                        type="text"
                        placeholder="Start typing an address..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
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

                  {/* Interactive satellite map */}
                  <div
                    ref={mapContainerRef}
                    className="w-full h-[400px] rounded-lg border border-border overflow-hidden bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Drag to pan, scroll or pinch to zoom. Position the view, then capture.
                  </p>
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
