import { useState, useEffect } from 'react';

interface PWAData {
  isInstalled: boolean;
  isStandalone: boolean;
  installPrompt: any;
  canInstall: boolean;
  isOnline: boolean;
  needsUpdate: boolean;
}

export const usePWA = (): PWAData => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    // Check if app is installed/standalone
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const iOSStandalone = (window.navigator as any).standalone === true;
      const webApk = 'standalone' in window.navigator;
      
      setIsStandalone(standalone || iOSStandalone);
      setIsInstalled(standalone || iOSStandalone || webApk);
    };

    checkStandalone();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setNeedsUpdate(true);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isInstalled,
    isStandalone,
    installPrompt,
    canInstall,
    isOnline,
    needsUpdate,
  };
};

// PWA analytics tracking
export const trackPWAEvent = (event: string, data?: any) => {
  // Check if gtag is available (Google Analytics)
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', event, {
      event_category: 'PWA',
      event_label: data?.label,
      value: data?.value,
    });
  }
  
  console.log(`PWA Event: ${event}`, data);
};

// Check if device supports PWA features
export const getPWACapabilities = () => {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    notifications: 'Notification' in window,
    pushManager: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    webShare: 'share' in navigator,
    installPrompt: true, // Most modern browsers support this
    fullscreen: 'requestFullscreen' in document.documentElement,
    screenOrientation: 'orientation' in screen,
    deviceMotion: 'DeviceMotionEvent' in window,
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    storage: 'storage' in navigator && 'estimate' in navigator.storage,
  };
};

// Get PWA installation status
export const getPWAInstallationStatus = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  const isInstalled = isStandalone || isIOSStandalone;

  return {
    isInstalled,
    isStandalone,
    method: isIOSStandalone ? 'ios' : isStandalone ? 'web_app_manifest' : 'browser',
  };
};