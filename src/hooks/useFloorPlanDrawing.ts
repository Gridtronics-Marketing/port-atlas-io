import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getStorageUrl } from '@/lib/storage-utils';

export interface FloorPlanConfig {
  image_path: string;
  drawing_data?: string;
  is_drawn: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FloorPlanDrawingState {
  isDrawn: boolean;
  drawingData: string | null;
  imagePath: string | null;
  imageUrl: string | null;
}

/**
 * Parse floor plan files to handle both legacy string format and new object format
 */
export const parseFloorPlanConfig = (
  floorPlanFiles: Record<string, any> | null,
  floor: number
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
  floor: number
): boolean => {
  const config = parseFloorPlanConfig(floorPlanFiles, floor);
  return config?.is_drawn ?? false;
};

/**
 * Get drawing data for a floor plan
 */
export const getDrawingData = (
  floorPlanFiles: Record<string, any> | null,
  floor: number
): string | null => {
  const config = parseFloorPlanConfig(floorPlanFiles, floor);
  return config?.drawing_data ?? null;
};

/**
 * Hook for managing floor plan drawing state and persistence
 */
export const useFloorPlanDrawing = (locationId: string, floorNumber: number) => {
  const [isSaving, setIsSaving] = useState(false);
  const [drawingState, setDrawingState] = useState<FloorPlanDrawingState>({
    isDrawn: false,
    drawingData: null,
    imagePath: null,
    imageUrl: null,
  });
  const { toast } = useToast();

  /**
   * Load existing drawing data from location
   */
  const loadDrawingData = useCallback(async () => {
    try {
      const { data: location, error } = await supabase
        .from('locations')
        .select('floor_plan_files')
        .eq('id', locationId)
        .single();

      if (error) throw error;

      const floorPlanFiles = location?.floor_plan_files as Record<string, any> | null;
      const config = parseFloorPlanConfig(floorPlanFiles, floorNumber);

      if (config) {
        setDrawingState({
          isDrawn: config.is_drawn,
          drawingData: config.drawing_data || null,
          imagePath: config.image_path,
          imageUrl: getStorageUrl('floor-plans', config.image_path),
        });
      }

      return config;
    } catch (error) {
      console.error('Error loading drawing data:', error);
      return null;
    }
  }, [locationId, floorNumber]);

  /**
   * Save drawing to storage and update location record
   */
  const saveDrawing = useCallback(async (
    imageBlob: Blob,
    drawingJson: string
  ): Promise<string | null> => {
    setIsSaving(true);
    
    try {
      // Generate file path
      const timestamp = Date.now();
      const filePath = `${locationId}/floor_${floorNumber}_drawn_${timestamp}.png`;

      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(filePath, imageBlob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get current floor_plan_files
      const { data: location, error: fetchError } = await supabase
        .from('locations')
        .select('floor_plan_files')
        .eq('id', locationId)
        .single();

      if (fetchError) throw fetchError;

      // Build new floor plan config
      const currentFiles = (location?.floor_plan_files as Record<string, any>) || {};
      const newConfig: FloorPlanConfig = {
        image_path: filePath,
        drawing_data: drawingJson,
        is_drawn: true,
        created_at: currentFiles[floorNumber]?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update location with new floor plan config
      const updatedFiles = {
        ...currentFiles,
        [floorNumber]: newConfig,
      };

      const { error: updateError } = await supabase
        .from('locations')
        .update({ floor_plan_files: updatedFiles })
        .eq('id', locationId);

      if (updateError) throw updateError;

      const imageUrl = getStorageUrl('floor-plans', filePath);

      setDrawingState({
        isDrawn: true,
        drawingData: drawingJson,
        imagePath: filePath,
        imageUrl,
      });

      toast({
        title: "Floor Plan Saved",
        description: "Your drawing has been saved successfully.",
      });

      return imageUrl;
    } catch (error) {
      console.error('Error saving drawing:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save floor plan drawing. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [locationId, floorNumber, toast]);

  /**
   * Delete old drawing image when updating
   */
  const deleteOldDrawing = useCallback(async (oldPath: string) => {
    try {
      await supabase.storage
        .from('floor-plans')
        .remove([oldPath]);
    } catch (error) {
      console.warn('Failed to delete old drawing:', error);
    }
  }, []);

  return {
    drawingState,
    isSaving,
    loadDrawingData,
    saveDrawing,
    deleteOldDrawing,
    setDrawingState,
  };
};
