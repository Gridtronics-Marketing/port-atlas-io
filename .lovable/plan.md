

# Fix Annotation Save in Room View Photos

## Root Cause
The `room_view_photos` database table lacks `annotation_data` and `annotation_metadata` columns. When `PhotoAnnotationCanvas` calls `onSave`, it passes annotation data to `handleUpdatePhoto` in `RoomViewModal`, which calls `useRoomViewPhotos.updatePhoto()` — this sends `{ annotation_data, annotation_metadata }` to Supabase, which rejects the update because those columns don't exist.

## Plan

### 1. Add missing columns via migration
Add `annotation_data` (text, nullable) and `annotation_metadata` (jsonb, nullable) columns to `room_view_photos`.

### 2. Update `RoomViewPhoto` interface (`src/hooks/useRoomViewPhotos.ts`)
Add `annotation_data?: string` and `annotation_metadata?: Record<string, any>` to the `RoomViewPhoto` interface so TypeScript recognizes these fields.

### 3. Strip virtual fields in `updatePhoto` (`src/hooks/useRoomViewPhotos.ts`)
Similar to the location fix, strip out joined fields (`employee`) before sending the update to Supabase, preventing column-not-found errors from relation fields leaking into the update payload.

### 4. Fix type mismatch in `handleUpdatePhoto` (`src/components/RoomViewModal.tsx`, line 196)
The current handler casts `Json` types. Update it to pass `annotation_data` and `annotation_metadata` directly as proper types matching the updated interface, removing the lossy `as Partial<RoomViewPhoto>` cast.

