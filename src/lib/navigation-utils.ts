/**
 * Navigation utilities for opening external map applications
 */

export interface NavigationOptions {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

/**
 * Detect user's platform
 */
export const detectPlatform = (): 'ios' | 'android' | 'web' => {
  const userAgent = navigator.userAgent || navigator.vendor;
  
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return 'ios';
  }
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  return 'web';
};

/**
 * Generate Google Maps URL for navigation
 */
export const getGoogleMapsUrl = (options: NavigationOptions): string => {
  const { latitude, longitude, address, name } = options;
  const query = address || `${latitude},${longitude}`;
  const label = name ? `&query_place_id=${encodeURIComponent(name)}` : '';
  
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}${label}`;
};

/**
 * Generate Apple Maps URL for navigation
 */
export const getAppleMapsUrl = (options: NavigationOptions): string => {
  const { latitude, longitude, name } = options;
  const label = name ? `&q=${encodeURIComponent(name)}` : '';
  
  return `https://maps.apple.com/?daddr=${latitude},${longitude}${label}`;
};

/**
 * Generate Waze URL for navigation
 */
export const getWazeUrl = (options: NavigationOptions): string => {
  const { latitude, longitude } = options;
  
  return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
};

/**
 * Open navigation based on platform
 */
export const openNavigation = (options: NavigationOptions, app?: 'google' | 'apple' | 'waze') => {
  const platform = detectPlatform();
  let url: string;
  
  if (app === 'waze') {
    url = getWazeUrl(options);
  } else if (app === 'apple' || (platform === 'ios' && !app)) {
    url = getAppleMapsUrl(options);
  } else {
    url = getGoogleMapsUrl(options);
  }
  
  window.open(url, '_blank');
};

/**
 * Get current user location
 */
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
};
