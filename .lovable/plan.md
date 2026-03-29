

# Mobile-Responsive Client Details Modal

## Problem
The Client Details modal is unusable on mobile — the header buttons overflow, the two-column layout doesn't stack properly, tables are too wide, and the full-screen dialog sizing has issues on small screens.

## Changes

### 1. `src/components/ClientDetailsModal.tsx`

**Header bar (line ~206):**
- Stack the header vertically on mobile: title/badge on top, action buttons below
- Collapse Edit/Email/More buttons into a compact row with smaller sizing on mobile
- Use `flex-col sm:flex-row` for the header wrapper

**Two-column layout (line ~272):**
- Already uses `grid-cols-1 lg:grid-cols-5` — this is fine, but reorder so the sidebar cards appear **after** main content on mobile (they currently do since sidebar is `lg:col-span-2` second in DOM — correct)

**Properties table (line ~342):**
- On mobile, replace the 5-column table with a card-based list layout
- Each property becomes a tappable card showing name, address, status, and drop count
- Use `hidden sm:table` for the table and `sm:hidden` for the card list

**Contacts table (line ~408):**
- Same pattern — hide table on mobile, show stacked contact cards instead
- Each card: name (bold), role badge, phone + email as tappable links

**Overview grid (line ~457):**
- Already `grid-cols-2 sm:grid-cols-4` — fine as-is

**Dialog sizing (line ~199):**
- On mobile: make it truly full-screen with no border-radius
- Update class: `w-full h-full max-w-none max-h-none sm:w-[95vw] sm:h-[95vh] sm:max-w-[95vw] sm:max-h-[95vh] overflow-y-auto rounded-none sm:rounded-xl p-4 sm:p-6`

### 2. `src/components/LocationDetailsModal.tsx`

**Dialog sizing (line ~286):**
- Make full-screen on mobile: `w-full h-full max-w-none max-h-none sm:max-w-[900px] sm:max-h-[90vh] lg:max-w-[95vw] lg:w-[95vw] lg:h-[90vh] rounded-none sm:rounded-xl p-4 sm:p-6`

**Header buttons (line ~303):**
- Stack "Edit Location" and "Add Drop Point" below the title on mobile
- `flex-col sm:flex-row` with full-width buttons on small screens

**Tabs bar (line ~378):**
- Replace the fixed 8-column grid with a horizontally scrollable `overflow-x-auto` wrapper
- Use `w-auto inline-flex` instead of `grid grid-cols-8` so tabs scroll naturally
- Hide icon labels on mobile — show only icons with tooltips, or abbreviate text

**Stats grid (line ~324):**
- Already `grid-cols-2 md:grid-cols-4` — good as-is

## File Summary
- **Modified**: `ClientDetailsModal.tsx`, `LocationDetailsModal.tsx`

