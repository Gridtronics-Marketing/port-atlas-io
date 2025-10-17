export const APP_VERSION = "0.5.8";

export interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
}

export const VERSION_HISTORY: VersionInfo[] = [
  {
    version: "0.5.8",
    date: "2025-01-17",
    changes: [
      "Fixed client locations query to properly fetch locations by both direct client assignment and project relationships",
      "Backfilled existing locations with client_id based on their associated projects",
      "Updated useClientLocations hook to use two separate queries with proper merging for accurate results",
      "Fixed database constraint on daily_logs to allow location deletion with SET NULL behavior",
      "Added comprehensive error logging for client location queries",
    ],
  },
  {
    version: "0.5.7",
    date: "2025-01-17",
    changes: [
      "Added direct client assignment to locations",
      "Locations can now be assigned to clients without requiring projects",
      "Updated location grid to display client information from direct assignment",
      "Enhanced client locations filtering to support both direct and project-based relationships",
      "Added client_id column to locations database table with proper foreign key constraints",
    ],
  },
  {
    version: "0.5.6",
    date: "2025-10-17",
    changes: [
      "Improved mobile navigation UX with larger touch targets (44px minimum)",
      "Repositioned PWA update notification to bottom-right (desktop) and bottom-center (mobile)",
      "Enhanced app header layout with centered 'Port Atlas' branding on mobile devices",
      "Increased header height on mobile (64px) for better touch accessibility",
      "Optimized sidebar navigation with larger icons (20px) and better spacing on mobile",
      "Fixed InApp education banner positioning to avoid overlapping with system UI (bottom-20 on mobile)",
      "Improved logout button touch target - icon-only (40x40px) on mobile",
      "Enhanced sidebar menu items with 48px minimum height on mobile devices",
      "Better z-index management for overlays and notifications (update at z-50, banner at z-40)",
      "Removed unused Navigation.tsx component to reduce code complexity",
      "Consistent mobile-first responsive design across all UI components",
    ],
  },
  {
    version: "0.5.5",
    date: "2025-10-17",
    changes: [
      "Added click-to-expand lightbox functionality to PhotoGallery component",
      "Added photo thumbnail display in Safety Checklist modal with click-to-expand",
      "Enhanced photo viewing experience - all photos now expandable to full-size view",
      "Fixed issue where safety checklist photos were only showing badges instead of thumbnails",
      "Improved photo gallery UX with cursor pointer and hover effects on clickable photos",
      "Added metadata display in expanded photo views (panoramic badge, employee, date)",
      "Prevented delete button clicks from triggering photo expansion in PhotoGallery",
    ],
  },
  {
    version: "0.5.4",
    date: "2025-10-17",
    changes: [
      "Fixed panoramic camera mode - now properly opens camera with wide aspect ratio (16:9) and higher resolution (3840x2160)",
      "Added visual 'PANORAMIC MODE' indicator in camera interface when capturing panoramic photos",
      "Implemented click-to-expand functionality for all photos in Enhanced Photo Gallery",
      "Added full-screen photo viewer dialog with metadata display (panoramic badge, employee info, date)",
      "Enhanced photo gallery UX with cursor pointer on hover to indicate clickable images",
      "Improved panoramic photo constraints for web camera capture with ideal 4K resolution settings",
      "Added daily log tracking for panoramic photo captures",
      "Fixed photo expansion modal to show all relevant photo metadata and context",
    ],
  },
  {
    version: "0.5.3",
    date: "2025-10-17",
    changes: [
      "Fixed foreign key constraint violation error in room view photos",
      "Added validation to prevent photo operations with invalid room view IDs",
      "Implemented panoramic photo support across all photo capture locations",
      "Added panoramic photo option to Room View creation modal (4 photo buttons)",
      "Added panoramic photo support for Drop Points with database schema update",
      "Added panoramic photo type selector in PhotoCaptureCard component",
      "Added panoramic photo support to Safety Checklist modal",
      "Enhanced all photo galleries to display panoramic photo indicators",
      "Updated drop_point_photos table with photo_type column",
      "Improved error handling and user feedback for photo operations",
    ],
  },
  {
    version: "0.5.2",
    date: "2025-10-17",
    changes: [
      "Added mobile touch support for dragging drop points and room views on floor plans",
      "Enhanced admin permissions - admins can now capture photos without employee record",
      "Implemented panoramic photo capture with distinct photo type tracking",
      "Added panoramic photo indicators and badges in photo galleries",
      "Improved touch event handling with unified mouse/touch coordinate system",
      "Fixed page scrolling interference during drag operations on mobile devices",
      "Enhanced database schema with photo_type field for room view photos",
      "Optimized photo capture workflow for better mobile experience",
      "Made version number clickable to access changelog directly",
      "Added 'About & Changelog' quick access in user dropdown menu",
    ],
  },
  {
    version: "0.5.1",
    date: "2025-10-12",
    changes: [
      "Fixed 'Cannot convert drawing to floor plan' error for new locations",
      "Hidden 'Use as Floor Plan' button when creating new locations (only shows for existing locations)",
      "Enhanced user experience by preventing conversion errors during location creation",
      "Improved drawing workflow clarity for new vs. existing locations",
    ],
  },
  {
    version: "0.5.0",
    date: "2025-10-06",
    changes: [
      "Added all 6 drop point status options: planned, roughed, terminated, tested, active, inactive",
      "Auto-start blank canvas - removed manual 'Start with Blank Canvas' button",
      "Enhanced drawing save with retry logic and better error handling",
      "Updated PDF.js library to match worker version for reliable PDF conversion",
      "Added cable count to floor plan labels (shows '# Cables' or 'TBD')",
      "Improved label layout: Cable count (top), Status (middle), Label (bottom)",
      "Added PDF export functionality for floor plans with metadata",
      "PDF export includes drop points summary, room views, and location details",
      "Fixed camera lifecycle management for room view captures",
      "Enhanced error messages for drawing conversion failures",
    ],
  },
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
