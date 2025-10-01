import { supabase } from "@/integrations/supabase/client";

/**
 * Converts a data URL to a Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Uploads a PNG data URL to Supabase storage and updates the location's floor plan
 */
export async function saveDrawingAsFloorPlan(
  locationId: string,
  floorNumber: number,
  pngDataURL: string
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  try {
    // Convert data URL to blob
    const blob = dataURLtoBlob(pngDataURL);
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${locationId}/floor-${floorNumber}-${timestamp}.png`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('floor-plans')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading floor plan:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get current location data
    const { data: locationData, error: fetchError } = await supabase
      .from('locations')
      .select('floor_plan_files')
      .eq('id', locationId)
      .single();

    if (fetchError) {
      console.error('Error fetching location:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Update floor_plan_files
    const currentFiles = (locationData?.floor_plan_files as Record<number, string>) || {};
    const oldFilePath = currentFiles[floorNumber];
    
    // Delete old file if it exists
    if (oldFilePath) {
      await supabase.storage
        .from('floor-plans')
        .remove([oldFilePath]);
    }

    // Update with new file path
    const updatedFiles = {
      ...currentFiles,
      [floorNumber]: fileName,
    };

    const { error: updateError } = await supabase
      .from('locations')
      .update({ floor_plan_files: updatedFiles })
      .eq('id', locationId);

    if (updateError) {
      console.error('Error updating location:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, filePath: fileName };
  } catch (error) {
    console.error('Error in saveDrawingAsFloorPlan:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Deletes a canvas drawing after it's been converted to a floor plan
 */
export async function deleteCanvasDrawing(
  locationId: string,
  floorNumber: number
): Promise<void> {
  try {
    await supabase
      .from('canvas_drawings')
      .delete()
      .eq('location_id', locationId)
      .eq('floor_number', floorNumber);
  } catch (error) {
    console.error('Error deleting canvas drawing:', error);
  }
}
