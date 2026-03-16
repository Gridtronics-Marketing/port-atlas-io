

# Fix: Select Dropdown Closing Immediately on Mobile

## Problem
On mobile/touch devices, tapping the status filter Select opens the dropdown momentarily, then it closes. This is a known Radix Select issue where the `pointerup` event from the tap fires on the newly-opened content/overlay, immediately closing it.

## Root Cause
Radix Select's pointer event handling conflicts with touch interactions. When a user taps the trigger on mobile:
1. `pointerdown` → opens the Select
2. `pointerup` → fires on the overlay/content → closes the Select

The `overflow-y-auto` on the `<main>` container may also contribute by causing scroll-related repositioning.

## Fix

**`src/components/ui/select.tsx`** — Add touch-safe event handling to `SelectContent`:

```tsx
<SelectPrimitive.Content
  ref={ref}
  onPointerDownOutside={(e) => {
    // On touch devices, prevent the pointerup from immediately closing
    const target = e.target as HTMLElement;
    if (target?.closest('[data-radix-select-trigger]')) {
      e.preventDefault();
    }
  }}
  ...
```

However, the more reliable and simpler fix is to **replace `position="popper"` default with `position="item-aligned"`** which uses Radix's native mobile-friendly positioning, or to add a small `onOpenChange` guard.

**Recommended approach** — In `SelectContent`, wrap the content with a touch guard using CSS `touch-action: none` on the overlay:

```tsx
// In SelectContent, add to the className:
"touch-action-none"
```

And add `onCloseAutoFocus={(e) => e.preventDefault()}` to prevent focus-stealing that triggers re-renders.

## Scope
- Single file: `src/components/ui/select.tsx`

