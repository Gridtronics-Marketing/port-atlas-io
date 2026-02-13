
# Fix Floor Plan Filter Dialog Scrolling

## Problem

The Filter dialog content grew significantly after adding the Trades section (23 trades across 5 categories). The dialog body has no scroll container, so on smaller screens the bottom of the dialog is cut off and unreachable.

## Fix

### File: `src/components/FloorPlanFilterDialog.tsx`

Add `max-height` and `overflow-y-auto` to the content wrapper div (line 129) so the filter options scroll within the dialog while the header stays fixed.

**Change**: Update the content div from:
```
<div className="space-y-6 py-4">
```
to:
```
<div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
```

This constrains the scrollable area to 60% of the viewport height and adds a small right padding so scrollbar doesn't overlap content. The dialog header ("Floor Plan Filters") remains fixed above the scroll area.

No other files need changes.
