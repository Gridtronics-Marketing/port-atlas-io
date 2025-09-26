import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOfflineDataHook } from '@/hooks/useOfflineDataHook';

export interface BackboneCable {
  id: string;
  location_id: string;
  cable_type: 'fiber' | 'copper' | 'coax';
  cable_subtype?: string;
  strand_count?: number;
  pair_count?: number;
  jacket_rating?: 'plenum' | 'riser' | 'LSZH';
  origin_floor?: number;
  destination_floor?: number;
  origin_equipment?: string;
  destination_equipment?: string;
  labeling_standard: string;
  cable_label: string;
  unique_id?: string;
  installation_date?: string;
  test_results: any;
  capacity_total?: number;
  capacity_used: number;
  capacity_spare?: number;
  notes?: string;
  is_multi_segment: boolean;
  total_segments?: number;
  created_at?: string;
  updated_at?: string;
}

export const useBackboneCables = (locationId?: string) => {
  const offlineHook = useOfflineDataHook<BackboneCable>({
    tableName: 'backbone_cables',
    filter: locationId ? { location_id: locationId } : undefined,
    orderBy: { column: 'cable_label', ascending: true },
    dependencies: [locationId],
  });

  return {
    cables: offlineHook.data,
    loading: offlineHook.loading,
    fetchCables: offlineHook.refetch,
    addCable: offlineHook.addItem,
    updateCable: offlineHook.updateItem,
    deleteCable: offlineHook.deleteItem
  };
};