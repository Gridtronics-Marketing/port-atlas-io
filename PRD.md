# Trade Atlas — Product Requirements Document (PRD)
**Version:** 2.0  
**Date:** 2026-02-18  
**Status:** Living Document  
**Published URL:** https://port-atlas-io.lovable.app  
**Project URL:** https://lovable.dev/projects/bfa70013-a03a-47bf-b8e2-fe95af6289c4

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Mission](#2-product-vision--mission)
3. [Target Users & Personas](#3-target-users--personas)
4. [Technology Stack](#4-technology-stack)
5. [Application Architecture](#5-application-architecture)
6. [Route Map](#6-route-map)
7. [Database Schema](#7-database-schema)
8. [Feature Modules](#8-feature-modules)
   - 8.1 Authentication & Multi-Tenancy
   - 8.2 Dashboard
   - 8.3 Locations & Sites
   - 8.4 Floor Plan System
   - 8.5 Drop Point Management
   - 8.6 Riser Diagram System
   - 8.7 Projects
   - 8.8 Work Orders
   - 8.9 Scheduling & Dispatch
   - 8.10 Field Operations
   - 8.11 Photo & 360° Capture
   - 8.12 Quality Assurance
   - 8.13 Clients & Client Portal
   - 8.14 Employees
   - 8.15 Procurement
   - 8.16 Contracts
   - 8.17 Maintenance
   - 8.18 Communications (OpenPhone / Twilio)
   - 8.19 TradeTube (Media Library)
   - 8.20 Integrations
   - 8.21 Reporting & Analytics
   - 8.22 Offline & PWA
   - 8.23 Settings & Configuration
   - 8.24 User Management & Roles
   - 8.25 Super Admin Platform
   - 8.26 Marketing & Public Pages
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Pricing Model](#10-pricing-model)
11. [Integrations Catalogue](#11-integrations-catalogue)
12. [Security & Compliance](#12-security--compliance)
13. [Known Issues & Backlog](#13-known-issues--backlog)

---

## 1. Executive Summary

Trade Atlas is a SaaS field operations management platform purpose-built for the trades industry — low voltage, telecom, IT/data, HVAC, electrical, plumbing, and general contracting. It provides an end-to-end workflow from site setup and floor plan documentation through field execution, client delivery, and invoicing.

The platform is a Progressive Web App (PWA) with native mobile support via Capacitor, meaning it works on any device, including fully offline in the field.

Key differentiators:
- Interactive floor plans with drop-point placement and cable-run drawing
- Guided 360° room-view photo capture using device orientation sensors
- Complete riser diagram system with backbone cable scheduling
- Dual-portal system: separate contractor and client-facing views
- Offline-first architecture that syncs when connectivity is restored

---

## 2. Product Vision & Mission

**Vision:** To be the operating system for field service contractors — the single source of truth from job creation to client delivery.

**Mission:** Eliminate paper-based and disconnected workflows by giving contractors industrial-grade digital tools accessible from any device, anywhere.

**Tagline:** "Built for Every Trade"

**Target URL:** https://runwithatlas.com

---

## 3. Target Users & Personas

### 3.1 Primary Personas

| Persona | Role | Primary Needs |
|---|---|---|
| Operations Manager | Admin/Owner | Dashboard overview, project tracking, reporting |
| Field Technician | Worker | Work orders, photo capture, offline access |
| Project Manager | Admin | Scheduling, work order assignment, client updates |
| Client | External Portal User | Job status, documentation, service requests |
| Super Admin | Platform Admin | Multi-org management, billing, support |

### 3.2 Trade Verticals Supported

- Low Voltage
- Telecom / Structured Cabling
- IT & Data / Network Infrastructure
- HVAC
- Plumbing
- Electrical
- General Contracting / Builders

---

## 4. Technology Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix UI primitives) |
| Routing | React Router DOM v6 |
| State/Server State | TanStack React Query v5 |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| Drawing/Annotation | Fabric.js v6 |
| Floor Plan Export | jsPDF |
| 360° Viewer | @photo-sphere-viewer/core + Gyroscope Plugin |
| Date Handling | date-fns |
| Local DB (offline) | Dexie (IndexedDB wrapper) |
| PDF Rendering | pdfjs-dist |
| Notifications | Sonner |
| SEO | react-helmet-async |

### Backend (Supabase)
| Layer | Technology |
|---|---|
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (floor-plans, photos, documents) |
| Edge Functions | Deno (Supabase Edge Functions) |
| Realtime | Supabase Realtime subscriptions |
| RLS | Row Level Security on all tables |

### Native/Mobile
| Layer | Technology |
|---|---|
| Mobile Bridge | Capacitor v7 |
| Camera | @capacitor/camera |
| Geolocation | @capacitor/geolocation |
| Motion/Compass | @capacitor/motion |
| Platforms | iOS, Android |

### Infrastructure
| Layer | Technology |
|---|---|
| Hosting | Lovable Cloud (preview + production) |
| CDN | Lovable CDN |
| PWA | vite-plugin-pwa (service worker, manifest) |
| Analytics | Custom analytics_events table + daily_stats aggregation |

---

## 5. Application Architecture

```
App
├── Public (Unauthenticated)
│   ├── PublicLayout (Header + Footer)
│   ├── LandingPage, FeaturesPage, PricingPage
│   ├── AboutPage, ContactPage, BlogPage
│   ├── HelpPage, APIPage, CareersPage
│   └── PrivacyPage, TermsPage, SecurityPage
│
├── Auth (/auth)
│
├── Onboarding (/onboarding/organization)
│
├── Protected App
│   ├── AppLayout (AppSidebar + Header)
│   ├── Dashboard (/dashboard)
│   ├── Locations (/locations)
│   ├── Projects (/projects)
│   ├── Work Orders (/work-orders)
│   ├── Clients (/clients)
│   ├── Employees (/employees)
│   ├── Scheduling (/scheduling)
│   ├── Field Operations (/field-operations)
│   ├── Quality Assurance (/quality-assurance)
│   ├── Contracts (/contracts)
│   ├── Maintenance (/maintenance)
│   ├── Procurement (/procurement)
│   ├── Service Requests (/service-requests)
│   ├── Communications (/communications)
│   ├── TradeTube (/tradetube)
│   ├── Integrations (/integrations)
│   ├── Settings (/settings)
│   ├── User Management (/user-management)
│   └── Profile (/profile)
│
├── Full-Screen Editors
│   └── Floor Plan Editor (/floor-plan-editor)
│
├── Client Portal
│   ├── Portal Entry (/p/:orgSlug)
│   ├── Client Location Detail (/client-locations/:locationId)
│   └── Service Request History (/service-request-history)
│
└── Super Admin
    ├── Platform Dashboard (/admin/platform)
    ├── Organizations (/admin/organizations)
    └── Client Portals (/admin/client-portals)
```

### Context Providers (Global State)
- `AuthProvider` — session, user object, super admin flag
- `OrganizationProvider` — current org, org switcher, role detection
- `OfflineSyncProvider` — offline queue, sync status

---

## 6. Route Map

| Route | Component | Access |
|---|---|---|
| `/` | LandingPage | Public |
| `/features` | FeaturesPage | Public |
| `/pricing` | PricingPage | Public |
| `/about` | AboutPage | Public |
| `/contact` | ContactPage | Public |
| `/blog` | BlogPage | Public |
| `/blog/:slug` | BlogPostPage | Public |
| `/help` | HelpPage | Public |
| `/api` | APIPage | Public |
| `/privacy` | PrivacyPage | Public |
| `/terms` | TermsPage | Public |
| `/security` | SecurityPage | Public |
| `/careers` | CareersPage | Public |
| `/get-started` | GetStartedPage | Public |
| `/auth` | Auth | Public |
| `/onboarding/organization` | OrganizationOnboarding | Protected |
| `/dashboard` | Index | Protected |
| `/projects` | Projects | Protected |
| `/locations` | Locations | Protected |
| `/clients` | Clients | Protected |
| `/employees` | Employees | Protected |
| `/work-orders` | WorkOrders | Protected |
| `/contracts` | Contracts | Protected |
| `/maintenance` | Maintenance | Protected |
| `/scheduling` | Scheduling | Protected |
| `/field-operations` | FieldOperations | Protected |
| `/quality-assurance` | QualityAssurance | Protected |
| `/procurement` | Procurement | Protected |
| `/service-requests` | ServiceRequests | Protected |
| `/service-request-history` | ServiceRequestHistory | Protected |
| `/communications` | Communications | Protected |
| `/tradetube` | TradeTube | Protected |
| `/integrations` | Integrations | Protected |
| `/settings` | Settings | Protected |
| `/user-management` | UserManagement | Protected |
| `/profile` | Profile | Protected |
| `/floor-plan-editor` | FloorPlanEditor | Protected (Full-screen) |
| `/client-locations/:locationId` | ClientLocationDetail | Protected |
| `/p/:orgSlug` | PortalEntry | Public (Client Portal) |
| `/admin/platform` | SuperAdminDashboard | Super Admin |
| `/admin/organizations` | AdminOrganizations | Super Admin |
| `/admin/client-portals` | ClientPortalManagement | Super Admin |

---

## 7. Database Schema

### Core Tables

| Table | Purpose |
|---|---|
| `organizations` | Multi-tenant root entity |
| `profiles` | User profiles linked to auth.users |
| `organization_members` | User ↔ org membership + role |
| `locations` | Job sites (stores floor_plan_files JSONB) |
| `projects` | Project records linked to locations |
| `work_orders` | Work order records |
| `clients` | Client companies |
| `employees` | Employee roster |
| `contracts` | Contract records |

### Floor Plan & Infrastructure Tables

| Table | Purpose |
|---|---|
| `drop_points` | Individual drop/outlet points on floor plans |
| `drop_point_photos` | Photos attached to drop points |
| `drop_point_test_results` | Test results for endpoints |
| `drop_point_types` | Configurable drop point categories |
| `backbone_cables` | Backbone cable runs between floors |
| `cable_segments` | Individual segments of multi-segment cables |
| `cable_connections` | Termination connection records |
| `distribution_frames` | MDF/IDF/patch panel equipment |
| `patch_connections` | Patch panel port connections |
| `junction_boxes` | Junction box records |
| `riser_pathways` | Conduit/pathway records |
| `wire_paths` | Wire routing paths |
| `room_views` | 360° room view records |
| `room_view_photos` | Photos belonging to a room view |
| `vlans` | VLAN records for network infrastructure |
| `network_devices` | Network device inventory |

### Operations Tables

| Table | Purpose |
|---|---|
| `scheduling_assignments` | Crew scheduling records |
| `employee_availability` | Employee availability windows |
| `maintenance_schedules` | Preventive maintenance records |
| `service_requests` | Client service request tickets |
| `purchase_orders` | Procurement POs |
| `inventory_items` | Inventory / parts catalog |
| `supplier_catalog` | Supplier product catalog |
| `suppliers` | Supplier records |
| `time_tracking` | Employee time entries |
| `quality_checklists` | QA inspection checklists |
| `safety_checklists` | Safety inspection checklists |
| `test_results` | Network/cable test result records |
| `documentation_files` | Uploaded documentation/files |
| `walk_through_notes` | Field walkthrough notes |
| `location_notes` | Notes attached to locations |

### Client Portal Tables

| Table | Purpose |
|---|---|
| `client_portal_users` | Client user accounts |
| `client_invitations` | Pending portal invitations |
| `client_service_locations` | Client's accessible locations |

### Platform Tables

| Table | Purpose |
|---|---|
| `analytics_events` | Raw analytics event log |
| `analytics_daily_stats` | Aggregated daily analytics |
| `audit_logs` | Change/action audit trail |
| `user_activity_log` | Detailed user activity |
| `admin_impersonation_log` | Super admin impersonation records |
| `notification_templates` | Email notification templates |
| `notifications` | In-app notification queue |
| `api_keys` | Organization API keys |
| `integration_credentials` | Encrypted third-party credentials |
| `workflow_configurations` | Configurable workflow rules |
| `dropdown_options` | Configurable dropdown values |
| `system_configurations` | Key/value system config store |
| `pricing_plans` | SaaS pricing plan definitions |
| `pricing_plan_features` | Features per pricing plan |
| `blog_posts` | CMS blog posts |
| `help_articles` | Help center articles |
| `faqs` | FAQ entries |
| `leads` | Marketing lead capture |
| `testimonials` | Public testimonials |
| `job_listings` | Careers page listings |
| `page_content` | CMS page content blocks |
| `tradetube_folders` | TradeTube media folders |
| `tradetube_content` | TradeTube media items |
| `chat_rooms` | Team chat room records |
| `communications` | Phone/email communication log |
| `change_log` | Entity change history |

---

## 8. Feature Modules

---

### 8.1 Authentication & Multi-Tenancy

**Implementation:** `AuthProvider.tsx`, `ProtectedRoute.tsx`, `OrganizationContext.tsx`

- Email/password authentication via Supabase Auth
- Session persistence across reloads
- Protected route wrapper redirects unauthenticated users to `/auth`
- Multi-tenant architecture: each user belongs to one or more organizations
- Organization switcher in sidebar (`OrganizationSwitcher.tsx`)
- Role-based access: `super_admin`, `admin`, `manager`, `technician`, `viewer`, `client`
- Super admin impersonation with full audit log
- Impersonation banner shown when viewing as another org/user

**Roles Matrix:**

| Role | Dashboard | Floor Plans | Work Orders | Clients | Settings | Admin |
|---|---|---|---|---|---|---|
| super_admin | Yes | Yes | Yes | Yes | Yes | Yes |
| admin | Yes | Yes | Yes | Yes | Yes | No |
| manager | Yes | Yes | Yes | Yes | No | No |
| technician | Yes | Read | Update | No | No | No |
| viewer | Yes | Read | Read | No | No | No |
| client | Portal only | Portal only | No | No | No | No |

---

### 8.2 Dashboard

**Route:** `/dashboard`  
**Component:** `pages/Index.tsx`

**Metrics displayed:**
- Active Sites count (locations with status = 'Active')
- Active Projects count
- Completion Rate (completed drop points / total drop points × 100)
- Pending Work Orders (pending + in progress counts)
- Overdue Work Orders alert banner

**Panels:**
- Active Work Orders panel (last 5, links to full list)
- Project Progress (progress bar + completed/active breakdown)
- Quick Actions (Sites, Team, Client Portal, Scheduling)

**Client Portal variant:** When `isClientPortalUser` is true, renders `ClientPortalDashboard` instead.

---

### 8.3 Locations & Sites

**Route:** `/locations`  
**Component:** `pages/Locations.tsx`, `LocationGrid.tsx`, `AddLocationModal.tsx`  
**Hook:** `useLocations.ts`

**Fields per location:**
- Name, address (with Google Maps autocomplete)
- Status: Active / Inactive / On Hold
- Client association
- Floor/building structure (`FloorBuildingManager.tsx`)
- Notes, tags

**Features:**
- Grid and list views
- Search and filter by status/client
- Google Maps integration for address validation
- Multi-floor building management
- Floor plan file attachment per floor
- Interactive map view (`LocationMap.tsx`, `MultiLocationMap.tsx`)
- Client-portal variant: shows only accessible locations

---

### 8.4 Floor Plan System

**Route:** `/floor-plan-editor` (full-screen)  
**Components:** `FloorPlanEditor.tsx`, `InteractiveFloorPlan.tsx`, `FloorPlanViewer.tsx`, `ManualDrawModeCanvas.tsx`, `ManualDrawModeToolbar.tsx`  
**Hook:** `useFloorPlanDrawing.ts`

#### 8.4.1 Upload Mode
- Accepts PDF, PNG, JPG, CAD files
- PDF first-page conversion to PNG via `pdfjs-dist`
- Scale calibration dialog (pixels-to-feet mapping)
- Filter dialog for showing/hiding drop point types, status, trades

#### 8.4.2 Draw Mode
- Fabric.js v6 canvas (3000×2000px, 20px grid)
- Blueprint dark theme (dark blue background)
- **Tools:** Select, Pan, Line, Rectangle, Polygon, Pencil, Text (with Room Name preset), Measurement (dashed yellow line + label), Eraser
- Color picker (8 blueprint presets)
- Line width slider
- Undo/Redo (up to 50 steps via history stack)
- Zoom (0.25×–5×, pinch-to-zoom on touch)
- Label prompt dialog for text tool
- Save: exports PNG at 2× resolution + saves Fabric JSON to `locations.floor_plan_files`

#### 8.4.3 Drop Point Placement
- Click/tap to place drop points on floor plan
- Drag to reposition
- Color-coded by status (not started, in progress, tested, finished)
- Type-specific icons and labels
- Capacity utilization overlay (shows cable/port usage)
- Filter by type, status, trade

#### 8.4.4 Persistence
- Images stored in Supabase `floor-plans` storage bucket
- Fabric.js JSON stored in `locations.floor_plan_files` JSONB column
- Scale metadata stored alongside drawing data

#### 8.4.5 Export
- Composite PNG export (floor plan + drop point overlay)
- PDF export with annotation layers (`FloorPlanExporter`, `jsPDF`)

---

### 8.5 Drop Point Management

**Components:** `DropPointList.tsx`, `DropPointDetailsModal.tsx`, `AddDropPointModal.tsx`, `DropPointTypeSpecificFields.tsx`  
**Hook:** `useDropPoints.ts`

**Drop Point Fields:**
- Label, type (configurable), status
- Floor and room location
- Client assignment
- Notes
- Test results (pass/fail, date, technician)
- Photos (multiple, with annotations)
- Custom type-specific fields (e.g., patch panel port for MDF/IDF)

**Drop Point Statuses:**
- Not Started → In Progress → Tested → Finished

**Type-Specific Fields (examples):**
- Data outlet: port count, patch panel, switch port
- MDF/IDF: frame label, port assignment
- Camera: camera type, FOV
- Access control: door, reader type

**Features:**
- CSV bulk import (`EnhancedCSVImportModal.tsx`)
- QR code generation per drop point (`QRCodeDisplay.tsx`)
- Test result upload and history
- Photo gallery with annotation viewer

---

### 8.6 Riser Diagram System

**Components:** `EnhancedInteractiveRiserDiagram.tsx`, `InteractiveRiserDiagram.tsx`, `RiserDiagramViewer.tsx`, `RiserDiagramLibrary.tsx`, `RiserDiagramPDFExporter.tsx`  
**Hooks:** `useBackboneCables.ts`, `useDistributionFrames.ts`, `useRiserPathways.ts`

**Entities:**
- Backbone Cables (multi-floor, fiber/copper, capacity tracking)
- Distribution Frames (MDF, IDF, patch panels per floor)
- Riser Pathways (conduit, sleeve, J-hook, cable tray)
- Junction Boxes

**Features:**
- Visual riser diagram with floor-by-floor layout
- Capacity utilization visualization (color-coded by % used)
- Multi-segment cable support (cable enters floor, splits)
- Cable label generation (TIA-606 compliant naming)
- Patch panel port management
- Cable connection records (termination details)
- PDF export: Riser Diagram, Cable Schedule, Equipment List, Complete Report
- Diagram library (saved diagram templates)

---

### 8.7 Projects

**Route:** `/projects`  
**Components:** `Projects.tsx`, `AddProjectModal.tsx`, `EditProjectModal.tsx`, `ProjectDashboard.tsx`  
**Hook:** `useProjects.ts`

**Fields:**
- Name, description, status
- Start/end dates
- Client association
- Location association
- Budget tracking
- Team members

**Statuses:** Planning, Active, On Hold, Completed, Cancelled

**Features:**
- Project dashboard with progress metrics
- Work order linkage
- Financial summary per project
- Crew assignment

---

### 8.8 Work Orders

**Route:** `/work-orders`  
**Components:** `WorkOrders.tsx`, `WorkOrderList.tsx`, `AddWorkOrderModal.tsx`, `WorkOrderDetailsModal.tsx`  
**Hook:** `useWorkOrders.ts`

**Fields:**
- Title, description, type
- Priority: Low, Medium, High, Urgent
- Status: Pending, In Progress, Completed, On Hold
- Assigned technician(s)
- Due date, estimated hours
- Location, project, client references
- Materials needed
- Completion notes
- Photos

**Features:**
- Overdue detection (due_date < now and not completed)
- Work order templates
- Convert service request → work order (`ConvertToWorkOrderModal.tsx`)
- Riser diagram integration (`RiserWorkOrderIntegration.tsx`)
- Dashboard alert for overdue orders
- Time tracking per work order

---

### 8.9 Scheduling & Dispatch

**Route:** `/scheduling`  
**Components:** `Scheduling.tsx`, `ScheduleCalendar.tsx`, `ScheduleAssignmentModal.tsx`, `CrewAssignmentModal.tsx`  
**Hook:** `useScheduling.ts`, `useEmployeeAvailability.ts`

**Features:**
- Visual calendar (day/week/month views)
- Employee availability management
- Drag-and-drop scheduling
- Crew assignment to work orders
- Conflict detection (double-booking alerts)
- Schedule view per employee

---

### 8.10 Field Operations

**Route:** `/field-operations`  
**Components:** `FieldOperations.tsx`, `TimeTrackingCard.tsx`, `SignatureCapture.tsx`, `WalkThroughNotesPanel.tsx`  
**Hook:** `useTimeTracking.ts`, `useWalkThroughNotes.ts`

**Features:**
- Time clock (clock in/out per work order)
- Walk-through note capture (text + photos)
- Digital signature capture (client sign-off)
- Offline data collection with sync queue
- Geolocation stamp on entries

---

### 8.11 Photo & 360° Capture

**Components:** `GuidedPanoramaCapture.tsx`, `PhotoAnnotationCanvas.tsx`, `PhotoAnnotationToolbar.tsx`, `PhotoAnnotationViewer.tsx`, `EnhancedPhotoGallery.tsx`, `SphericalPhotoViewer.tsx`, `MultiAnglePhotoViewer.tsx`, `PanoramicPhotoViewer.tsx`  
**Hooks:** `usePhotoCapture.ts`, `useDropPointPhotos.ts`, `useRoomViewPhotos.ts`, `useOfflinePhotoQueue.ts`

#### 8.11.1 Standard Photo Capture
- Uses `@capacitor/camera` on mobile (native camera)
- Web fallback: file input or webcam modal
- Image compression before upload (`image-compression.ts`)
- Upload to Supabase Storage
- Tagging to location, drop point, work order, room view, or employee

#### 8.11.2 Guided 360° Capture
- 8-angle capture sequence (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
- Compass mode: uses `@capacitor/motion` + `DeviceOrientationEvent` for real-time alignment
- Manual mode: grid of N/NE/E/SE/S/SW/W/NW buttons (activates automatically if orientation unavailable or after 5-second timeout)
- Progress indicator showing captured vs. remaining angles
- Overlay management: hides guided capture UI while web camera modal is active to prevent z-index conflicts
- Captured photos stored as a room view album

#### 8.11.3 Photo Annotation Engine (Fabric.js v6)
- Tools: Pencil (freehand), Text, Eraser, Distance measurement, Angle measurement, Area measurement
- Measurement labels auto-calculate using scale calibration data
- Canvas JSON persisted to `annotation_data` column
- "Save" action bakes annotations into a composite PNG
- Toolbar with color, brush size controls

#### 8.11.4 Viewers
- `MultiAnglePhotoViewer` — navigates between 8-angle albums
- `SphericalPhotoViewer` — @photo-sphere-viewer interactive 3D viewer with gyroscope plugin
- `PanoramicPhotoViewer` — wide/stitched photo viewer with zoom/pan
- `RoomViewModal` — modal viewer for room view albums

---

### 8.12 Quality Assurance

**Route:** `/quality-assurance`  
**Components:** `QualityAssurance.tsx`, `CreateQualityChecklistModal.tsx`, `CreateSafetyChecklistModal.tsx`, `SafetyChecklistModal.tsx`, `TestResultsManager.tsx`, `TestResultsUpload.tsx`  
**Hooks:** `useChecklistManagement.ts`, `useSafetyChecklists.ts`, `useTestResults.ts`

**Features:**
- Quality inspection checklists (create, assign, complete)
- Safety checklists (OSHA-aligned)
- Network cable test result upload and tracking
- Pass/fail status per drop point
- Test result history per endpoint
- Photo evidence attachment

---

### 8.13 Clients & Client Portal

**Routes:** `/clients`, `/p/:orgSlug`, `/client-locations/:locationId`  
**Components:** `Clients.tsx`, `ClientDetailsModal.tsx`, `ClientPortalSidebar.tsx`, `ClientPortalDashboard.tsx`, `CreateClientPortalModal.tsx`, `ClientPortalUserManager.tsx`, `BulkClientInviteModal.tsx`  
**Hooks:** `useClients.ts`, `useClientPortalData.ts`, `useClientInvitations.ts`

**Client Fields:**
- Company name, contact, email, phone
- Address
- Service plan
- Notes

**Client Portal Features:**
- Public entry URL: `/p/:orgSlug` (no auth required for portal entry)
- Client users have a separate login that routes to portal dashboard
- Accessible locations filtered by client assignment
- Read-only floor plan and drop point view
- Service request submission
- Documentation downloads
- Room view / photo gallery access
- Location notes (client-visible subset)
- White-label branding (organization logo + colors)
- Bulk email invite to multiple clients

---

### 8.14 Employees

**Route:** `/employees`  
**Components:** `Employees.tsx`, `AddEmployeeModal.tsx`, `EditEmployeeModal.tsx`, `EmployeeDetailsModal.tsx`, `EmployeeDetailsPanel.tsx`  
**Hooks:** `useEmployees.ts`, `useCurrentEmployee.ts`

**Fields:**
- Name, email, phone
- Role, trade specialization
- Certifications
- Availability windows
- Profile photo
- Emergency contact

**Features:**
- Employee roster with search/filter
- Availability calendar
- Work order assignment history
- Time tracking records
- Certification expiry tracking

---

### 8.15 Procurement

**Route:** `/procurement`  
**Components:** `Procurement.tsx`, `PurchaseOrderManager.tsx`, `CreatePurchaseOrderModal.tsx`, `ReceivePurchaseOrderModal.tsx`, `InventoryManager.tsx`, `SuppliersManager.tsx`, `SupplierCatalogManager.tsx`, `PriceComparisonModal.tsx`  
**Hooks:** `usePurchaseOrders.ts`, `useInventory.ts`, `useSuppliers.ts`, `useSupplierCatalog.ts`

**Features:**
- Purchase order creation and tracking
- PO line items with quantity and pricing
- Receive PO (partial or full receipt)
- Inventory management (stock levels, reorder points)
- Supplier directory
- Supplier product catalog with price comparison
- CSV import for catalog items

---

### 8.16 Contracts

**Route:** `/contracts`  
**Components:** `Contracts.tsx`, `AddContractModal.tsx`, `ContractDetailsModal.tsx`  
**Hook:** `useContracts.ts`

**Fields:**
- Contract number, name
- Client, value, start/end dates
- Status: Draft, Active, Expired, Cancelled
- Documents attached

---

### 8.17 Maintenance

**Route:** `/maintenance`  
**Components:** `Maintenance.tsx`, `AddMaintenanceModal.tsx`, `MaintenanceDetailsModal.tsx`  
**Hook:** `useMaintenanceScheduling.ts`

**Features:**
- Preventive maintenance schedules
- Recurring maintenance rules (daily, weekly, monthly, annual)
- Next-due date calculation
- Maintenance history log
- Work order generation from maintenance tasks

---

### 8.18 Communications (OpenPhone / Twilio)

**Routes:** `/communications`, `/twilio-settings`  
**Components:** `Communications.tsx`, `OpenPhoneManager.tsx`, `CallScreenPop.tsx`, `CustomerNotesPanel.tsx`, `TwilioSettings.tsx`  
**Hooks:** `useOpenPhone.ts`, `useCommunications.ts`, `useTwilioSettings.ts`  
**Edge Functions:** `openphone-webhook`, `send-twilio-notification`, `test-twilio-connection`

**Features:**
- OpenPhone integration: inbound/outbound call log
- Screen pop on incoming calls (show customer info)
- Customer notes panel linked to phone number
- Twilio SMS notification sending
- Notification templates for automated SMS
- Webhook receiver for real-time call events

---

### 8.19 TradeTube (Media Library)

**Route:** `/tradetube`  
**Components:** `TradeTube.tsx`, `TradeTubeContentGrid.tsx`, `TradeTubeFolderSidebar.tsx`, `TradeTubeUploadModal.tsx`, `TradeTubeMediaPlayer.tsx`, `TradeTubeSearchBar.tsx`  
**Hooks:** `useTradeTubeContent.ts`, `useTradeTubeFolders.ts`

**Features:**
- Organizational media/content library
- Folder hierarchy with custom icons
- Upload: video, images, PDFs, documents
- Media player (video/audio)
- Full-text search across content
- Tagging and categorization
- Shared with team or restricted to admin

---

### 8.20 Integrations

**Route:** `/integrations`  
**Components:** `Integrations.tsx`, `IntegrationsManager.tsx`, `WorkOrderIntegrationSettings.tsx`  
**Hooks:** `useIntegrations.ts`, `useIntegrationCredentials.ts`  
**Edge Function:** `manage-integration-credentials`

**Available Integrations:**
- OpenPhone (call management)
- Twilio (SMS notifications)
- Google Maps (address autocomplete, location maps)
- QuickBooks (accounting — planned)
- Google Workspace / Microsoft 365 (planned)
- Zapier (webhook automation — planned)
- Custom REST API (organization API keys)

**Integration Credential Storage:**
- Credentials encrypted at rest via Supabase Edge Function
- Per-organization credential isolation

---

### 8.21 Reporting & Analytics

**Components:** `ReportingDashboard.tsx`, `FinancialDashboard.tsx`, `EnhancedExportManager.tsx`, `StatsOverview.tsx`  
**Hooks:** `useReporting.ts`, `useFinancials.ts`, `useAnalyticsDashboard.ts`

**Reports Available:**
- Project completion rates
- Work order volume and status breakdown
- Drop point completion by location
- Employee productivity (hours, orders completed)
- Financial summary (revenue, costs by project)
- Maintenance compliance rate
- Client service request volume

**Export Formats:**
- PDF (via jsPDF)
- CSV (via PapaParse)
- Excel-compatible CSV

**Platform Analytics (Super Admin):**
- Daily active users
- Session counts (mobile vs. desktop vs. tablet)
- Page view tracking
- Traffic source analysis
- Bounce rate and session duration

---

### 8.22 Offline & PWA

**Components:** `OfflineStatusIndicator.tsx`, `OfflineDataManager.tsx`, `OfflineSettings.tsx`, `PWAInstallPrompt.tsx`, `PWAInstallButton.tsx`, `PWAUpdateNotification.tsx`, `IOSInstallInstructions.tsx`  
**Hooks:** `useOfflineSync.ts`, `useEnhancedOfflineSync.ts`, `useUnifiedOfflineSync.ts`, `useOfflinePhotoQueue.ts`  
**Context:** `OfflineSyncContext.tsx`

**Offline Capabilities:**
- Service worker caches app shell, assets, and recently viewed data
- IndexedDB (Dexie) stores:
  - Locations
  - Work orders
  - Drop points
  - Photos (queued for upload)
  - Walk-through notes
  - Backbone cables
- Offline mutations queued and replayed on reconnect
- Conflict resolution: last-write-wins with timestamp comparison
- Status indicator banner when offline

**PWA Features:**
- Install prompt (custom, bypasses browser default)
- iOS-specific install instructions (Add to Home Screen guidance)
- App manifest: icons (192px, 512px), screenshots (narrow, wide), theme color
- Background sync for photo uploads
- Update notification when new version deployed

---

### 8.23 Settings & Configuration

**Route:** `/settings`  
**Component:** `Settings.tsx`

**Tabs:**

| Tab | Contents |
|---|---|
| Core Configuration | Dropdown options manager, system config form |
| Business Management | Drop point types, workflow config, notification templates |
| Infrastructure | Riser diagram settings, network infrastructure settings, capacity management |
| Security & Operations | Granular permissions, compliance standards, audit trail |
| API Keys | Manage organization API keys |
| Email Branding | (Super Admin only) Email template branding |
| About | Version info |

**Configurable Dropdown Categories:**
- Work order types, priorities, statuses
- Project statuses
- Employee roles and trades
- Drop point types and statuses
- Supplier categories
- Any field using `useConfigurableDropdown` hook

---

### 8.24 User Management & Roles

**Route:** `/user-management`  
**Components:** `UserManagement.tsx`, `AddUserModal.tsx`, `RoleManagementModal.tsx`, `ManualRoleAssignmentModal.tsx`, `BulkRoleAssignmentModal.tsx`, `GranularPermissionsManager.tsx`, `PendingInvitationsManager.tsx`  
**Hooks:** `useUsers.ts`, `useUserRoles.ts`, `useProfiles.ts`  
**Edge Functions:** `create-user`, `send-user-invitation-email`

**Features:**
- Invite users by email (sends invitation email)
- Assign organization roles
- Bulk role assignment
- Granular permissions (beyond role-level)
- Pending invitation management (resend / cancel)
- View as another role (testing access levels)

---

### 8.25 Super Admin Platform

**Routes:** `/admin/platform`, `/admin/organizations`, `/admin/client-portals`  
**Components:** `SuperAdminDashboard.tsx`, `AdminOrganizations.tsx`, `ClientPortalManagement.tsx`  
**Admin Panels:** `AnalyticsDashboard.tsx`, `LeadManagementPanel.tsx`, `BlogManagementPanel.tsx`, `HelpArticlesManagementPanel.tsx`, `PricingManagementPanel.tsx`, `PlatformSettingsPanel.tsx`, `ContentManagementPanel.tsx`, `CareersManagementPanel.tsx`, `PageContentManagementPanel.tsx`

**Features:**
- Platform-wide analytics dashboard
- Organization management (create, suspend, delete orgs)
- Impersonate any user or org
- Client portal oversight
- Lead management (from contact/get-started forms)
- Blog CMS (create, publish, manage posts)
- Help article CMS
- Pricing plan management (create/edit plans + features)
- Job listings management
- Page content CMS (landing page sections)
- Orphaned organization cleanup tool

---

### 8.26 Marketing & Public Pages

**Components:** `HeroSection.tsx`, `FeatureCard.tsx`, `PricingCard.tsx`, `TestimonialCarousel.tsx`, `FAQAccordion.tsx`, `ContactForm.tsx`, `OnboardingWizard.tsx`, `PublicHeader.tsx`, `PublicFooter.tsx`

**Pages:**
- Landing Page: hero, features, how-it-works, testimonials, pricing preview, CTA
- Features Page: tabbed feature categories (Field, Project, Client, Integrations)
- Pricing Page: billing toggle (monthly/annual), plan cards, comparison table, FAQ
- About Page: company story, team
- Contact Page: contact form (submits to `leads` table via edge function)
- Get Started Page: onboarding wizard with plan selection
- Blog Page: CMS-driven blog listing and posts
- Help Page: help article browser
- Careers Page: CMS-driven job listings
- API Page: API documentation
- Privacy, Terms, Security: legal/compliance pages

**SEO:**
- `react-helmet-async` for per-page title/meta tags
- `robots.txt`, sitemap-ready canonical URLs
- Schema.org structured data on Pricing page (FAQPage)

---

## 9. Non-Functional Requirements

### Performance
- Initial page load < 3s on 4G
- Offline mode activates instantly on connectivity loss
- Photo compression before upload (target < 500KB per image)
- Fabric.js canvas renders at 60fps on mid-range mobile

### Reliability
- 99.9% uptime SLA (Enterprise tier)
- Offline queue preserves all mutations during connectivity loss
- Auto-retry on sync failure (exponential backoff)

### Scalability
- Multi-tenant architecture: each org is fully isolated via RLS
- Unlimited locations on Business+ plans
- Storage scales with Supabase Storage quotas

### Accessibility
- WCAG 2.1 AA target
- Keyboard-navigable UI (shadcn/ui Radix primitives)
- Color contrast ratios meet AA standards

### Browser/Device Support
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- iOS 15+ (PWA + Capacitor)
- Android 8+ (PWA + Capacitor)
- Desktop: 1280px+ primary, responsive down to 320px

---

## 10. Pricing Model

**Billing:** Monthly or Annual (20% discount on annual)  
**Trial:** 14-day free trial, no credit card required

| Plan | Target | Key Limits |
|---|---|---|
| Starter | Solo contractors | Limited locations, basic features |
| Professional | Small teams | Client portal, scheduling, reporting, API |
| Business | Growing companies | Unlimited locations, advanced analytics, custom integrations, phone support |
| Enterprise | Large operations | White label, custom development, SLA, 24/7 support |

**Feature Gate Examples:**
- Client Portal: Professional+
- Unlimited Locations: Business+
- White Label: Enterprise only
- Custom Development: Enterprise only
- 24/7 Support: Enterprise only

---

## 11. Integrations Catalogue

| Integration | Status | Purpose |
|---|---|---|
| Google Maps API | Active | Address autocomplete, site mapping |
| OpenPhone | Active | Call management, screen pop |
| Twilio | Active | SMS notifications |
| Supabase Auth | Active | Authentication backbone |
| Supabase Storage | Active | File/photo storage |
| @capacitor/camera | Active | Native mobile camera |
| @capacitor/motion | Active | Device compass for 360° capture |
| @capacitor/geolocation | Active | GPS stamping |
| @photo-sphere-viewer | Active | 360° spherical photo viewing |
| Fabric.js | Active | Drawing + annotation engine |
| jsPDF | Active | PDF generation and export |
| PapaParse | Active | CSV import/export |
| QuickBooks | Planned | Accounting sync |
| Google Workspace | Planned | Calendar, Drive |
| Microsoft 365 | Planned | Calendar, OneDrive |
| Zapier | Planned | Workflow automation |

---

## 12. Security & Compliance

- **Authentication:** Supabase Auth with JWT tokens, secure HTTP-only cookies
- **Authorization:** Row Level Security (RLS) enforced on every database table
- **Role Isolation:** Organization members can only access their own org's data
- **API Keys:** Hashed and stored securely; shown only on creation
- **Integration Credentials:** Encrypted at rest via Edge Function, never exposed to frontend
- **Audit Trail:** All significant actions logged to `audit_logs` and `user_activity_log`
- **Impersonation Logging:** Every super admin impersonation action is recorded with IP and user agent
- **Photo Storage:** Supabase Storage with signed URLs; direct public access disabled on sensitive buckets
- **TIA-606 Compliance:** Riser diagram labeling and cable scheduling follows TIA-606 standards
- **OSHA Alignment:** Safety checklists structured around OSHA inspection categories
- **GDPR Consideration:** User data deletion supported; audit logs retained per retention policy

---

## 13. Known Issues & Backlog

### Active Issues (FIXED in v2.0)

#### Guided 360° Capture
- **Issue:** Infinite re-render loop in `useDeviceOrientation.ts` caused by dependency cycle between `requestPermission`, `permissionGranted`, and `startTracking`.
- **Fix Applied:** Converted internal state reads to `useRef` to stabilize callback references; broke the dependency cycle.
- **Issue:** Dual fullscreen overlay z-index conflict between `GuidedPanoramaCapture` and web camera modal.
- **Fix Applied:** `overlayHidden` state hides guided capture UI during camera modal activation.
- **Issue:** No fallback for devices without orientation sensors.
- **Fix Applied:** 5-second timeout activates manual mode with N/NE/E/SE/S/SW/W/NW grid buttons.

#### Floor Plan Filter Dialog Scrolling
- **Issue:** Filter dialog content exceeded viewport height after Trades section added.
- **Fix Applied:** Added `max-h-[60vh] overflow-y-auto` to content wrapper in `FloorPlanFilterDialog.tsx`.

### Backlog Items

- Photo stitching: combine 8-angle captures into a single equirectangular image for SphericalPhotoViewer
- Annotation tools inside SphericalPhotoViewer (markup without leaving 360° view)
- Snap-to-grid for floor plan draw mode
- Keyboard shortcuts for draw mode tools
- QuickBooks integration implementation
- Push notifications (Capacitor push plugin)
- Advanced route optimization for field scheduling
- AI-assisted cable label generation
- Export floor plan annotations to CAD format
- Multi-language / i18n support
