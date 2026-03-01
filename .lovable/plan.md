

# Upgrade Satellite View: Autocomplete Search + Interactive Map

## Problem

1. **Address search is manual** -- user must type the full address and press Enter/click search. No suggestions appear as they type.
2. **Map preview is a static image** -- users cannot pan or drag the view. They're stuck with whatever center point the geocoder returns.

## Solution

Replace the current plain text input + static image with:
1. **Google Places Autocomplete** on the address input (suggestions appear as user types)
2. **An interactive Google Map** (satellite mode) that users can drag/pan/zoom with mouse or finger, just like Google Maps

When the user clicks "Capture & Use", the system reads the map's current center and zoom, fetches a high-res static image from that position, and uploads it as before.

## Changes

### `src/components/FloorPlanUploadDialog.tsx`

**1. Replace the plain `<Input>` with a Google Places Autocomplete input**

- After the Google Maps script loads (it already includes `libraries=places`), attach a `google.maps.places.Autocomplete` instance to the input field using a ref
- As the user types, Google will show address suggestions in a dropdown
- When a suggestion is selected, extract coordinates and center the interactive map there
- Keep the manual "Use My Location" GPS button as-is

**2. Replace the static satellite image with an interactive `google.maps.Map`**

- Render a `div` ref that gets initialized as a `google.maps.Map` with `mapTypeId: 'satellite'`
- The map supports drag/pan (mouse and touch), zoom via scroll/pinch, and all standard Google Maps interactions
- When the user pans or zooms, track the map's center and zoom level via `idle` event listener
- Remove the `<Slider>` zoom control (the map has its own built-in zoom controls, plus pinch-to-zoom)

**3. Capture logic stays the same**

- On "Capture & Use", read `map.getCenter()` and `map.getZoom()` to build the Static Maps API URL
- Fetch the high-res image, upload to Supabase storage, update the DB -- all unchanged

**New state/refs:**
- `mapContainerRef = useRef<HTMLDivElement>(null)` -- the div where the interactive map renders
- `mapInstanceRef = useRef<google.maps.Map | null>(null)` -- reference to the map instance
- `autocompleteInputRef = useRef<HTMLInputElement>(null)` -- ref for Autocomplete binding
- Remove the `Slider` import and zoom slider UI (map has native zoom controls)

**Key code patterns:**

```typescript
// Initialize interactive map
useEffect(() => {
  if (!mapsLoaded || !mapContainerRef.current || !apiKey) return;
  
  const map = new google.maps.Map(mapContainerRef.current, {
    center: mapCoordinates || { lat: 37.7749, lng: -122.4194 },
    zoom: zoomLevel,
    mapTypeId: 'satellite',
    gestureHandling: 'greedy', // allows single-finger pan on mobile
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
}, [mapsLoaded, apiKey, activeTab]);

// Initialize Places Autocomplete
useEffect(() => {
  if (!mapsLoaded || !autocompleteInputRef.current) return;
  
  const autocomplete = new google.maps.places.Autocomplete(
    autocompleteInputRef.current,
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
}, [mapsLoaded, activeTab]);
```

**Capture (updated to read from map instance):**
```typescript
const handleCaptureSatellite = async () => {
  const map = mapInstanceRef.current;
  if (!map || !apiKey) return;
  
  const center = map.getCenter();
  const zoom = map.getZoom();
  if (!center) return;
  
  const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat()},${center.lng()}&zoom=${zoom}&size=1280x1280&maptype=satellite&scale=2&key=${apiKey}`;
  // ... rest of upload logic unchanged
};
```

**UI layout for satellite tab:**
```text
[Search Address input (with autocomplete)]  [GPS button]
[Interactive Google Map - 400px tall, satellite view, draggable]
```

- The zoom slider is removed (map has native zoom)
- The static image preview is replaced by the live interactive map
- The "Use My Location" button pans the map to the user's GPS coordinates

### What stays unchanged

- File upload tab (completely untouched)
- Capture-to-storage upload logic (same Static Maps API fetch + Supabase upload)
- `useGoogleMapsAPI` hook (already loads `places` library)
- All existing props and dialog structure
- The toolbar button in `InteractiveFloorPlan.tsx`

