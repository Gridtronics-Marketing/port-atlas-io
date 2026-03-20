
Fix the issue in two layers: data correction plus UI hardening.

1. Confirmed root cause
- For the exact location `52915 Mound Road, Shelby Township, MI, 48316`, room view `e6e518fd-829b-4b07-8af6-fd2ba1165d23` has 7 photo records.
- All 7 `room_view_photos` rows are saved with `storage_bucket = 'floor-plans'`.
- The actual files exist in Supabase Storage under `room-views`, not `floor-plans`.
- This matches the console warnings: the app is trying to sign URLs from `floor-plans`, which returns 404 and renders grey boxes.

2. What to change
- Add a SQL migration to repair existing bad data:
  - Update `room_view_photos.storage_bucket` from `floor-plans` to `room-views`
  - Limit it to room-view photo paths like `photos/room_view-%`
  - Only update rows where the object actually exists in `storage.objects` for bucket `room-views`
- Harden the frontend so this does not break again even if old/corrupt data exists:
  - In `useRoomViewPhotos.ts`, normalize fetched photo records so room-view photos resolve to `room-views` when the stored bucket is missing or incorrectly says `floor-plans`
  - In `PhotoGallery.tsx`, replace the remaining `expandedPhoto.storage_bucket || 'floor-plans'` fallback with room-view-safe logic
  - In `ClientFloorPlanViewer.tsx`, replace the remaining `photo.storage_bucket || 'floor-plans'` usage in the Room View Photos tab/lightbox with room-view-safe logic

3. Files to update
- `supabase/migrations/...sql`
- `src/hooks/useRoomViewPhotos.ts`
- `src/components/PhotoGallery.tsx`
- `src/components/ClientFloorPlanViewer.tsx`

4. Recommended implementation shape
- Create one small bucket resolver for room-view photos, e.g.:
  - if `photo_url` looks like `photos/room_view-*`, use `room-views`
  - otherwise respect the saved bucket
- Use that resolver consistently for:
  - thumbnail rendering
  - lightbox/fullscreen rendering
  - annotation viewer/canvas sources if applicable
  - any future room-view photo fetch normalization

5. Why this plan is the right fix
- The grey boxes are not just a rendering bug; they are caused by incorrect persisted bucket metadata.
- A UI-only fix would leave the bad records in place.
- A DB-only fix would still leave fragile code paths that could regress.
- Doing both fixes the current location immediately and prevents repeat issues elsewhere.

6. Scope of the data repair
- I verified this is not isolated to one row: there are 11 `room_view_photos` records in the database with `storage_bucket = 'floor-plans'`.
- The migration should repair all of them safely, not just this single room view.

Technical notes
- The upload flow in `usePhotoCapture.ts` already uses `room-views` for `category === 'room_view'`, so the main issue now is legacy/incorrect saved metadata plus a couple of remaining frontend fallbacks.
- After implementation, the exact failing path for this room view should stop requesting signed URLs from `floor-plans` and instead resolve from `room-views`.
