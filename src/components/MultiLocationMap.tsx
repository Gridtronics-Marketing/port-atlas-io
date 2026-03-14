import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, Settings } from 'lucide-react';
import { type Location } from '@/hooks/useLocations';
import { useGoogleMapsAPI } from '@/hooks/useGoogleMapsAPI';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { openNavigation } from '@/lib/navigation-utils';


interface MultiLocationMapProps {
  locations: Location[];
  onLocationClick?: (location: Location) => void;
  height?: string;
}

export const MultiLocationMap = ({ 
  locations, 
  onLocationClick,
  height = "h-96"
}: MultiLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const { isLoaded, isLoading, error } = useGoogleMapsAPI();

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !isLoaded || typeof window.google === 'undefined') {
        setIsInitializing(false);
        return;
      }

      try {
        setIsInitializing(true);
        const { Map } = await (window as any).google.maps.importLibrary("maps") as any;
        const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary("marker") as any;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.map = null);
        markersRef.current = [];

        // Geocode all locations
        const geocoder = new (window as any).google.maps.Geocoder();
        const locationCoords: Array<{location: Location, position: any}> = [];

        for (const location of locations) {
          try {
            if (location.latitude && location.longitude) {
              locationCoords.push({
                location,
                position: { lat: Number(location.latitude), lng: Number(location.longitude) }
              });
            } else if (location.address) {
              const response = await geocoder.geocode({ address: location.address });
              if (response.results[0]) {
                locationCoords.push({
                  location,
                  position: response.results[0].geometry.location.toJSON()
                });
              }
            }
          } catch (error) {
            console.error(`Error geocoding location ${location.name}:`, error);
          }
        }

        if (locationCoords.length === 0) {
          setIsInitializing(false);
          return;
        }

        // Calculate center and bounds
        const bounds = new window.google.maps.LatLngBounds();
        locationCoords.forEach(({ position }) => bounds.extend(position));
        const center = bounds.getCenter().toJSON();

        // Initialize map with dark theme
        const map = new Map(mapRef.current, {
          center,
          zoom: 12,
          mapId: "DEMO_MAP_ID",
          styles: [
            {
              featureType: "all",
              elementType: "geometry",
              stylers: [{ color: "#1a2332" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#0d1520" }]
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#2a3545" }]
            },
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        mapInstanceRef.current = map;

        // Fit bounds to show all markers
        map.fitBounds(bounds);

        // Create markers for each location
        locationCoords.forEach(({ location, position }) => {
          // Create custom marker content
          const markerContent = document.createElement('div');
          markerContent.className = 'relative';
          markerContent.innerHTML = `
            <div class="bg-primary text-primary-foreground rounded-full p-2 shadow-strong cursor-pointer transition-transform hover:scale-110" style="box-shadow: 0 4px 12px rgba(0, 174, 174, 0.4);">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `;

          const marker = new AdvancedMarkerElement({
            map,
            position,
            content: markerContent,
            title: location.name,
          });

          const address = location.address || '';
          const lat = position.lat;
          const lng = position.lng;

          // Create info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-3 min-w-[200px]">
                <h3 class="font-semibold text-base mb-1">${location.name}</h3>
                <p class="text-sm text-muted-foreground mb-2">${address || 'No address'}</p>
                <div class="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>${location.floors} floor${location.floors !== 1 ? 's' : ''}</span>
                  ${location.drop_points_count ? `<span>${location.drop_points_count} drop points</span>` : ''}
                </div>
                ${location.status ? `
                  <div class="mt-2 pt-2 border-t border-border">
                    <span class="inline-block px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">${location.status}</span>
                  </div>
                ` : ''}
                <button 
                  id="navigate-btn-${location.id}"
                  style="margin-top: 12px; padding: 8px 16px; background-color: hsl(222.2 47.4% 11.2%); color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; width: 100%; justify-content: center;"
                >
                  <span style="font-size: 16px;">🧭</span>
                  Navigate to Location
                </button>
              </div>
            `,
          });

          // Add click listener
          markerContent.addEventListener('click', () => {
            // Close all other info windows
            markersRef.current.forEach((m: any) => {
              if (m.infoWindow) m.infoWindow.close();
            });
            
            infoWindow.open(map, marker);
            
            // Add click handler for navigate button
            window.google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
              const navigateBtn = document.getElementById(`navigate-btn-${location.id}`);
              if (navigateBtn) {
                navigateBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  openNavigation({
                    latitude: lat,
                    longitude: lng,
                    address: address,
                    name: location.name
                  });
                });
              }
            });
            
            if (onLocationClick) {
              onLocationClick(location);
            }
          });

          // Store info window reference
          (marker as any).infoWindow = infoWindow;
          markersRef.current.push(marker);
        });

        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setIsInitializing(false);
      }
    };

    if (isLoaded) {
      initMap();
    } else {
      setIsInitializing(false);
    }

    return () => {
      // Cleanup markers on unmount
      markersRef.current.forEach(marker => marker.map = null);
      markersRef.current = [];
    };
  }, [locations, onLocationClick, isLoaded]);

  // Show loading state
  if (isLoading) {
    return (
      <Card className={height}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error or not configured state
  if (error || !isLoaded) {
    return (
      <Card className={height}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {error || 'Map view requires Google Maps API'}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Configure your API key to enable maps
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Go to Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (locations.length === 0) {
    return (
      <Card className={height}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No locations to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={height}>
      <CardContent className="p-0 h-full relative">
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading map...</span>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full rounded-lg" />
      </CardContent>
    </Card>
  );
};