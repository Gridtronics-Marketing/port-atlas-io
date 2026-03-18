

# Fix Grey Box on Drop Point Photos

## Root Cause
In `DropPointDetailsModal.tsx` (line 706-717), when mapping photos to the `EnhancedPhotoGallery`, the `storage_bucket` field is **not included** in the mapped object. This means every photo defaults to `bucket="floor-plans"` inside `SignedImage`, but photos stored in the `room-views` bucket fail to generate a signed URL — returning `''`, which leaves the Skeleton (grey box) visible permanently.

Similarly, `ClientDropPointDetail.tsx` hardcodes `bucket="floor-plans"` and doesn't fetch `storage_bucket` from the database at all.

## Fix (2 files)

### 1. `src/components/DropPointDetailsModal.tsx` (line ~709)
Add `storage_bucket: photo.storage_bucket` to the photo mapping passed to `EnhancedPhotoGallery`:
```tsx
photos={photos.map(photo => ({
  id: photo.id,
  photo_url: photo.photo_url,
  storage_bucket: (photo as any).storage_bucket,  // ADD THIS
  description: photo.description,
  ...
}))}
```

### 2. `src/components/ClientDropPointDetail.tsx`
- Add `storage_bucket` to the Photo interface and the select query
- Use `photo.storage_bucket || 'floor-plans'` in the `SignedImage` bucket prop

