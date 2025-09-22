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
 * Deletes a floor plan file from storage
 */
export const deleteFloorPlanFile = async (filePath: string): Promise<void> => {
  try {
    console.log('Deleting floor plan file:', filePath);
    
    const { error } = await supabase.storage
      .from('floor-plans')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
    
    console.log('Successfully deleted floor plan file:', filePath);
  } catch (error) {
    console.error('Error in deleteFloorPlanFile:', error);
    throw error;
  }
};

/**
 * Validates if a file is accessible by attempting to fetch its headers
 */
export const validateFileAccess = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('File access validation failed for:', url, error);
    return false;
  }
};

/**
 * Gets detailed file information from storage
 */
export const getFileInfo = async (bucket: string, path: string) => {
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    const isAccessible = await validateFileAccess(data.publicUrl);
    
    return {
      url: data.publicUrl,
      isAccessible
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return {
      url: '',
      isAccessible: false
    };
  }
};

/**
 * Repairs orphaned floor plan files by scanning storage and updating database
 */
export const repairFloorPlanFiles = async (locationId: string): Promise<{ 
  repairedFiles: Record<number, string>, 
  inaccessibleFiles: string[], 
  totalFiles: number 
}> => {
  try {
    console.log('Scanning storage for orphaned files for location:', locationId);
    
    // List all files in the location's storage folder
    const { data: files, error: listError } = await supabase.storage
      .from('floor-plans')
      .list(locationId);
    
    if (listError) {
      console.error('Error listing storage files:', listError);
      throw listError;
    }
    
    if (!files || files.length === 0) {
      console.log('No files found in storage for location:', locationId);
      return { repairedFiles: {}, inaccessibleFiles: [], totalFiles: 0 };
    }
    
    // Parse floor plan files and validate accessibility
    const floorPlanFiles: Record<number, string> = {};
    const inaccessibleFiles: string[] = [];
    
    for (const file of files) {
      const match = file.name.match(/^floor_(\d+)\./);
      if (match) {
        const floor = parseInt(match[1]);
        const filePath = `${locationId}/${file.name}`;
        const fileUrl = getStorageUrl('floor-plans', filePath);
        
        // Check if file is accessible
        const isAccessible = await validateFileAccess(fileUrl);
        
        if (isAccessible) {
          floorPlanFiles[floor] = filePath;
        } else {
          inaccessibleFiles.push(filePath);
          console.warn('File not accessible:', filePath);
        }
      }
    }
    
    console.log('Found floor plan files to repair:', floorPlanFiles);
    console.log('Inaccessible files:', inaccessibleFiles);
    
    // Update the location record only with accessible files
    if (Object.keys(floorPlanFiles).length > 0) {
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
    }
    
    return { 
      repairedFiles: floorPlanFiles, 
      inaccessibleFiles, 
      totalFiles: files.length 
    };
  } catch (error) {
    console.error('Error in repairFloorPlanFiles:', error);
    throw error;
  }
};