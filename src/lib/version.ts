export const APP_VERSION = "0.9.0";

export interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
}

export const VERSION_HISTORY: VersionInfo[] = [
  {
    version: "0.9.0",
    date: "2025-01-29",
    changes: [
      "Added measurement tools to photo annotation system",
      "Implemented distance measurement with line tool",
      "Added angle measurement (3-point) tool",
      "Created area measurement with polygon tool",
      "Built scale calibration system for real-world measurements",
      "Added unit conversion (mm, cm, m, in, ft)",
      "Created measurement data storage in annotation metadata",
      "Enhanced toolbar with measurement tool dropdown",
      "Improved measurement visualization on canvas"
    ]
  },
  {
    version: "0.8.0",
    date: "2025-01-26",
    changes: [
      "Added comprehensive photo annotation system with drawing tools",
      "Draw on photos with pencil tool, add text annotations, and highlight areas",
      "Eraser tool to remove unwanted annotations",
      "Select and move tool to reposition annotations",
      "Color picker with preset palette for customizable annotation colors",
      "Adjustable brush size (2-20px) for fine or bold annotations",
      "Auto-save functionality - annotations save automatically after 1 second of inactivity",
      "Undo/redo support with 50-state history on desktop, 25 on mobile for performance",
      "Export annotated photos as PNG combining original photo with annotations",
      "Annotation indicator badges on photo thumbnails showing which photos have annotations",
      "Mobile-optimized touch controls for smooth drawing experience",
      "Support for annotating both standard and panoramic photos",
      "Annotations persist with photos and can be edited later",
      "Database schema updated to store annotation data and metadata"
    ]
  },
  {
    version: "0.7.2",
    date: "2025-01-26",
    changes: [
      "Fixed photo gallery click handling on mobile - photos now open correctly when tapped",
      "Added stopPropagation to prevent event conflicts with parent modals",
      "Improved touch target handling for better mobile photo viewing experience"
    ]
  },
  {
    version: "0.7.1",
    date: "2025-01-26",
    changes: [
      "Added dedicated panoramic photo viewer with horizontal scrolling and pan/zoom support",
      "Panoramic photos now open in specialized full-screen viewer on mobile and desktop",
      "Implemented touch gestures for mobile (swipe to pan, drag to move when zoomed)",
      "Added zoom controls (1x to 3x) with pinch-to-zoom support on mobile devices",
      "Enhanced panoramic photo indicators in photo galleries",
      "Improved viewing experience with smooth scrolling and drag navigation",
      "Added visual pan indicators showing scrollable content in panoramic mode"
    ]
  },
  {
    version: "0.7.0",
    date: "2025-01-25",
    changes: [
      "Floor plan drawings now fully layered - each element is selectable and movable",
      "Added Delete/Backspace key support to remove selected drawing elements",
      "Improved select tool with visual feedback and controls for all drawn objects",
      "Drawing elements can now be repositioned after creation"
    ]
  },
  {
    version: "0.6.9",
    date: "2025-01-25",
    changes: [
      "Cable count field in drop point edit can now be cleared",
      "Empty cable count displays as 'Not specified' to indicate TBD"
    ]
  },
  {
    version: "0.6.8",
    date: "2025-01-25",
    changes: [
      "Fixed floor plan not displaying immediately after upload",
      "Added real-time event listener to sync floor plan state",
      "Floor plans now appear instantly without page refresh"
    ]
  },
  {
    version: "0.6.7",
    date: "2025-01-23",
    changes: [
      "Fixed drag-and-drop functionality for floor plan uploads",
      "Added full PDF upload support with automatic conversion to images",
      "Fixed floor plan persistence - uploaded maps now save to database",
      "Improved upload UI with visual drag feedback and progress indicators",
      "Enhanced error handling with specific messages for different failure scenarios",
      "Added conversion progress display for PDF files"
    ]
  },
  {
    version: "0.6.6",
    date: "2025-01-23",
    changes: [
      "Added Address Line 2 (Unit) field to location creation and editing forms",
      "Improved address input with dedicated unit/suite/apt field",
      "Enhanced address autocomplete to clear unit field when selecting new address"
    ]
  },
  {
    version: "0.6.5",
    date: "2025-01-23",
    changes: [
      "Fixed drop point cable count edit behavior - no longer resets to 1 when typing",
      "Added input validation to ensure minimum cable count of 1",
      "Improved edit form handling for numeric fields with proper state management"
    ]
  },
  {
    version: "0.6.4",
    date: "2025-01-23",
    changes: [
      "Fixed Drop Point tab white screen with comprehensive error handling and loading states",
      "Added ErrorBoundary component to catch and display React rendering errors gracefully",
      "Implemented skeleton loaders for better perceived performance during data fetch",
      "Added retry logic with exponential backoff (2 retries, 800ms delay) for failed requests",
      "Implemented 15-second timeout for drop point fetch operations to prevent hanging",
      "Added defensive null/undefined guards throughout drop point filtering and rendering",
      "Enhanced error state UI with 'Try Again' button and clear error messages",
      "Implemented telemetry events for debugging: droppoint_tab_open, fetch_start, fetch_success, fetch_error",
      "Added request timeout wrapper to fail fast instead of showing blank screen",
      "Improved empty state UI with helpful guidance for users",
      "Added data validation to ensure safe defaults for missing fields (label: 'TBD', cable_count: 0)",
      "Wrapped DropPointList in ErrorBoundary for production-grade error recovery",
      "Added test IDs for automated testing: tab-droppoints, skeleton-droppoints, error-droppoints, list-droppoints",
      "Memoized fetch operations to prevent unnecessary re-renders and improve performance",
    ],
  },
  {
    version: "0.6.3",
    date: "2025-01-23",
    changes: [
      "Simplified drop point labels - removed status text ('Planned', 'Installed', 'Tested'), now color-only indicators",
      "Added DropPointColorLegend component with compact status guide (Gray=Planned, Blue=Installed, Yellow=Tested, Green=Active, Red=Inactive)",
      "Enhanced draw mode with 500ms auto-save for instant real-time feedback (reduced from 2000ms)",
      "Implemented real-time collaborative editing with Supabase channel subscription for canvas_drawings table",
      "Restored upload functionality alongside draw mode - users can now upload base maps and draw annotations in same interface",
      "Added FloorPlanUploadDialog with file validation (PNG/JPG/SVG, max 10MB, 400x400 to 4000x4000px)",
      "Fixed save/sync persistence - both 'Save' and 'Use as Floor Plan' now persist changes atomically with instant UI refresh",
      "Implemented debounced save with 500ms delay to prevent double-submit and duplicate writes",
      "Added loading states and disabled buttons during save operations for better UX",
      "Enhanced error handling with inline error messages and optimistic UI with rollback on failure",
      "Implemented FLOORPLAN_SAVED and DROPS_UPDATED event emission for tracking and integration",
      "Added 'Floorplan updated' success toast notifications with consistent messaging",
      "Improved data refetch after save operations to ensure UI displays latest persisted state",
      "Enhanced 'Use as Floor Plan' to automatically refresh drop points and room views after conversion",
    ],
  },
  {
    version: "0.6.2",
    date: "2025-01-18",
    changes: [
      "Fixed room view photos not appearing on floor plan after save",
      "Replaced full page reload with smart async data refresh for seamless UX",
      "Added proper state synchronization between modal and parent component",
      "Floor plan now stays open after saving with immediate visual updates",
      "Enhanced floor plan save callback to explicitly refresh room views data",
      "Added 300ms delay before modal close to ensure parent component refresh completes",
      "Improved data consistency between AddRoomViewModal and InteractiveFloorPlan components",
    ],
  },
  {
    version: "0.6.1",
    date: "2025-01-17",
    changes: [
      "Added cable count badges directly on drop point markers for instant visibility without hovering",
      "Simplified tooltip text - removed verbose labels and redundant text for cleaner display",
      "Streamlined add drop point form - removed asterisks and 'optional' labels for faster data entry",
      "Cable counts now display as small numbered badges on markers when count > 1",
      "Improved UX for quick drop point creation with minimal required fields",
    ],
  },
  {
    version: "0.6.0",
    date: "2025-01-17",
    changes: [
      "Enhanced drop point visualization with color-coded status system for better scalability",
      "Removed auto-generated labels - labels are now truly optional for cleaner floor plan views",
      "Implemented industry-standard color coding: Gray (Planned), Blue (Roughed In), Orange (Terminated), Green (Tested)",
      "Added new 'Roughed In' and 'Terminated' status options to track installation workflow stages",
      "Simplified tooltips to show only essential information (label if present, room, type, cable count)",
      "Updated status filters in drop point list to include new workflow stages",
      "Improved map readability for locations with 50+ drop points through color-based status recognition",
    ],
  },
  {
    version: "0.5.9",
    date: "2025-01-17",
    changes: [
      "Streamlined Add Location dialog by removing floor plan upload section",
      "Removed 'Total Square Feet' and 'Status' fields from Basic Information section",
      "Simplified location creation workflow - floor plans can now be added from the All Locations tab",
      "Improved form performance by removing PDF conversion and file upload logic from Add Location modal",
      "Updated dialog description to guide users on where to manage floor plans",
    ],
  },
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
