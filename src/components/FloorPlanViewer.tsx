import { useState } from 'react';
import { Globe, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoogleMapsAPI } from '@/hooks/useGoogleMapsAPI';
import { useToast } from '@/hooks/use-toast';
import { InteractiveFloorPlan } from './InteractiveFloorPlan';

interface FloorPlanViewerProps {
  fileUrl: string;
  fileName: string;
  floorNumber: number;
  className?: string;
  viewType?: 'file' | 'satellite';
}

export const FloorPlanViewer = ({ 
  fileUrl, 
  fileName, 
  floorNumber, 
  className = "",
  viewType
}: FloorPlanViewerProps) => {
  const { isLoaded, apiKey } = useGoogleMapsAPI();
  const { toast } = useToast();

  const [isMapImportOpen, setIsMapImportOpen] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [satelliteImageUrl, setSatelliteImageUrl] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'file' | 'satellite'>(viewType || 'file');
  const [zoomLevel, setZoomLevel] = useState(18);

  // Determine file type from URL or fileName
  const getFileExtension = (url: string, name: string) => {
    const nameExt = name.split('.').pop()?.toLowerCase();
    if (nameExt) return nameExt;
    const urlExt = url.split('.').pop()?.toLowerCase().split('?')[0];
    return urlExt || '';
  };

  const fileExtension = getFileExtension(fileUrl, fileName);
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp', 'tiff'].includes(fileExtension);

  const previewUrl = mapCoordinates && apiKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${mapCoordinates.lat},${mapCoordinates.lng}&zoom=${zoomLevel}&size=800x600&maptype=satellite&key=${apiKey}`
    : null;

  const handleSearchAddress = async () => {
    if (!isLoaded || !addressInput.trim()) {
      if (!isLoaded) {
        toast({ title: 'Google Maps not loaded', description: 'Please configure your Google Maps API key in Settings > API Keys.', variant: 'destructive' });
      }
      return;
    }
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ address: addressInput }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        setMapCoordinates({ lat: loc.lat(), lng: loc.lng() });
      } else {
        toast({ title: 'Address not found', description: 'Could not geocode the provided address.', variant: 'destructive' });
      }
    });
  };

  const handleCaptureAndUse = () => {
    if (!previewUrl) return;
    setSatelliteImageUrl(previewUrl);
    setCurrentView('satellite');
    setIsMapImportOpen(false);
    toast({ title: 'Satellite view applied', description: 'The satellite image is now set as the floor plan background.' });
  };

  const headerSection = (
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">Floor {floorNumber} Plan</span>
      <div className="flex items-center gap-1">
        {satelliteImageUrl && (
          <>
            <Button variant={currentView === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setCurrentView('file')}>
              <Map className="h-4 w-4 mr-1" /> Standard
            </Button>
            <Button variant={currentView === 'satellite' ? 'default' : 'outline'} size="sm" onClick={() => setCurrentView('satellite')}>
              <Globe className="h-4 w-4 mr-1" /> Satellite
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={() => setIsMapImportOpen(true)}>
          <Globe className="h-4 w-4 mr-1" /> Import Satellite View
        </Button>
      </div>
    </div>
  );

  const satelliteDialog = (
    <Dialog open={isMapImportOpen} onOpenChange={setIsMapImportOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Satellite View</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter address or coordinates..."
              value={addressInput}
              onChange={e => setAddressInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchAddress()}
            />
            <Button onClick={handleSearchAddress}>Search</Button>
          </div>
          <div className="flex items-center gap-2">
            <Label>Zoom:</Label>
            <Input
              type="number"
              min={15}
              max={21}
              value={zoomLevel}
              onChange={e => setZoomLevel(Number(e.target.value))}
              className="w-20"
            />
          </div>
          {previewUrl ? (
            <div className="border rounded-lg overflow-hidden">
              <img src={previewUrl} alt="Satellite preview" className="w-full h-auto object-contain" />
            </div>
          ) : (
            <div className="h-64 border rounded-lg flex items-center justify-center bg-muted/30">
              <p className="text-muted-foreground">Enter an address to preview satellite imagery</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsMapImportOpen(false)}>Cancel</Button>
          <Button disabled={!previewUrl} onClick={handleCaptureAndUse}>Capture & Use</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Satellite view active
  if (currentView === 'satellite' && satelliteImageUrl) {
    return (
      <div className={`w-full ${className}`}>
        {headerSection}
        <div className="border rounded-lg overflow-hidden bg-white">
          <img
            src={satelliteImageUrl}
            alt={`Floor ${floorNumber} satellite view`}
            className="w-full h-auto max-h-[600px] object-contain"
          />
        </div>
        {satelliteDialog}
      </div>
    );
  }

  // Standard image view
  if (isImage) {
    return (
      <div className={`w-full ${className}`}>
        {headerSection}
        <div className="border rounded-lg overflow-hidden bg-white">
          <img
            src={fileUrl}
            alt={`Floor ${floorNumber} plan`}
            className="w-full h-auto max-h-[600px] object-contain"
            onError={(e) => {
              console.error("Failed to load floor plan image:", fileUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        {satelliteDialog}
      </div>
    );
  }

  // Fallback for unknown file types
  return (
    <div className={`w-full ${className}`}>
      {headerSection}
      <div className="border rounded-lg p-8 text-center bg-muted">
        <p className="text-muted-foreground">
          Unsupported file format: {fileExtension}
        </p>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Download File
        </a>
      </div>
      {satelliteDialog}
    </div>
  );
};
