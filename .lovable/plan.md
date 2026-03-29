

# Floor Plan List View with Open/Edit/Add Actions

## Summary
Replace the current "floor selector dropdown + inline InteractiveFloorPlan" UI with a **list-based approach** — similar to how Drop Points are listed. Users see all floor plans in a card list, tap **Open** to view full-screen, tap **Edit** to rename/re-upload/annotate, and tap **Add Floorplan** to create new ones via Upload, Satellite, or Draw (using the annotation canvas on a white background, replacing the current Fabric.js draw mode).

## Changes

### 1. New component: `src/components/FloorPlanListView.tsx`
A card-list of all floor plans for a location, styled similarly to the DropPointList:
- Each row shows: floor name, thumbnail preview (signed URL), status badge (has image or empty)
- Two action buttons per row: **Open** (navigates to full-screen viewer) and **Edit** (opens edit dialog)
- **Add Floorplan** button at the top
- Clicking **Open** navigates to `/floor-plan-editor?locationId=X&floor=N&mode=floor` (existing full-screen page)
- Clicking **Edit** opens a new `EditFloorPlanDialog` (see below)

### 2. New component: `src/components/EditFloorPlanDialog.tsx`
A dialog for editing an existing floor plan:
- **Rename**: text input to change the floor's custom name (updates `floor_plan_files[key].name` in the locations table)
- **Replace Map**: button to open `FloorPlanUploadDialog` for re-uploading
- **Annotate**: button that opens `PhotoAnnotationCanvas` with the current floor plan image as the background, saves the annotated result back as the floor plan image

### 3. New component: `src/components/AddFloorPlanDialog.tsx`
A dialog offering three creation methods:
- **Upload** — opens existing `FloorPlanUploadDialog` (upload tab)
- **Satellite View** — opens existing `FloorPlanUploadDialog` (satellite tab)
- **Draw Floorplan** — creates a blank white PNG (e.g., 3000×2000), stores it as the floor plan image, then immediately opens `PhotoAnnotationCanvas` on that white background so users can draw using the familiar annotation tools (pen, shapes, text, measurements)

This replaces the current `ManualDrawModeCanvas` approach. The draw option will:
1. Generate a white canvas blob
2. Upload it to storage as the floor plan
3. Open the annotation canvas on that image for drawing

### 4. Modify: `src/components/LocationDetailsModal.tsx` (~lines 537-620)
- Replace the floor selector dropdown + inline `InteractiveFloorPlan` with `<FloorPlanListView locationId={location.id} />`
- Remove the "Manage Floors" button (floor management now happens through the list)
- Keep Diagnostics and File Manager tabs below the list

### 5. Modify: `src/components/InteractiveFloorPlan.tsx`
- Remove the "Draw Floor Plan" toolbar button and `ManualDrawModeCanvas` integration (the draw button in the floating toolbar)
- Keep everything else (drop points, room views, wire paths, upload, satellite, export, filter)

### 6. Cleanup (optional, can defer)
- `ManualDrawModeCanvas.tsx` and `ManualDrawModeToolbar.tsx` become unused — can be removed or kept for now

## Technical Details

**Floor plan data structure** (existing, in `locations.floor_plan_files` JSONB):
```json
{
  "1": { "image_path": "loc-id/floor_1.png", "name": "Ground Floor", "is_drawn": false },
  "2": { "image_path": "loc-id/floor_2.png", "name": "Mezzanine" },
  "outbuilding_1": { "image_path": "...", "name": "Garage" }
}
```

**Draw via annotation approach**: 
- Generate a 3000×2000 white PNG blob in-browser using a `<canvas>` element
- Upload to `floor-plans` bucket
- Open `PhotoAnnotationCanvas` with that URL — user draws walls, rooms, labels using the same pen/shape/text tools they already know from photo annotation
- On save, the annotated image replaces the white background as the floor plan

**Thumbnail in list**: Use `SignedImage` component at small size (e.g., 80×60px) with the floor plan's `image_path`

## File Summary
- **New**: `FloorPlanListView.tsx`, `EditFloorPlanDialog.tsx`, `AddFloorPlanDialog.tsx`
- **Modified**: `LocationDetailsModal.tsx` (swap inline viewer for list), `InteractiveFloorPlan.tsx` (remove draw mode button)

