import type { DistributionFrame } from '@/hooks/useDistributionFrames';
import type { BackboneCable } from '@/hooks/useBackboneCables';
import type { DropPoint } from '@/hooks/useDropPoints';

export interface TopologyNode {
  id: string;
  type: 'MDF' | 'IDF';
  normalized_name: string;
  floor: number;
  room: string | null;
}

export interface TopologyDropPoint {
  id: string;
  label: string;
  classification: string;
  floor: number | null;
  room: string | null;
  parent_node_id: string | null;
  port: string | null;
}

export interface TopologyEdge {
  from: string;
  to: string;
  media: string;
  cable_label: string;
}

export interface TopologyFlag {
  item_id: string;
  item_type: 'node' | 'drop_point' | 'edge';
  reason: string;
}

export interface InfrastructureTopology {
  location: { id: string; name: string };
  nodes: TopologyNode[];
  drop_points: TopologyDropPoint[];
  edges: TopologyEdge[];
  flags: TopologyFlag[];
}

const DROP_POINT_TYPE_MAP: Record<string, string> = {
  wifi: 'WiFi AP',
  camera: 'Camera',
  av: 'TV / Display',
  data: 'Data',
  access_control: 'IoT',
  other: 'unknown',
};

// Types that represent infrastructure nodes, not endpoints
const NODE_TYPES = new Set(['mdf', 'idf']);

export function classifyDropPoint(pointType: string): string {
  if (NODE_TYPES.has(pointType)) return '__skip__';
  return DROP_POINT_TYPE_MAP[pointType] || 'unknown';
}

export function normalizeFrameName(frame: DistributionFrame): string {
  if (frame.name && frame.name.trim()) {
    return frame.name.trim();
  }
  const prefix = frame.frame_type === 'MDF' ? 'MDF' : 'IDF';
  return `${prefix}-F${frame.floor}`;
}

export function buildTopology(
  locationId: string,
  locationName: string,
  frames: DistributionFrame[],
  cables: BackboneCable[],
  dropPoints: DropPoint[]
): InfrastructureTopology {
  const flags: TopologyFlag[] = [];

  // 1. Build nodes from distribution frames
  const nodes: TopologyNode[] = frames.map(frame => ({
    id: frame.id,
    type: frame.frame_type,
    normalized_name: normalizeFrameName(frame),
    floor: frame.floor,
    room: frame.room ?? null,
  }));

  // 2. Build edges from backbone cables
  const frameById = new Map(frames.map(f => [f.id, f]));
  const edges: TopologyEdge[] = [];

  for (const cable of cables) {
    // Try to match origin/destination equipment names to frames
    const originFrame = frames.find(
      f => f.id === cable.origin_equipment ||
        normalizeFrameName(f) === cable.origin_equipment ||
        `${f.frame_type} - Floor ${f.floor}` === cable.origin_equipment
    );
    const destFrame = frames.find(
      f => f.id === cable.destination_equipment ||
        normalizeFrameName(f) === cable.destination_equipment ||
        `${f.frame_type} - Floor ${f.floor}` === cable.destination_equipment
    );

    if (originFrame && destFrame) {
      edges.push({
        from: originFrame.id,
        to: destFrame.id,
        media: cable.cable_type,
        cable_label: cable.cable_label,
      });
    } else {
      flags.push({
        item_id: cable.id,
        item_type: 'edge',
        reason: `Cable "${cable.cable_label}" could not be resolved to known frames (origin: ${cable.origin_equipment || 'none'}, dest: ${cable.destination_equipment || 'none'})`,
      });
    }
  }

  // 3. Build drop points with parent connections from type_specific_data
  const topologyDropPoints: TopologyDropPoint[] = [];

  for (const dp of dropPoints) {
    const classification = classifyDropPoint(dp.point_type);
    if (classification === '__skip__') continue;

    // Extract mdf_idf_connections from type_specific_data
    const typeData = (dp as any).type_specific_data as Record<string, any> | null;
    const connections: Array<{ frame_id?: string; port?: string; notes?: string }> =
      typeData?.mdf_idf_connections ?? [];

    if (connections.length === 0) {
      // No parent connection — still include but flag
      topologyDropPoints.push({
        id: dp.id,
        label: dp.label,
        classification,
        floor: dp.floor,
        room: dp.room,
        parent_node_id: null,
        port: null,
      });

      if (classification === 'unknown') {
        flags.push({
          item_id: dp.id,
          item_type: 'drop_point',
          reason: `Drop point "${dp.label}" has type "other" — classification unknown`,
        });
      } else {
        flags.push({
          item_id: dp.id,
          item_type: 'drop_point',
          reason: `Drop point "${dp.label}" has no MDF/IDF connection defined`,
        });
      }
    } else {
      // Create one topology drop point per connection (most will have just one)
      for (const conn of connections) {
        const parentExists = conn.frame_id ? frameById.has(conn.frame_id) : false;

        topologyDropPoints.push({
          id: dp.id,
          label: dp.label,
          classification,
          floor: dp.floor,
          room: dp.room,
          parent_node_id: parentExists ? conn.frame_id! : null,
          port: conn.port ?? null,
        });

        if (!parentExists && conn.frame_id) {
          flags.push({
            item_id: dp.id,
            item_type: 'drop_point',
            reason: `Drop point "${dp.label}" references frame_id "${conn.frame_id}" which does not exist`,
          });
        }

        if (classification === 'unknown') {
          flags.push({
            item_id: dp.id,
            item_type: 'drop_point',
            reason: `Drop point "${dp.label}" has type "other" — classification unknown`,
          });
        }
      }
    }
  }

  return {
    location: { id: locationId, name: locationName },
    nodes,
    drop_points: topologyDropPoints,
    edges,
    flags,
  };
}
