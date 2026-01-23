import { supabase } from '@/integrations/supabase/client';

/**
 * Floor plan configuration object structure
 */
export interface FloorPlanConfig {
  image_path: string;
  drawing_data?: string;
  is_drawn: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Generates a public URL for a file in Supabase storage
 */
export const getStorageUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Parse floor plan config to handle both legacy string format and new object format
 */
export const parseFloorPlanConfig = (
  floorPlanFiles: Record<string, any> | null,
  floor: number | string
): FloorPlanConfig | null => {
  if (!floorPlanFiles || !floorPlanFiles[floor]) {
    return null;
  }

  const value = floorPlanFiles[floor];

  // Legacy format: just a string path
  if (typeof value === 'string') {
    return {
      image_path: value,
      is_drawn: false,
    };
  }

  // New format: object with full config
  if (typeof value === 'object' && value.image_path) {
    return {
      image_path: value.image_path,
      drawing_data: value.drawing_data,
      is_drawn: value.is_drawn ?? false,
      created_at: value.created_at,
      updated_at: value.updated_at,
    };
  }

  return null;
};

/**
 * Check if a floor plan was drawn (vs uploaded)
 */
export const isDrawnFloorPlan = (
  floorPlanFiles: Record<string, any> | null,
  floor: number | string
): boolean => {
  const config = parseFloorPlanConfig(floorPlanFiles, floor);
  return config?.is_drawn ?? false;
};

/**
 * Get drawing data for a floor plan
 */
export const getDrawingData = (
  floorPlanFiles: Record<string, any> | null,
  floor: number | string
): string | null => {
  const config = parseFloorPlanConfig(floorPlanFiles, floor);
  return config?.drawing_data ?? null;
};

/**
 * Get the image path from floor plan files (handles both formats)
 */
export const getFloorPlanImagePath = (
  floorPlanFiles: Record<string, any> | null,
  floor: number | string
): string | null => {
  const config = parseFloorPlanConfig(floorPlanFiles, floor);
  return config?.image_path ?? null;
};

/**
 * Generates URLs for floor plan files from location data
 * Handles both legacy string format and new object format
 */
export const getFloorPlanUrls = (floorPlanFiles: Record<string, any> = {}): Record<number, string> => {
  const urls: Record<number, string> = {};
  
  Object.entries(floorPlanFiles).forEach(([floor, value]) => {
    // Only include numeric floor keys for backward compatibility
    if (!isNaN(parseInt(floor))) {
      const path = typeof value === 'string' ? value : value?.image_path;
      if (path) {
        urls[parseInt(floor)] = getStorageUrl('floor-plans', path);
      }
    }
  });
  
  return urls;
};

/**
 * Generates URLs for all floor plan files including outbuildings
 * Returns string-keyed URLs for both numeric floors and outbuilding keys
 */
export const getAllFloorPlanUrls = (floorPlanFiles: Record<string, any> = {}): Record<string, string> => {
  const urls: Record<string, string> = {};
  
  Object.entries(floorPlanFiles).forEach(([key, value]) => {
    // Skip riser diagrams
    if (key === 'riser' || key === 'riser_diagram') return;
    
    const path = typeof value === 'string' ? value : value?.image_path;
    if (path) {
      urls[key] = getStorageUrl('floor-plans', path);
    }
  });
  
  return urls;
};

/**
 * Gets floor plan metadata including custom names for outbuildings
 */
export const getFloorPlanMetadata = (floorPlanFiles: Record<string, any> = {}, key: string): { name?: string; type?: string } | null => {
  const value = floorPlanFiles[key];
  if (!value) return null;
  if (typeof value === 'string') return null;
  return { name: value.name, type: value.type };
};

/**
 * Gets the floor plan URL for a specific floor
 * Handles both legacy string format and new object format
 */
export const getFloorPlanUrl = (floorPlanFiles: Record<string, any> = {}, floor: number): string | undefined => {
  const config = parseFloorPlanConfig(floorPlanFiles, floor);
  return config?.image_path ? getStorageUrl('floor-plans', config.image_path) : undefined;
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
/**
 * Removes a floor plan from a location's floor_plan_files and optionally deletes the file from storage
 */
export const removeFloorPlanFromLocation = async (
  locationId: string,
  floor: number,
  deleteFromStorage: boolean = true
): Promise<void> => {
  try {
    // First get the current floor_plan_files
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('floor_plan_files')
      .eq('id', locationId)
      .single();

    if (fetchError) {
      console.error('Error fetching location:', fetchError);
      throw fetchError;
    }

    const currentFiles = (location?.floor_plan_files as Record<string, any>) || {};
    const floorConfig = currentFiles[floor];

    // Get the file path to delete
    let filePath: string | null = null;
    if (typeof floorConfig === 'string') {
      filePath = floorConfig;
    } else if (floorConfig?.image_path) {
      filePath = floorConfig.image_path;
    }

    // Delete from storage if requested and path exists
    if (deleteFromStorage && filePath) {
      await deleteFloorPlanFile(filePath);
    }

    // Remove the floor entry from floor_plan_files
    const updatedFiles = { ...currentFiles };
    delete updatedFiles[floor];

    // Update the location record
    const { error: updateError } = await supabase
      .from('locations')
      .update({ floor_plan_files: updatedFiles })
      .eq('id', locationId);

    if (updateError) {
      console.error('Error updating location:', updateError);
      throw updateError;
    }

    console.log('Successfully removed floor plan for floor', floor, 'from location', locationId);
  } catch (error) {
    console.error('Error in removeFloorPlanFromLocation:', error);
    throw error;
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