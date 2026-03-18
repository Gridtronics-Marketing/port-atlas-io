

# Fix Floor Plan Export Stretching

## Problem
When exporting floor plans to PDF, the composite image is created using the **container's on-screen dimensions** (`containerDimensions.width/height`, e.g. 800x600) rather than the **original image's natural dimensions**. This stretches/distorts the floor plan to fit the container's aspect ratio.

Then in the PDF exporter, the image is stretched again to fill the page width.

## Root Cause

Two places cause distortion:

1. **`src/lib/floor-plan-composite.ts` (line 160-177)**: The canvas is sized to the passed `width`/`height` (container dimensions), and `drawImage` stretches the base image to fill that canvas: `ctx.drawImage(baseImage, 0, 0, width, height)`.

2. **`src/components/InteractiveFloorPlan.tsx` (lines ~723, ~902)**: Passes `containerDimensions` to the composite function instead of the image's natural dimensions.

## Fix

### 1. `src/lib/floor-plan-composite.ts`
- Use the **base image's natural dimensions** for the canvas size instead of the passed `width`/`height`.
- Load the base image first, set `canvas.width = baseImage.naturalWidth`, `canvas.height = baseImage.naturalHeight`.
- Scale drop point and room view marker positions using the ratio between the container dimensions (where % positions were calculated) and the natural image dimensions — but since markers use percentage-based coordinates (0-100), they already scale correctly.
- Fall back to passed `width`/`height` only if there's no base image.

### 2. `src/lib/floor-plan-exporter.ts` (lines 61-74)
- The current logic already preserves aspect ratio when fitting to page, but it starts by setting `imgWidth = contentWidth` which stretches wide. This is actually correct — it fits the image to page width while maintaining aspect ratio. The real distortion comes from the composite step above. No changes needed here.

### 3. `src/components/InteractiveFloorPlan.tsx`
- No changes needed — once the composite function uses natural image dimensions, the container dimensions become irrelevant for sizing (though they're still passed, the composite function will ignore them for canvas sizing when a base image is available).

## Summary
Single-file fix in `floor-plan-composite.ts`: use `baseImage.naturalWidth/Height` for canvas dimensions instead of the passed container dimensions.

