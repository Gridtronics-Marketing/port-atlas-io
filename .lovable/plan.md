
# Add Satellite View Capture as Floor Plan Option

## Overview

Enhance the `FloorPlanUploadDialog` to include a "Satellite View" tab alongside the existing file upload. Users can search by address (or use GPS on mobile), preview a satellite image via Google Maps Static API, adjust zoom, and capture it as the floor plan. This reuses the existing `useGoogleMapsAPI` hook and the satellite capture pattern already in `FloorPlanViewer.tsx`.

## Changes

### 1. `src/components/FloorPlanUploadDialog.tsx` -- Major Enhancement

Add a tabbed interface inside the dialog with two modes: **Upload File** and **Satellite View**.

**New imports:**
- `Globe, MapPin, Navigation` from lucide-react
- `Tabs, TabsList, TabsTrigger, TabsContent` from shadcn
- `Input` from shadcn
- `Label` from shadcn
- `useGoogleMapsAPI` from the existing hook
- `Capacitor` from `@capacitor/core` (for native GPS) or fallback to browser `navigator.geolocation`

**New state:**
- `activeTab`: `'upload' | 'satellite'`
- `addressInput`: string for address search
- `mapCoordinates`: `{ lat: number; lng: number } | null`
- `zoomLevel`: number (default 18, range 15-21)
- `isSearching`: boolean (geocoding in progress)
- `isLocating`: boolean (GPS lookup in progress)

**Satellite tab UI:**
1. Address input field with a "Search" button and a "Use My Location" button (GPS icon)
2. Zoom level slider or number input (15-21)
3. Preview area showing the Google Maps Static API satellite image
4. The existing "Upload & Draw" button text changes to "Capture & Use" when on satellite tab

**Satellite capture flow:**
1. User enters address or taps "Use My Location"
2. Address is geocoded via `google.maps.Geocoder` (same pattern as `FloorPlanViewer.tsx`)
3. GPS uses `navigator.geolocation.getCurrentPosition`
4. Preview renders: `https://maps.googleapis.com/maps/api/staticmap?center={lat},{lng}&zoom={zoom}&size=800x600&maptype=satellite&key={apiKey}`
5. User adjusts zoom until satisfied
6. On "Capture & Use": fetch the static map image as a blob, upload to Supabase storage (same `floor-plans` bucket, same path pattern), update the `floor_plan_files` JSONB, dispatch `FLOORPLAN_SAVED` event, and call `onUploadSuccess`

**Key logic for capture:**
```typescript
const handleCaptureSatellite = async () => {
  if (!mapCoordinates || !apiKey) return;
  setIsUploading(true);
  try {
    const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${mapCoordinates.lat},${mapCoordinates.lng}&zoom=${zoomLevel}&size=1280x1280&maptype=satellite&scale=2&key=${apiKey}`;
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], `floor_${floorNumber}_satellite.png`, { type: 'image/png' });
    
    // Reuse existing upload logic (upload to storage, update DB, dispatch event)
    // ...same as handleUpload but with the satellite file
  } finally {
    setIsUploading(false);
  }
};
```

**Note:** Uses `size=1280x1280&scale=2` for a high-resolution 2560x2560 satellite image (within Google Maps Static API limits).

**GPS / "Use My Location" button:**
```typescript
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
```

### 2. `src/components/InteractiveFloorPlan.tsx` -- Minor Toolbar Addition

Add a dedicated "Satellite View" button next to "Upload Map" in the sticky toolbar (around line 648). This button opens the same `FloorPlanUploadDialog` but pre-selects the satellite tab.

**Changes:**
- Add `showSatelliteDialog` state (or pass a `defaultTab` prop to `FloorPlanUploadDialog`)
- Add a new prop `defaultTab?: 'upload' | 'satellite'` to `FloorPlanUploadDialog`
- Add a Globe icon button in the toolbar:
```tsx
<Button variant="outline" size="sm" onClick={() => { setShowUploadDialog(true); setUploadDialogDefaultTab('satellite'); }}>
  <Globe className="h-4 w-4 mr-2" />
  Satellite View
</Button>
```

### 3. What stays unchanged

- All existing file upload logic (drag-drop, PDF conversion, image validation)
- The `FloorPlanViewer.tsx` satellite import feature (separate component, different use case)
- Drop point coordinate mapping (percentage-based, works regardless of image source)
- Storage bucket structure and DB schema (no migrations needed)
- All existing floor plan editing, drawing, and annotation features

## Technical Notes

- The Google Maps Static API key is already configured via `useGoogleMapsAPI` hook and stored in `system_configurations`
- If the API key is not configured, the satellite tab will show a message directing users to Settings > API Keys
- The captured satellite image is stored as a regular PNG in the `floor-plans` bucket, making it fully compatible with all existing floor plan features (markers, wire paths, annotations, export)
- No database migrations required -- the satellite image is just another floor plan file
- GPS works on both web (navigator.geolocation) and native Capacitor (same API surface)
