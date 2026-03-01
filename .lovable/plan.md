

# Fix: Interactive Map Not Loading After Address Selection

## Root Cause

The map initialization `useEffect` (line 67-93) runs synchronously when `activeTab` changes to `'satellite'`, but the `TabsContent` hasn't mounted the map container `div` into the DOM yet. The effect hits `!mapContainerRef.current` on line 68 and returns early. Since the dependencies (`mapsLoaded`, `apiKey`, `activeTab`) don't change again, the effect never re-runs, so the map never initializes.

This is the exact same timing issue that was fixed for the autocomplete input with a `setTimeout`.

## Fix

### `src/components/FloorPlanUploadDialog.tsx`

Wrap the map initialization logic in a `setTimeout` (like the autocomplete fix), and add cleanup:

```typescript
// Initialize interactive map (deferred to ensure DOM is ready)
useEffect(() => {
  if (!mapsLoaded || !apiKey || activeTab !== 'satellite') return;

  const timerId = setTimeout(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: mapCoordinates || { lat: 37.7749, lng: -122.4194 },
      zoom: zoomLevel,
      mapTypeId: 'satellite',
      gestureHandling: 'greedy',
      // ... same options
    });

    map.addListener('idle', () => { /* same */ });

    mapInstanceRef.current = map;
    setMapReady(true);
  }, 100);

  return () => clearTimeout(timerId);
}, [mapsLoaded, apiKey, activeTab]);
```

The only change is moving the `!mapContainerRef.current` check inside a `setTimeout(…, 100)` so the DOM has time to render after the tab switch, and adding cleanup via `clearTimeout`.

