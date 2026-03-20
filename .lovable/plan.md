

# Fix: Grey Box on Room View Photo Upload Preview

## Root Cause

When a photo is captured/uploaded, `usePhotoCapture` uploads it to the `room-views` bucket and returns a **relative storage path** (e.g., `photos/room_view-2026-03-20.jpg`). The `AddRoomViewModal` sets this as `capturedPhoto` state and renders it with a plain `<img src={capturedPhoto}>` at line 352. The browser cannot resolve a relative storage path, so it shows a grey/broken box.

The same issue affects the `selectFromGallery` flow on web — it also returns a relative path.

## Fix

Replace the plain `<img>` preview in `AddRoomViewModal.tsx` with the `SignedImage` component, which resolves relative paths into temporary signed URLs. The bucket is `room-views` (matching what `usePhotoCapture` uses for `room_view` category).

### File: `src/components/AddRoomViewModal.tsx`

**Change 1** — Add `SignedImage` import (line 1 area):
```tsx
import { SignedImage } from '@/components/ui/signed-image';
```

**Change 2** — Replace the plain `<img>` at line 352-356 with:
```tsx
<SignedImage
  bucket="room-views"
  path={capturedPhoto}
  alt="Captured room view"
  className="w-full h-48 object-cover rounded-lg border"
/>
```

This single change fixes both the camera capture and gallery upload preview flows, since both return relative paths to the `room-views` bucket.

### Why this works
- `SignedImage` internally uses `useSignedUrl` to create a temporary signed URL from the bucket + relative path
- If the path happens to be a full HTTP URL (legacy/backward compat), it passes through unchanged
- The component shows a skeleton loader while the signed URL resolves

