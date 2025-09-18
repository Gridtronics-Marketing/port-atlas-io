import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface LocationMapProps {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  locationName: string;
}

export const LocationMap = ({ address, latitude, longitude, locationName }: LocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || typeof window.google === 'undefined') return;

      try {
        // Initialize the map
        const { Map } = await window.google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        let center: google.maps.LatLngLiteral;

        // Use provided coordinates if available, otherwise geocode the address
        if (latitude && longitude) {
          center = { lat: Number(latitude), lng: Number(longitude) };
        } else if (address) {
          // Geocode the address
          const geocoder = new window.google.maps.Geocoder();
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

    // Check if Google Maps API is available
    if (typeof window.google !== 'undefined' && window.google.maps) {
      initMap();
    }
  }, [address, latitude, longitude, locationName]);

  // Check if Google Maps API is available
  if (typeof window.google === 'undefined' || !window.google?.maps) {
    return (
      <Card className="h-64">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Map view requires Google Maps API</p>
            <p className="text-xs mt-1">{address}</p>
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