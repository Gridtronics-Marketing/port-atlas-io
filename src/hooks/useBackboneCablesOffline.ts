import { useOfflineDataHook } from './useOfflineDataHook';

export interface BackboneCable {
  id: string;
  location_id?: string;
  cable_label: string;
  cable_type: string;
  cable_subtype?: string;
  pair_count?: number;
  strand_count?: number;
  origin_floor?: number;
  destination_floor?: number;
  origin_equipment?: string;
  destination_equipment?: string;
  jacket_rating?: string;
  installation_date?: string;
  labeling_standard?: string;
  unique_id?: string;
  notes?: string;
  total_segments?: number;
  is_multi_segment?: boolean;
  capacity_total?: number;
  capacity_used?: number;
  capacity_spare?: number;
  test_results?: any;
  created_at?: string;
  updated_at?: string;
}

export const useBackboneCablesOffline = (locationId?: string) => {
  return useOfflineDataHook<BackboneCable>({
    tableName: 'backbone_cables',
    filter: locationId ? { location_id: locationId } : undefined,
    orderBy: { column: 'created_at', ascending: false },
    dependencies: [locationId],
  });
};