import React, { useMemo, useRef } from 'react';
import { Server, Radio, Wifi, Camera, Tv, Monitor, CircleDot } from 'lucide-react';
import type { InfrastructureTopology, TopologyNode, TopologyDropPoint } from '@/lib/topology-normalizer';

interface TopologyDiagramProps {
  topology: InfrastructureTopology;
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'MDF' | 'IDF' | 'drop';
  classification?: string;
  port?: string | null;
}

interface LayoutEdge {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label?: string;
  dashed?: boolean;
}

const NODE_W = 120;
const NODE_H = 70;
const H_GAP = 180;
const V_GAP = 90;

const classificationIcon = (c: string) => {
  switch (c) {
    case 'WiFi AP': return <Wifi className="h-5 w-5" />;
    case 'Camera': return <Camera className="h-5 w-5" />;
    case 'TV / Display': return <Tv className="h-5 w-5" />;
    case 'Data': return <Monitor className="h-5 w-5" />;
    default: return <CircleDot className="h-5 w-5" />;
  }
};

const classificationColor = (c: string) => {
  switch (c) {
    case 'WiFi AP': return 'hsl(var(--chart-1))';
    case 'Camera': return 'hsl(var(--destructive))';
    case 'TV / Display': return 'hsl(var(--chart-4))';
    case 'Data': return 'hsl(var(--chart-2))';
    case 'IoT': return 'hsl(var(--chart-3))';
    default: return 'hsl(var(--muted-foreground))';
  }
};

export const TopologyDiagram: React.FC<TopologyDiagramProps> = ({ topology }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { layoutNodes, layoutEdges, width, height } = useMemo(() => {
    const nodes: LayoutNode[] = [];
    const edges: LayoutEdge[] = [];

    if (topology.nodes.length === 0 && topology.drop_points.length === 0) {
      return { layoutNodes: nodes, layoutEdges: edges, width: 400, height: 200 };
    }

    // Sort: MDFs first, then IDFs
    const sortedInfraNodes = [...topology.nodes].sort((a, b) => {
      if (a.type === 'MDF' && b.type !== 'MDF') return -1;
      if (a.type !== 'MDF' && b.type === 'MDF') return 1;
      return a.floor - b.floor;
    });

    // Group drop points by parent
    const dpByParent = new Map<string, TopologyDropPoint[]>();
    const unconnected: TopologyDropPoint[] = [];
    for (const dp of topology.drop_points) {
      if (dp.parent_node_id) {
        const list = dpByParent.get(dp.parent_node_id) || [];
        list.push(dp);
        dpByParent.set(dp.parent_node_id, list);
      } else {
        unconnected.push(dp);
      }
    }

    // Layout: infrastructure nodes in column 0, children in column 1
    const COL0_X = 80;
    const COL1_X = COL0_X + H_GAP + NODE_W;
    let currentY = 60;

    for (const infra of sortedInfraNodes) {
      const children = dpByParent.get(infra.id) || [];
      const infraY = currentY;

      nodes.push({
        id: infra.id,
        x: COL0_X,
        y: infraY,
        label: infra.normalized_name,
        type: infra.type,
      });

      // Place children vertically aligned, centered around the parent
      const childStartY = children.length > 1
        ? infraY - ((children.length - 1) * V_GAP) / 2
        : infraY;

      children.forEach((dp, i) => {
        const dpY = childStartY + i * V_GAP;
        const dpNode: LayoutNode = {
          id: `${dp.id}-${i}`,
          x: COL1_X,
          y: dpY,
          label: dp.label,
          type: 'drop',
          classification: dp.classification,
          port: dp.port,
        };
        nodes.push(dpNode);

        // Edge from infra node to drop point
        edges.push({
          fromX: COL0_X + NODE_W,
          fromY: infraY + NODE_H / 2,
          toX: COL1_X,
          toY: dpY + NODE_H / 2,
          label: dp.port || undefined,
        });
      });

      currentY = Math.max(
        infraY + NODE_H + V_GAP,
        childStartY + children.length * V_GAP + 20
      );
    }

    // Backbone edges between infrastructure nodes
    for (const edge of topology.edges) {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (fromNode && toNode) {
        edges.push({
          fromX: fromNode.x + NODE_W / 2,
          fromY: fromNode.y + NODE_H,
          toX: toNode.x + NODE_W / 2,
          toY: toNode.y,
          label: edge.media,
          dashed: false,
        });
      }
    }

    // Unconnected drop points at the bottom
    if (unconnected.length > 0) {
      currentY += 30;
      const startX = COL0_X;
      unconnected.forEach((dp, i) => {
        nodes.push({
          id: `unconnected-${dp.id}-${i}`,
          x: startX + i * (NODE_W + 40),
          y: currentY,
          label: dp.label,
          type: 'drop',
          classification: dp.classification,
        });
      });
      currentY += NODE_H + 20;
    }

    const maxX = Math.max(...nodes.map(n => n.x + NODE_W), 400);
    const maxY = Math.max(...nodes.map(n => n.y + NODE_H), 200);

    return {
      layoutNodes: nodes,
      layoutEdges: edges,
      width: maxX + 80,
      height: maxY + 60,
    };
  }, [topology]);

  if (layoutNodes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No infrastructure configured. Add MDF/IDF equipment and drop points to build the topology.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full overflow-auto rounded-lg border bg-card">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-full"
      >
        {/* Edges */}
        {layoutEdges.map((edge, i) => {
          // Curved path
          const midX = (edge.fromX + edge.toX) / 2;
          const d = `M ${edge.fromX} ${edge.fromY} C ${midX} ${edge.fromY}, ${midX} ${edge.toY}, ${edge.toX} ${edge.toY}`;
          return (
            <g key={`edge-${i}`}>
              <path
                d={d}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray={edge.dashed ? '6 4' : undefined}
                opacity={0.6}
              />
              {edge.label && (
                <text
                  x={midX}
                  y={(edge.fromY + edge.toY) / 2 - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {layoutNodes.map((node) => {
          const isInfra = node.type === 'MDF' || node.type === 'IDF';
          const color = isInfra
            ? 'hsl(var(--primary))'
            : classificationColor(node.classification || '');

          return (
            <g key={node.id}>
              {/* Node box */}
              <rect
                x={node.x}
                y={node.y}
                width={NODE_W}
                height={NODE_H}
                rx={isInfra ? 8 : 12}
                fill="hsl(var(--card))"
                stroke={color}
                strokeWidth={isInfra ? 2 : 1.5}
              />

              {/* Icon area */}
              <foreignObject
                x={node.x}
                y={node.y + 8}
                width={NODE_W}
                height={28}
              >
                <div className="flex items-center justify-center" style={{ color }}>
                  {isInfra ? <Server className="h-5 w-5" /> : classificationIcon(node.classification || '')}
                </div>
              </foreignObject>

              {/* Label */}
              <text
                x={node.x + NODE_W / 2}
                y={node.y + NODE_H - 12}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-medium"
              >
                {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
              </text>

              {/* Type badge for infra nodes */}
              {isInfra && (
                <>
                  <rect
                    x={node.x + NODE_W - 32}
                    y={node.y + 4}
                    width={28}
                    height={14}
                    rx={4}
                    fill={color}
                    opacity={0.15}
                  />
                  <text
                    x={node.x + NODE_W - 18}
                    y={node.y + 14}
                    textAnchor="middle"
                    className="text-[9px] font-semibold"
                    fill={color}
                  >
                    {node.type}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
