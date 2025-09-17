import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bfa70013a03a47bfb8e2fe95af6289c4',
  appName: 'cable-catalog',
  webDir: 'dist',
  server: {
    url: 'https://bfa70013-a03a-47bf-b8e2-fe95af6289c4.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location']
    }
  }
};

export default config;