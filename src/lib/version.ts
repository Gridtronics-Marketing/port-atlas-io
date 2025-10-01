export const APP_VERSION = "0.4.0";

export interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
}

export const VERSION_HISTORY: VersionInfo[] = [
  {
    version: "0.4.0",
    date: "2025-10-01",
    changes: [
      "Added 'Use as Floor Plan' feature to convert drawings to permanent floor plans",
      "Implemented high-resolution PNG export from canvas drawings",
      "Added confirmation dialog with preview before replacing floor plans",
      "Automatic file management and Supabase storage integration",
      "Enhanced workflow: drawing annotations can now become full floor plans",
      "Seamless conversion process with automatic cleanup of old files",
      "Improved user experience with clear success feedback and page refresh",
    ],
  },
  {
    version: "0.3.2",
    date: "2025-01-08",
    changes: [
      "Fixed critical DOM removal error with Fabric.js canvas disposal",
      "Added proper guards to prevent canvas double-initialization",
      "Implemented synchronous cleanup of Fabric.js DOM elements",
      "Wrapped canvases in container divs to prevent React/Fabric.js conflicts",
      "Enhanced canvas lifecycle management for stability",
    ],
  },
  {
    version: "0.3.1",
    date: "2025-01-08",
    changes: [
      "Fixed saved drawings not appearing outside of drawing mode",
      "Added read-only drawing viewer for non-editing contexts",
      "Improved drawing persistence and visibility",
      "Optimized canvas rendering and disposal",
    ],
  },
  {
    version: "0.3.0",
    date: "2025-01-08",
    changes: [
      "Removed non-functional demo mode from floor plan viewer",
      "Enhanced floor plan workflow to directly show interactive editor",
      "Users can now immediately upload or draw on blank canvas",
      "Improved discoverability of floor plan tools",
      "Streamlined user experience for locations without floor plans",
    ],
  },
  {
    version: "0.2.0",
    date: "2025-01-08",
    changes: [
      "Enhanced blank canvas drawing flow with visible light gray background",
      "Added localStorage persistence for temporary drawings",
      "Enabled drawing mode immediately for new locations without floor plans",
      "Improved canvas visibility with dashed border and subtle shadow",
      "Added auto-save functionality with clear status indicators",
      "Enhanced UX with better visual feedback for blank canvas state",
      "Fixed drawing canvas initialization issues",
    ],
  },
  {
    version: "0.1.0",
    date: "2025-10-01",
    changes: [
      "Fixed drawing mode UUID validation issues",
      "Added temporary drawing storage for new locations",
      "Improved error handling in database hooks",
      "Enhanced InteractiveFloorPlan to handle invalid location IDs",
      "Added graceful fallbacks for drawing operations",
    ],
  },
  {
    version: "0.0.0",
    date: "2025-09-01",
    changes: [
      "Initial release",
      "Core location management features",
      "Interactive floor plans",
      "Basic drawing capabilities",
    ],
  },
];

export const getCurrentVersion = () => APP_VERSION;
export const getVersionHistory = () => VERSION_HISTORY;
