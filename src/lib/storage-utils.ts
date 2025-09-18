import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a public URL for a file in Supabase storage
 */
export const getStorageUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Generates URLs for floor plan files from location data
 */
export const getFloorPlanUrls = (floorPlanFiles: Record<number, string> = {}): Record<number, string> => {
  const urls: Record<number, string> = {};
  
  Object.entries(floorPlanFiles).forEach(([floor, path]) => {
    urls[parseInt(floor)] = getStorageUrl('floor-plans', path);
  });
  
  return urls;
};

/**
 * Gets the floor plan URL for a specific floor
 */
export const getFloorPlanUrl = (floorPlanFiles: Record<number, string> = {}, floor: number): string | undefined => {
  const path = floorPlanFiles[floor];
  return path ? getStorageUrl('floor-plans', path) : undefined;
};

/**
 * Repairs orphaned floor plan files by scanning storage and updating database
 */
export const repairFloorPlanFiles = async (locationId: string): Promise<void> => {
  try {
    console.log('Scanning storage for orphaned files for location:', locationId);
    
    // List all files in the location's storage folder
    const { data: files, error: listError } = await supabase.storage
      .from('floor-plans')
      .list(locationId);
    
    if (listError) {
      console.error('Error listing storage files:', listError);
      return;
    }
    
    if (!files || files.length === 0) {
      console.log('No files found in storage for location:', locationId);
      return;
    }
    
    // Parse floor plan files
    const floorPlanFiles: Record<number, string> = {};
    files.forEach(file => {
      const match = file.name.match(/^floor_(\d+)\./);
      if (match) {
        const floor = parseInt(match[1]);
        floorPlanFiles[floor] = `${locationId}/${file.name}`;
      }
    });
    
    if (Object.keys(floorPlanFiles).length === 0) {
      console.log('No floor plan files found in storage');
      return;
    }
    
    console.log('Found floor plan files to repair:', floorPlanFiles);
    
    // Update the location record
    const { data, error } = await supabase
      .from('locations')
      .update({ floor_plan_files: floorPlanFiles })
      .eq('id', locationId)
      .select();
    
    if (error) {
      console.error('Error updating location with repaired files:', error);
      throw error;
    }
    
    console.log('Successfully repaired floor plan files for location:', locationId, data);
  } catch (error) {
    console.error('Error in repairFloorPlanFiles:', error);
    throw error;
  }
};