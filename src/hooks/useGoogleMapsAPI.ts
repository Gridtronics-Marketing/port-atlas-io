import { useEffect, useState } from 'react';
import { useSystemConfigurations } from './useSystemConfigurations';

interface GoogleMapsAPIState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  apiKey: string | null;
}

let isScriptLoading = false;
let isScriptLoaded = false;

export const useGoogleMapsAPI = () => {
  const { configurations, loading: configLoading } = useSystemConfigurations('external_apis');
  const [state, setState] = useState<GoogleMapsAPIState>({
    isLoaded: isScriptLoaded,
    isLoading: false,
    error: null,
    apiKey: null
  });

  useEffect(() => {
    if (configLoading) return;

    // Find the Google Maps API key
    const apiKeyConfig = configurations.find(
      config => config.key === 'google_maps_api_key' && config.is_active
    );

    const apiKey = apiKeyConfig?.value;

    if (!apiKey) {
      setState({
        isLoaded: false,
        isLoading: false,
        error: 'Google Maps API key not configured. Please add it in Settings > API Keys.',
        apiKey: null
      });
      return;
    }

    setState(prev => ({ ...prev, apiKey }));

    // Check if already loaded
    if (isScriptLoaded && typeof window.google !== 'undefined' && window.google.maps) {
      setState({
        isLoaded: true,
        isLoading: false,
        error: null,
        apiKey
      });
      return;
    }

    // Check if script is already loading
    if (isScriptLoading) {
      setState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    // Load the script
    const loadGoogleMapsScript = () => {
      isScriptLoading = true;
      setState(prev => ({ ...prev, isLoading: true }));

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        isScriptLoaded = true;
        isScriptLoading = false;
        setState({
          isLoaded: true,
          isLoading: false,
          error: null,
          apiKey
        });
      };

      script.onerror = () => {
        isScriptLoading = false;
        setState({
          isLoaded: false,
          isLoading: false,
          error: 'Failed to load Google Maps API. Please check your API key and network connection.',
          apiKey
        });
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, [configurations, configLoading]);

  return state;
};
