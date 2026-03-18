

# Update Version, Changelog, and Refresh /docs Page

## 1. Version Bump (src/lib/version.ts)

Update `APP_VERSION` from `"1.10.8"` to `"1.10.9"` and add a new entry at the top of `VERSION_HISTORY`:

```
version: "1.10.9"
date: "2026-03-18"
changes:
  - Synced client portal floor plan legend with admin view using shared DropPointColorLegend component
  - Updated room view marker color from orange to blue for consistency across admin and client views
  - Moved Delete Location button into Edit Location modal to prevent accidental deletion
  - Fixed "Failed to update location" error by stripping virtual fields from update payload
  - Fixed back arrow button overlapping icons on annotation screens
  - Fixed undo/redo corrupting annotation history in photo annotation canvas
  - Added annotation_data and annotation_metadata columns to room_view_photos table
  - Fixed Room View annotation save button by stripping virtual fields from update payload
```

## 2. Refresh /docs Page to Match Grocery OS Style

Replace the current 1529-line DocsPage with a cleaner implementation modeled after the Grocery OS project. The PRD content string stays the same; only the renderer and layout change.

### What changes:
- **Simpler MarkdownRenderer**: Replace the complex block-based parser with the Grocery OS inline renderer pattern (handles H1-H3, tables, bullet lists, code, bold, horizontal rules, status badges)
- **Icon-based TOC sidebar**: Replace the auto-generated TOC with a curated sections list using Lucide icons (like the Grocery OS `sections` array), mapped via `HEADING_ID_MAP`
- **Cleaner header**: Sticky top bar with BookOpen icon, "Trade Atlas" title, version badge, status badge, and Download PRD button -- matching the Grocery OS header style
- **Two-column layout**: `max-w-6xl` container with `aside` (hidden on mobile) + `main` in a card with border and shadow
- **Access control**: Keep the existing `isSuperAdmin` check via OrganizationContext
- **Remove**: IntersectionObserver active-state tracking, mobile TOC drawer, breadcrumb navigation back to platform admin -- simplifying the component significantly

### File: `src/pages/DocsPage.tsx`
- Full rewrite using the Grocery OS DocsPage as the template
- Preserves the existing `PRD_CONTENT` string verbatim
- Updates download filename to `"trade-atlas-prd.md"`
- Adapts `sections` array to match Trade Atlas PRD headings (Executive Summary, Product Vision, Target Users, Technology Stack, Architecture, Route Map, Database Schema, Feature Modules, Non-Functional Requirements, Pricing, Integrations, Security, Known Issues)

