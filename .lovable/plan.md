

# Fix: Cannot Select Google Places Autocomplete Suggestions

## Problem

The Google Places Autocomplete dropdown (`.pac-container`) renders as a direct child of `document.body`, outside the Radix Dialog. Even though the z-index fix makes it visible, Radix Dialog's **focus trap** and the **overlay's `pointer-events`** intercept mouse/touch events on the suggestion list, preventing selection.

## Solution

Two CSS additions in `src/index.css`:

1. **Disable pointer-events on the dialog overlay** so clicks can pass through to the `.pac-container`:
   ```css
   .pac-container {
     z-index: 99999 !important;
     pointer-events: auto !important;
   }
   ```

2. **Prevent Radix's focus-trap from stealing focus** when the user clicks on a `.pac-item`. Add an event listener in `FloorPlanUploadDialog.tsx` that stops the dialog from reclaiming focus when interacting with the autocomplete dropdown.

### Specific Changes

**`src/index.css`** -- Enhance the existing `.pac-container` rule:
```css
.pac-container {
  z-index: 99999 !important;
  pointer-events: auto !important;
}
```

**`src/components/FloorPlanUploadDialog.tsx`** -- Two changes:

1. Add `onPointerDownOutside` and `onInteractOutside` handlers to `DialogContent` to prevent it from closing or stealing focus when the user clicks on the `.pac-container`:
   ```tsx
   <DialogContent
     className="max-w-2xl"
     onPointerDownOutside={(e) => {
       const target = e.target as HTMLElement;
       if (target.closest('.pac-container')) {
         e.preventDefault();
       }
     }}
     onInteractOutside={(e) => {
       const target = e.target as HTMLElement;
       if (target.closest('.pac-container')) {
         e.preventDefault();
       }
     }}
   >
   ```

2. These two event handlers tell Radix: "if the user clicked on a Google autocomplete suggestion, do NOT close the dialog and do NOT steal focus." This allows the `place_changed` event to fire normally.

### What stays unchanged
- All autocomplete initialization logic (already correct with deferred timing)
- Map initialization and capture logic
- File upload tab
- Everything else in the dialog

