

# Fix Broken Photos Across All Components

## Problem
After migrating storage URLs to relative paths and making buckets private, several components still render `<img src={photo.photo_url}>` directly instead of using `SignedImage` or `useSignedUrl`. The relative paths don't resolve without a signed URL.

## Affected Components (6 files)

### 1. `src/components/RoomViewModal.tsx` (line 355)
- **Original Photo** section uses `<img src={roomView?.photo_url}>` directly
- Replace with `<SignedImage bucket="room-views" path={roomView?.photo_url}>`

### 2. `src/components/ClientFloorPlanViewer.tsx` (lines 345-349, 379-383, 406-407)
- Room view detail image: `<img src={roomView.photo_url}>` → `<SignedImage>`
- Room photos grid: `<img src={photo.photo_url}>` → `<SignedImage>`
- Lightbox: `<img src={lightboxUrl}>` → Change `lightboxUrl` state to store bucket+path, resolve with `useSignedUrl`, or use `SignedImage`
- The `onClick={() => setLightboxUrl(roomView.photo_url!)}` pattern needs rework — store the path and resolve in the lightbox

### 3. `src/components/EnhancedPhotoGallery.tsx` (lines 328, 359)
- `PhotoAnnotationCanvas photoUrl={expandedPhoto.photo_url}` — passes relative path to canvas which uses it as `img.src`
- `PanoramicPhotoViewer photoUrl={expandedPhoto.photo_url}` — same issue
- Fix: resolve signed URL before passing to these components

### 4. `src/components/PhotoGallery.tsx` (lines 176, 195, 237)
- Same pattern as EnhancedPhotoGallery — `PhotoAnnotationCanvas`, `PanoramicPhotoViewer`, `PhotoAnnotationViewer` all receive raw relative paths
- Fix: resolve signed URL before passing

### 5. `src/components/PanoramicPhotoViewer.tsx` (line 190)
- `<img src={photoUrl}>` used directly
- This component receives photoUrl as a prop — callers must pass signed URLs

### 6. `src/components/PhotoAnnotationViewer.tsx` (line ~50)
- `img.src = photoUrl` and `FabricImage.fromURL(photoUrl)` — uses raw path
- Same fix: callers must pass signed URLs

## Approach

**Strategy**: Resolve signed URLs at the caller level (EnhancedPhotoGallery, PhotoGallery, RoomViewModal, ClientFloorPlanViewer) before passing to child components. This way `PhotoAnnotationCanvas`, `PanoramicPhotoViewer`, and `PhotoAnnotationViewer` receive working URLs without internal changes.

### Changes per file:

1. **RoomViewModal.tsx**: Import `SignedImage`, replace `<img src={roomView?.photo_url}>` with `<SignedImage bucket="room-views" path={roomView?.photo_url}>`

2. **ClientFloorPlanViewer.tsx**: 
   - Import `SignedImage` and `useSignedUrl`
   - Replace room view image and photo grid images with `<SignedImage>`
   - For lightbox: change state to `{bucket, path}`, render lightbox with `SignedImage`

3. **EnhancedPhotoGallery.tsx**: 
   - Import `useSignedUrl`
   - Add `const resolvedPhotoUrl = useSignedUrl(expandedPhoto?.storage_bucket || 'floor-plans', expandedPhoto?.photo_url)` 
   - Pass `resolvedPhotoUrl` to `PhotoAnnotationCanvas`, `PanoramicPhotoViewer`

4. **PhotoGallery.tsx**: 
   - Same pattern as EnhancedPhotoGallery — resolve signed URL for expanded photo, pass to child components

5. **PanoramicPhotoViewer.tsx** and **PhotoAnnotationViewer.tsx**: No changes needed — they'll receive pre-resolved signed URLs from callers

