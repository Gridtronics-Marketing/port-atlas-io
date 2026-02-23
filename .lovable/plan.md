

# Add Satellite View Import to FloorPlanViewer

## Overview

Add an "Import Satellite View" button to `FloorPlanViewer.tsx` that opens a dialog where users can search for an address, preview a Google Maps satellite image, and capture it as the floor plan background.

## Changes

### `src/components/FloorPlanViewer.tsx` -- Full rework (currently 68 lines)

**1. New imports**
- `useState` from React
- `Globe, Map` from `lucide-react`
- `Button` from `@/components/ui/button`
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` from `@/components/ui/dialog`
- `Input` from `@/components/ui/input`
- `Label` from `@/components/ui/label`
- `useGoogleMapsAPI` from `@/hooks/useGoogleMapsAPI`
- `useToast` from `@/hooks/use-toast`

**2. Update interface**
```typescript
interface FloorPlanViewerProps {
  fileUrl: string;
  fileName: string;
  floorNumber: number;
  className?: string;
  viewType?: 'file' | 'satellite';  // NEW optional prop
}
```

**3. New state variables**
```typescript
const [isMapImportOpen, setIsMapImportOpen] = useState(false);
const [addressInput, setAddressInput] = useState('');
const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
const [satelliteImageUrl, setSatelliteImageUrl] = useState<string | null>(null);
const [currentView, setCurrentView] = useState<'file' | 'satellite'>(viewType || 'file');
const [zoomLevel, setZoomLevel] = useState(18);
```

**4. Address geocoding logic**

Use the existing `useGoogleMapsAPI` hook to load the Google Maps script. When user enters an address and clicks "Search":
- Use `google.maps.Geocoder` to convert address to lat/lng
- Generate a Google Maps Static API URL with `maptype=satellite`
- Preview it in the dialog via an `<img>` tag

```typescript
const handleSearchAddress = async () => {
  if (!isLoaded || !addressInput.trim()) return;
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: addressInput }, (results, status) => {
    if (status === 'OK' && results?.[0]) {
      const loc = results[0].geometry.location;
      const coords = { lat: loc.lat(), lng: loc.lng() };
      setMapCoordinates(coords);
    }
  });
};
```

The preview URL:
```typescript
const previewUrl = mapCoordinates && apiKey
  ? `https://maps.googleapis.com/maps/api/staticmap?center=${mapCoordinates.lat},${mapCoordinates.lng}&zoom=${zoomLevel}&size=800x600&maptype=satellite&key=${apiKey}`
  : null;
```

**5. "Capture & Use" button logic**

When clicked, set `satelliteImageUrl` to the static map URL, switch `currentView` to `'satellite'`, and close the dialog. The satellite image then renders using the same `<img>` tag and container as a standard file upload -- same dimensions, same `object-contain` behavior, so drop-point coordinate placement remains accurate.

**6. Updated header section** (applies to the `isImage` branch)

Replace the simple `<span>` with a flex row containing:
- "Floor {floorNumber} Plan" label
- Two toggle buttons: "Standard" (with `Map` icon) and "Satellite" (with `Globe` icon)
- "Import Satellite View" button (with `Globe` icon) that opens the dialog

```tsx
<div className="flex items-center justify-between mb-2">
  <span className="text-sm font-medium">Floor {floorNumber} Plan</span>
  <div className="flex items-center gap-1">
    {satelliteImageUrl && (
      <>
        <Button variant={currentView === 'file' ? 'default' : 'outline'} size="sm"
          onClick={() => setCurrentView('file')}>
          <Map className="h-4 w-4 mr-1" /> Standard
        </Button>
        <Button variant={currentView === 'satellite' ? 'default' : 'outline'} size="sm"
          onClick={() => setCurrentView('satellite')}>
          <Globe className="h-4 w-4 mr-1" /> Satellite
        </Button>
      </>
    )}
    <Button variant="outline" size="sm" onClick={() => setIsMapImportOpen(true)}>
      <Globe className="h-4 w-4 mr-1" /> Import Satellite View
    </Button>
  </div>
</div>
```

**7. Conditional rendering**

- `currentView === 'satellite'` and `satelliteImageUrl` exists: render the satellite image in the same `<img>` container with identical classes (`w-full h-auto max-h-[600px] object-contain`)
- `currentView === 'file'` and `isImage`: render existing file-based image (unchanged)
- Fallback: existing unsupported format block (unchanged)

**8. Dialog component** (rendered at the bottom of the component)

```tsx
<Dialog open={isMapImportOpen} onOpenChange={setIsMapImportOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Import Satellite View</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter address or coordinates..."
          value={addressInput} onChange={e => setAddressInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearchAddress()} />
        <Button onClick={handleSearchAddress}>Search</Button>
      </div>
      <div className="flex items-center gap-2">
        <Label>Zoom:</Label>
        <Input type="number" min={15} max={21} value={zoomLevel}
          onChange={e => setZoomLevel(Number(e.target.value))} className="w-20" />
      </div>
      {previewUrl ? (
        <div className="border rounded-lg overflow-hidden">
          <img src={previewUrl} alt="Satellite preview"
            className="w-full h-auto object-contain" />
        </div>
      ) : (
        <div className="h-64 border rounded-lg flex items-center justify-center bg-muted/30">
          <p className="text-muted-foreground">Enter an address to preview satellite imagery</p>
        </div>
      )}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsMapImportOpen(false)}>Cancel</Button>
      <Button disabled={!previewUrl} onClick={handleCaptureAndUse}>
        Capture & Use
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## What Stays Unchanged

- All existing `isImage` rendering logic (the file-based `<img>` tag)
- The "Unsupported file format" fallback block
- The `getFileExtension` helper function
- The component's external API (all existing props remain required/optional as before)
- The `InteractiveFloorPlan` component is not touched

## Technical Notes

- Uses the existing `useGoogleMapsAPI` hook -- no new API key management needed
- Google Maps Static Maps API generates a simple image URL, so the satellite view renders as a standard `<img>` -- same coordinate system as file uploads, so drop-point placement remains accurate
- The zoom level input (15-21) lets users adjust satellite detail level
- Toggle buttons only appear after a satellite image has been captured, keeping the UI clean for users who only use file uploads
- No new dependencies required
