

# Fix Satellite View: Autocomplete Suggestions Not Showing

## Problem

The Google Places Autocomplete dropdown (`pac-container`) renders as a child of `document.body`, but the Radix Dialog has a very high z-index (z-50). The autocomplete suggestions appear *behind* the dialog and are invisible. Additionally, there may be a timing issue where the autocomplete initializes before the input element is fully mounted in the DOM (since it's inside a tab that may not render its content immediately).

## Changes

### `src/components/FloorPlanUploadDialog.tsx`

**1. Add CSS to raise the `pac-container` z-index**

Add a `useEffect` that injects a `<style>` tag (or use the existing `index.css`) to set:
```css
.pac-container { z-index: 99999 !important; }
```

This ensures Google's autocomplete dropdown renders above the Radix Dialog overlay.

**2. Fix autocomplete initialization timing**

The current code checks `if (autocompleteRef.current) return;` to avoid re-init, but after `cleanupMap` sets it to `null`, re-opening the dialog or switching tabs should re-initialize. The issue is the effect runs before the TabsContent has mounted the input. Fix by adding a small delay or using a callback ref pattern:

- Use a `useEffect` with a short `setTimeout(0)` to ensure the DOM input is rendered before attaching `Autocomplete`
- Or switch to a ref callback on the input element that triggers initialization when the element mounts

The simpler approach: add the style fix globally in `src/index.css` and adjust the autocomplete effect to re-initialize properly when the tab becomes active by removing the early-return guard and instead cleaning up/recreating.

### `src/index.css`

Add one CSS rule:
```css
.pac-container {
  z-index: 99999 !important;
}
```

### Summary of fixes:
1. **CSS z-index** -- `.pac-container` z-index raised above Dialog overlay so suggestions are visible
2. **Init timing** -- Ensure the Autocomplete attaches after the input is actually in the DOM by deferring initialization with a microtask or using a ref callback
3. **Cleanup on close** -- Properly destroy and re-create autocomplete when the dialog reopens to avoid stale references

