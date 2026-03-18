

# Data Migration: Store File Paths Instead of Full URLs

## Problem
~3,214 rows across 5 tables store full Supabase URLs (public or signed) instead of relative file paths. Since buckets are now private, these URLs are broken. Signed URLs stored in DB also expire after 1 hour.

## Affected Tables & Row Counts

| Table | Column | Rows with full URLs | Bucket |
|-------|--------|-------------------|--------|
| `drop_point_photos` | `photo_url` | 1,938 | floor-plans + room-views |
| `room_view_photos` | `photo_url` | 967 | floor-plans + room-views |
| `room_views` | `photo_url` | 305 | room-views |
| `test_results_files` | `file_url` | 3 | floor-plans |
| `tradetube_content` | `file_url` | 1 | tradetube-media |

URL patterns to extract paths from:
- `https://mhrekppksiekhstnteyu.supabase.co/storage/v1/object/public/floor-plans/{path}` → bucket=`floor-plans`, path=`{path}`
- `https://mhrekppksiekhstnteyu.supabase.co/storage/v1/object/public/room-views/{path}` → bucket=`room-views`, path=`{path}`
- `https://mhrekppksiekhstnteyu.supabase.co/storage/v1/object/public/tradetube-media/{path}` → bucket=`tradetube-media`, path=`{path}`

Some rows may also have signed URLs (`/object/sign/...?token=...`) -- these need the path extracted too.

## Plan

### 1. Database migration -- strip URLs to relative paths
SQL UPDATE statements to extract relative file paths from full URLs for all 5 tables. Also add a `storage_bucket` column to `drop_point_photos` and `room_view_photos` since they use two different buckets (floor-plans and room-views) -- we need to know which bucket to generate signed URLs from.

```sql
-- Add storage_bucket column to tables that use multiple buckets
ALTER TABLE drop_point_photos ADD COLUMN IF NOT EXISTS storage_bucket text DEFAULT 'floor-plans';
ALTER TABLE room_view_photos ADD COLUMN IF NOT EXISTS storage_bucket text DEFAULT 'floor-plans';

-- Update drop_point_photos: extract path, set correct bucket
UPDATE drop_point_photos 
SET storage_bucket = 'room-views',
    photo_url = regexp_replace(photo_url, '^https://[^/]+/storage/v1/object/(?:public|sign)/room-views/', '')
WHERE photo_url LIKE '%/room-views/%';

UPDATE drop_point_photos 
SET storage_bucket = 'floor-plans',
    photo_url = regexp_replace(photo_url, '^https://[^/]+/storage/v1/object/(?:public|sign)/floor-plans/', '')
WHERE photo_url LIKE '%/floor-plans/%';

-- Strip query params from signed URLs
UPDATE drop_point_photos SET photo_url = split_part(photo_url, '?', 1) WHERE photo_url LIKE '%?token=%';

-- Same for room_view_photos, room_views, test_results_files, tradetube_content
```

### 2. Create a `useSignedUrl` hook (`src/hooks/useSignedUrl.ts`)
A reusable hook that takes a bucket name and a relative path, generates a signed URL via `getSignedStorageUrl`, caches it, and returns it. Includes auto-refresh before expiry.

### 3. Create a `SignedImage` component (`src/components/ui/signed-image.tsx`)
A drop-in replacement for `<img src={photo_url}>` that internally uses `useSignedUrl` to resolve the path to a signed URL. Accepts `bucket`, `path`, and standard img props.

### 4. Update upload code to store relative paths
Files that store full URLs after upload:
- **`src/hooks/usePhotoCapture.ts`** (lines 228-252): Change `result.url` from signed URL to relative path `photos/${filename}`, and add `storage_bucket` to the returned `CapturedPhoto`.
- **`src/hooks/useTradeTubeContent.ts`** (lines 272-276): Store `filePath` instead of `signedData.signedUrl`.
- **`src/hooks/useTestResults.ts`**: Store relative path instead of signed URL.
- **`src/components/TestResultsUpload.tsx`**: Store relative path.

### 5. Update display code to resolve signed URLs on-the-fly
Replace direct `<img src={photo.photo_url}>` with `<SignedImage>` in:
- `EnhancedPhotoGallery.tsx` (main gallery used everywhere)
- `PhotoGallery.tsx`
- `ClientDropPointDetail.tsx`
- `ClientFloorPlanViewer.tsx`
- `ClientRoomViewList.tsx`
- `RoomViewModal.tsx`
- `MultiAnglePhotoViewer.tsx`
- `SafetyChecklistModal.tsx`
- `TradeTubeMediaPlayer.tsx` (video/audio/image/pdf)

### 6. Update delete code to use relative paths
- `useDropPointPhotos.ts` `deletePhoto`: currently splits full URL to get filename -- update to use relative path directly.
- `useRoomViewPhotos.ts` `deletePhoto`: same fix.
- `useTradeTubeContent.ts` `deleteContent`: currently splits on `/tradetube-media/` -- update to use path directly.

### 7. Fix `ClientLocationNotesTab.tsx`
Replace hardcoded public URL construction with `getSignedStorageUrl` call.

### 8. Update `daily_logs.photos` array
The `usePhotoCapture` hook stores signed URLs in the `daily_logs.photos` JSONB array. Update to store `{bucket, path}` objects instead, and update any display code that reads `daily_logs.photos`.

### Technical Details

**`useSignedUrl` hook**:
```typescript
export function useSignedUrl(bucket: string, path: string | null) {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    if (!path || path.startsWith('http')) { setUrl(path || ''); return; }
    getSignedStorageUrl(bucket, path).then(setUrl);
  }, [bucket, path]);
  return url;
}
```

**`SignedImage` component**:
```tsx
export function SignedImage({ bucket, path, ...imgProps }) {
  const url = useSignedUrl(bucket, path);
  if (!url) return <Skeleton />;
  return <img src={url} {...imgProps} />;
}
```

**Backward compatibility**: The `useSignedUrl` hook checks if the path starts with `http` -- if so, it passes it through as-is. This handles any rows that weren't migrated or edge cases.

**Bucket detection helper**: For tables with `storage_bucket` column, use it directly. For `room_views` (always `room-views`), `test_results_files` (always `floor-plans`), `tradetube_content` (always `tradetube-media`), hardcode the bucket.

