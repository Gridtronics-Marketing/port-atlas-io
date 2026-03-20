/**
 * Resolves the correct storage bucket for a photo record.
 * 
 * Room-view photos were historically saved with storage_bucket='floor-plans'
 * but the actual files live in the 'room-views' bucket. This utility
 * normalizes the bucket based on the photo_url pattern.
 */
export function resolvePhotoBucket(
  storageBucket: string | undefined | null,
  photoUrl: string
): string {
  // If the path looks like a room-view upload, always use 'room-views'
  if (photoUrl && photoUrl.match(/photos\/room_view[-_]/)) {
    return 'room-views';
  }
  return storageBucket || 'floor-plans';
}
