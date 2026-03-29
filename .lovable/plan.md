

# Fix: Floor Plan Image Not Loading in Full-Screen Editor

## Problem
When opening a floor plan via the "Open" button, the `FloorPlanEditorPage` passes `locationId` and `floorNumber` to `InteractiveFloorPlan`, but does **not** pass `fileUrl` or `filePath`. The component loads `floorPlanFiles` from the database (lines 187-203) but never uses them to resolve the actual image URL. So it always shows "No Floor Plan Uploaded."

## Fix

### `src/components/InteractiveFloorPlan.tsx` (~lines 186-203)
After loading `floorPlanFiles` from the DB, use `getFloorPlanImagePath()` to extract the image path for the current `floorNumber`, then resolve a signed URL and set it as `resolvedFileUrl`:

```typescript
useEffect(() => {
  if (!validLocationId) return;
  
  const loadFloorPlanFiles = async () => {
    const { data } = await supabase
      .from('locations')
      .select('floor_plan_files')
      .eq('id', locationId)
      .single();
    
    if (data?.floor_plan_files) {
      setFloorPlanFiles(data.floor_plan_files as Record<string, any>);
      
      // Auto-resolve floor plan image if no URL/path was provided via props
      if (!fileUrl && !filePath) {
        const imagePath = getFloorPlanImagePath(
          data.floor_plan_files as Record<string, any>,
          floorNumber.toString()
        );
        if (imagePath) {
          const url = await getSignedStorageUrl('floor-plans', imagePath);
          if (url) setResolvedFileUrl(url);
        }
      }
    }
  };
  
  loadFloorPlanFiles();
}, [locationId, validLocationId, floorNumber, fileUrl, filePath]);
```

Also add the import for `getFloorPlanImagePath` from `@/lib/storage-utils` (it's already partially imported on line 49).

## File Summary
- **Modified**: `src/components/InteractiveFloorPlan.tsx` (one `useEffect` update + import addition)

