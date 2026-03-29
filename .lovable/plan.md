

# Fix: Floor Plan Image Not Rendering in Full-Screen Editor

## Root Cause
Two issues prevent the floor plan from displaying:

1. **File extension detection fails on signed URLs**: When the image URL is resolved from the database (no `filePath`/`fileName` props), the `getFileExtension` function parses the signed URL. The URL looks like `...floor_1.png?token=eyJ...`. Calling `.split('.').pop()` returns `"png?token=eyJ..."`, which does NOT match `'png'` in the `isImage` array. So `isImage` is `false` and the component renders "No Floor Plan Uploaded" instead of the `<img>` tag.

2. **Potential signed URL failure**: If `getSignedStorageUrl` returns `''` (empty string on error), the `if (url)` check correctly skips it, but the image never loads.

## Fix

### `src/components/InteractiveFloorPlan.tsx`

**Change the `getFileExtension` function** (~line 166) to strip query parameters before extracting the extension:

```typescript
const getFileExtension = (url?: string, path?: string, name?: string) => {
  if (!url && !path && !name) return '';
  const source = name || path || url || '';
  // Strip query string and hash before extracting extension
  const cleanSource = source.split('?')[0].split('#')[0];
  return cleanSource.split('.').pop()?.toLowerCase() || '';
};
```

This single-line addition (`split('?')[0].split('#')[0]`) ensures that `floor_1.png?token=xxx` correctly yields `png`.

## File Summary
- **Modified**: `src/components/InteractiveFloorPlan.tsx` (1 function, ~1 line change)
