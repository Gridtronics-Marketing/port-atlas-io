/// <reference types="vite/client" />

declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: any);
      setCenter(latlng: any): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: any): void;
    }
    class Marker {
      constructor(options?: any);
      setMap(map: any): void;
      addListener(event: string, handler: () => void): void;
    }
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
    class LatLngBounds {
      constructor();
      extend(latlng: any): this;
    }
    class InfoWindow {
      constructor(options?: any);
      open(options?: any): void;
      close(): void;
    }
    namespace places {
      class AutocompleteService {
        getPlacePredictions(request: any, callback: (results: any[], status: string) => void): void;
      }
      class PlacesService {
        constructor(element: HTMLElement);
        getDetails(request: any, callback: (result: any, status: string) => void): void;
      }
      interface AutocompletePrediction {
        place_id: string;
        description: string;
        structured_formatting: {
          main_text: string;
          secondary_text: string;
        };
      }
      const PlacesServiceStatus: {
        OK: string;
      };
    }
    namespace event {
      function addListener(instance: any, event: string, handler: (...args: any[]) => void): any;
      function addListenerOnce(instance: any, event: string, handler: (...args: any[]) => void): any;
    }
    const ControlPosition: Record<string, number>;
    const MapTypeId: Record<string, string>;
  }
}

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
/// <reference types="vite-plugin-pwa/react" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:pwa-register/react' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: any) => void
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, (value: boolean) => void]
    offlineReady: [boolean, (value: boolean) => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
