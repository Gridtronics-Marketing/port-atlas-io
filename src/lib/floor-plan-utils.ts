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
    // Validate input
    if (!pngDataURL || !pngDataURL.startsWith('data:image')) {
      console.error('Invalid PNG data URL');
      return { success: false, error: 'Invalid image data. Please try drawing again.' };
    }

    // Convert data URL to blob
    const blob = dataURLtoBlob(pngDataURL);
    
    if (!blob || blob.size === 0) {
      console.error('Failed to convert data URL to blob');
      return { success: false, error: 'Failed to process image. Please try again.' };
    }

    console.log('Converting drawing to floor plan:', {
      locationId,
      floorNumber,
      blobSize: blob.size,
      blobType: blob.type
    });
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${locationId}/floor-${floorNumber}-${timestamp}.png`;
    
    // Upload to storage with retry logic
    let uploadAttempt = 0;
    const maxAttempts = 3;
    let uploadError: any = null;

    while (uploadAttempt < maxAttempts) {
      uploadAttempt++;
      
      const { error } = await supabase.storage
        .from('floor-plans')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false,
        });

      if (!error) {
        uploadError = null;
        break;
      }
      
      uploadError = error;
      console.error(`Upload attempt ${uploadAttempt} failed:`, error);
      
      if (uploadAttempt < maxAttempts) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempt));
      }
    }

    if (uploadError) {
      console.error('Error uploading floor plan after retries:', uploadError);
      return { 
        success: false, 
        error: `Upload failed: ${uploadError.message}. Please check your connection and try again.` 
      };
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
