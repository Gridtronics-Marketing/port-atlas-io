
# Add /docs Route — PRD Viewer with Download Button

## Overview

Create a new protected `/docs` page that renders `PRD.md` as a beautifully styled documentation page inside the `AppLayout`, and add a link to it from the Super Admin Dashboard's sidebar nav. The page will include a prominent **Download as .md** button in the header.

## Architecture Decisions

- **No markdown parser library needed**: The PRD content will be embedded directly as a TypeScript string constant. The page will use a custom lightweight Markdown-to-JSX renderer built with plain React — no new npm packages required. This avoids dependency bloat and keeps the bundle small.
- **Download mechanism**: Uses the browser's native `Blob` + `URL.createObjectURL` API with an anchor click — no server calls needed.
- **Access control**: The route is wrapped in `ProtectedRoute` like all other admin routes. An additional `isSuperAdmin` check inside the page redirects non-super-admins (matching the pattern in `SuperAdminDashboard.tsx`).
- **Sidebar link**: Added to `AppSidebar.tsx` inside the existing `adminGroup` items (only visible to `isSuperAdmin` users, alongside Organizations and Client Portals).
- **Styling**: Since `@tailwindcss/typography` is not installed, the Markdown renderer will apply explicit Tailwind classes to each element type (h1, h2, h3, p, table, code, blockquote, hr, ul, ol, li) — matching the Trade Atlas design system (gold primary, steel grays).

## Files to Create / Modify

### 1. `src/pages/DocsPage.tsx` — NEW FILE

A single-file page that:
- Imports the raw PRD content as a TypeScript string (hard-coded from the PRD.md file)
- Renders a sticky top bar with:
  - Back arrow + "Platform Admin" breadcrumb
  - `Download PRD.md` button (Download icon + filename)
- Renders a two-column layout:
  - **Left sidebar** (fixed, `w-64`): sticky table of contents with anchor links for each `##` heading, auto-highlighted on scroll using `IntersectionObserver`
  - **Right main area**: rendered Markdown content
- The Markdown renderer handles:
  - `# H1` → large gold-accented title
  - `## H2` → section headings with a gold left-border accent + anchor ID
  - `### H3` → sub-section headings
  - ` ``` code blocks ``` ` → dark monospace card
  - `| table |` rows → styled `<table>` with alternating row colors
  - `- bullet lists` → styled `<ul>`
  - `**bold**` inline → `<strong>`
  - `> blockquote` → gold left-border card
  - `---` horizontal rules → styled `<hr>`
  - Paragraphs → readable `text-sm leading-relaxed`

**Download button logic:**
```typescript
const handleDownload = () => {
  const blob = new Blob([PRD_CONTENT], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trade-atlas-prd.md';
  a.click();
  URL.revokeObjectURL(url);
};
```

### 2. `src/App.tsx` — ADD ROUTE

Add the `/docs` route inside the protected Super Admin section (alongside `/admin/platform`):

```tsx
<Route path="/docs" element={
  <ProtectedRoute>
    <AppLayout>
      <DocsPage />
    </AppLayout>
  </ProtectedRoute>
} />
```

### 3. `src/components/AppSidebar.tsx` — ADD SIDEBAR LINK

In the `adminGroup` items array, add the Docs entry for super admins:

```typescript
...(isSuperAdmin ? [
  { title: "Organizations", url: "/admin/organizations", icon: Building2 },
  { title: "Client Portals", url: "/admin/client-portals", icon: Database },
  { title: "PRD & Docs", url: "/docs", icon: BookOpen },   // ← ADD
] : [])
```

Import `BookOpen` from `lucide-react` (already available in the project).

### 4. `src/pages/SuperAdminDashboard.tsx` — ADD SHORTCUT CARD

In the Overview tab metrics grid, add a "PRD & Docs" card with a link to `/docs` so super admins can reach it from the dashboard directly without hunting in the sidebar.

## Layout Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│  ← Platform Admin   /docs               [↓ Download PRD.md] │  ← Sticky header bar
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│  Table of     │  # Trade Atlas — PRD                        │
│  Contents     │  Version: 2.0 · Date: 2026-02-18            │
│  ─────────    │  ─────────────────────────────              │
│  1. Exec Sum  │  ## 1. Executive Summary                    │
│  2. Vision    │  Trade Atlas is a SaaS field operations...  │
│  3. Personas  │                                             │
│  4. Stack     │  ## 2. Product Vision & Mission             │
│  ...          │  ...                                        │
│               │                                             │
│  (sticky,     │  ## 7. Database Schema                      │
│   scrolls     │  | Table | Purpose |                        │
│   with you)   │  |-------|---------|                        │
│               │  | orgs  | Root... |                        │
└───────────────┴─────────────────────────────────────────────┘
```

## Technical Details

### Markdown Parser Strategy

Rather than a full markdown library, the renderer will use a line-by-line parser:

1. Split PRD content by `\n`
2. Process multi-line blocks (code fences, tables) by grouping consecutive lines
3. Apply element-specific Tailwind classes inline
4. For inline formatting (`**bold**`, `` `code` ``), apply a simple regex replace

This keeps zero new dependencies while producing a clean render for this specific document.

### Table of Contents (TOC)

- Extract all `## Section` lines at parse time
- Generate anchor IDs by slugifying the heading text (lowercase, spaces → hyphens)
- Render as a sticky sidebar nav with `scroll-behavior: smooth`
- Use `IntersectionObserver` to highlight the currently-visible section

### Responsive Behavior

- **Desktop (lg+)**: two-column layout with TOC sidebar
- **Mobile/Tablet**: TOC hidden, full-width content with a collapsible "Jump to section" dropdown at the top

### Super Admin Guard

```typescript
const { isSuperAdmin, loadingOrganizations } = useOrganization();
if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;
```

This matches the exact pattern used in `SuperAdminDashboard.tsx`.
