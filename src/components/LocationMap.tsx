import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Settings } from 'lucide-react';
import { useGoogleMapsAPI } from '@/hooks/useGoogleMapsAPI';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';


interface LocationMapProps {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  locationName: string;
}

export const LocationMap = ({ address, latitude, longitude, locationName }: LocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { isLoaded, isLoading, error } = useGoogleMapsAPI();

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !isLoaded || typeof (window as any).google === 'undefined') return;

      try {
        // Initialize the map
        const { Map } = await (window as any).google.maps.importLibrary("maps") as any;
        const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary("marker") as any;

        let center: any;

        // Use provided coordinates if available, otherwise geocode the address
        if (latitude && longitude) {
          center = { lat: Number(latitude), lng: Number(longitude) };
        } else if (address) {
          // Geocode the address
          const geocoder = new (window as any).google.maps.Geocoder();
          try {
            const response = await geocoder.geocode({ address });
            if (response.results[0]) {
              center = response.results[0].geometry.location.toJSON();
            } else {
              // Default to a generic location if geocoding fails
              center = { lat: 39.8283, lng: -98.5795 }; // Center of US
            }
          } catch (geocodeError) {
            console.error('Geocoding failed:', geocodeError);
            center = { lat: 39.8283, lng: -98.5795 }; // Center of US
          }
        } else {
          center = { lat: 39.8283, lng: -98.5795 }; // Center of US
        }

        const map = new Map(mapRef.current, {
          zoom: 15,
          center,
          mapId: "DEMO_MAP_ID",
        });

        mapInstanceRef.current = map;

        // Add marker
        new AdvancedMarkerElement({
          map,
          position: center,
          title: locationName,
        });

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    if (isLoaded) {
      initMap();
    }
  }, [address, latitude, longitude, locationName, isLoaded]);

  // Show loading state
  if (isLoading) {
    return (
      <Card className="h-64">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error or not configured state
  if (error || !isLoaded) {
    return (
      <Card className="h-64">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {error || 'Map view requires Google Maps API'}
              </p>
              <p className="text-xs text-muted-foreground mb-3">{address}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure API Key
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-64">
      <CardContent className="p-0 h-full">
        <div ref={mapRef} className="w-full h-full rounded-lg" />
      </CardContent>
    </Card>
  );
};