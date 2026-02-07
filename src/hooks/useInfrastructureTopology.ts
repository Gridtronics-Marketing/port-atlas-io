import { useMemo } from 'react';
import { useDistributionFrames } from '@/hooks/useDistributionFrames';
import { useBackboneCables } from '@/hooks/useBackboneCables';
import { useDropPoints } from '@/hooks/useDropPoints';
import { buildTopology } from '@/lib/topology-normalizer';

export const useInfrastructureTopology = (locationId: string, locationName: string) => {
  const { frames, loading: framesLoading } = useDistributionFrames(locationId);
  const { cables, loading: cablesLoading } = useBackboneCables(locationId);
  const { dropPoints, loading: dropPointsLoading } = useDropPoints(locationId);

  const loading = framesLoading || cablesLoading || dropPointsLoading;

  const topology = useMemo(() => {
    if (loading) return null;
    return buildTopology(locationId, locationName, frames, cables, dropPoints);
  }, [loading, locationId, locationName, frames, cables, dropPoints]);

  const flags = topology?.flags ?? [];

  return { topology, loading, flags };
};
