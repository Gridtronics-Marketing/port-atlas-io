/// <reference types="vite/client" />

declare namespace google {
  namespace maps {
    const SymbolPosition: any;
    class Map {
      constructor(element: HTMLElement, options?: any);
      [key: string]: any;
    }
    class Marker {
      constructor(options?: any);
      [key: string]: any;
    }
    class LatLng {
      constructor(lat: number, lng: number);
      [key: string]: any;
    }
    class LatLngBounds {
      constructor();
      [key: string]: any;
    }
    class InfoWindow {
      constructor(options?: any);
      [key: string]: any;
    }
    class Geocoder {
      constructor();
      [key: string]: any;
    }
    function importLibrary(name: string): Promise<any>;
    namespace places {
      class AutocompleteService {
        [key: string]: any;
      }
      class PlacesService {
        constructor(element: HTMLElement);
        [key: string]: any;
      }
      class Autocomplete {
        constructor(input: HTMLInputElement, options?: any);
        [key: string]: any;
      }
      const PlacesServiceStatus: any;
    }
    namespace marker {
      const [key: string]: any;
    }
    namespace event {
      function addListener(instance: any, event: string, handler: (...args: any[]) => void): any;
      function addListenerOnce(instance: any, event: string, handler: (...args: any[]) => void): any;
    }
    const ControlPosition: any;
    const MapTypeId: any;
    type MapsLibrary = any;
    type MarkerLibrary = any;
    type LatLngLiteral = { lat: number; lng: number };
    type PlaceResult = any;
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
