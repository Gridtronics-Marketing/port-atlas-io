import { useState, useEffect, useMemo } from 'react';
import { useDistributionFrames } from './useDistributionFrames';
import { useJunctionBoxes } from './useJunctionBoxes';

export interface EquipmentItem {
  id: string;
  label: string;
  type: 'distribution_frame' | 'junction_box';
  floor: number;
  equipment_type?: 'MDF' | 'IDF';
  junction_type?: 'splice' | 'patch_panel' | 'junction_box';
  x_coordinate?: number;
  y_coordinate?: number;
}

export const useEquipmentList = (locationId?: string) => {
  const { frames, loading: framesLoading } = useDistributionFrames(locationId);
  const { junctionBoxes, loading: junctionBoxesLoading } = useJunctionBoxes(locationId);
  
  const equipment = useMemo(() => {
    const equipmentList: EquipmentItem[] = [];
    
    // Add distribution frames
    frames.forEach(frame => {
      equipmentList.push({
        id: frame.id,
        label: `${frame.frame_type}-${frame.floor.toString().padStart(2, '0')} (Floor ${frame.floor})`,
        type: 'distribution_frame',
        floor: frame.floor,
        equipment_type: frame.frame_type,
        x_coordinate: frame.x_coordinate,
        y_coordinate: frame.y_coordinate,
      });
    });
    
    // Add junction boxes
    junctionBoxes.forEach(box => {
      equipmentList.push({
        id: box.id,
        label: `${box.label} (Floor ${box.floor})`,
        type: 'junction_box',
        floor: box.floor,
        junction_type: box.junction_type,
        x_coordinate: box.x_coordinate,
        y_coordinate: box.y_coordinate,
      });
    });
    
    // Sort by floor, then by type (MDF first, then IDF, then junction boxes)
    return equipmentList.sort((a, b) => {
      if (a.floor !== b.floor) {
        return a.floor - b.floor;
      }
      
      const typeOrder = { 'MDF': 0, 'IDF': 1, 'junction_box': 2, 'splice': 3, 'patch_panel': 4 };
      const aType = a.equipment_type || a.junction_type || 'junction_box';
      const bType = b.equipment_type || b.junction_type || 'junction_box';
      
      return (typeOrder[aType as keyof typeof typeOrder] || 5) - (typeOrder[bType as keyof typeof typeOrder] || 5);
    });
  }, [frames, junctionBoxes]);
  
  const getEquipmentByFloor = (floor?: number) => {
    if (!floor) return equipment;
    return equipment.filter(item => item.floor === floor);
  };
  
  const findPathSuggestions = (originFloor?: number, destinationFloor?: number) => {
    if (!originFloor || !destinationFloor || originFloor === destinationFloor) {
      return [];
    }
    
    const minFloor = Math.min(originFloor, destinationFloor);
    const maxFloor = Math.max(originFloor, destinationFloor);
    
    // Find junction boxes on floors between origin and destination
    const intermediateJunctions = junctionBoxes.filter(box => 
      box.floor > minFloor && 
      box.floor < maxFloor &&
      box.junction_type === 'junction_box' // Only suggest actual junction boxes for path routing
    );
    
    return intermediateJunctions.map(box => ({
      id: box.id,
      label: `${box.label} (Floor ${box.floor})`,
      floor: box.floor,
      type: 'junction_box' as const,
      junction_type: box.junction_type,
    }));
  };
  
  const generateCableLabel = (originFloor?: number, destinationFloor?: number, cableType?: string) => {
    if (!originFloor || !destinationFloor) return '';
    
    const prefix = cableType === 'fiber' ? 'FB' : cableType === 'copper' ? 'CB' : 'CX';
    return `${prefix}-${originFloor}-${destinationFloor}`;
  };
  
  return {
    equipment,
    loading: framesLoading || junctionBoxesLoading,
    getEquipmentByFloor,
    findPathSuggestions,
    generateCableLabel,
  };
};