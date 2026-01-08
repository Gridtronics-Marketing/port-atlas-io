import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png', 'screenshot-narrow.png', 'screenshot-wide.png'],
      manifest: {
        name: 'Trade Atlas - Field Operations',
        short_name: 'Trade Atlas',
        description: 'Mobile-first cable management and field operations platform',
        theme_color: '#D4A43E',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['business', 'productivity', 'utilities'],
        lang: 'en',
        dir: 'ltr',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon',
            purpose: 'any'
          },
          {
            src: '/icon-192.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshot-wide.png',
            type: 'image/png',
            sizes: '1280x720',
            form_factor: 'wide',
            label: 'Desktop dashboard view'
          },
          {
            src: '/screenshot-narrow.png',
            type: 'image/png',
            sizes: '512x896',
            form_factor: 'narrow',
            label: 'Mobile field operations view'
          }
        ],
        shortcuts: [
          {
            name: 'Field Operations',
            short_name: 'Field Ops',
            description: 'Quick access to field operations',
            url: '/field-operations',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Work Orders',
            short_name: 'Work Orders',
            description: 'View and manage work orders',
            url: '/work-orders',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
