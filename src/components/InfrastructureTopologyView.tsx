import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInfrastructureTopology } from '@/hooks/useInfrastructureTopology';
import { Download, AlertTriangle, Network, Server, Radio, ChevronDown, ChevronRight } from 'lucide-react';
import type { TopologyNode, TopologyDropPoint } from '@/lib/topology-normalizer';

interface InfrastructureTopologyViewProps {
  locationId: string;
  locationName: string;
}

export const InfrastructureTopologyView: React.FC<InfrastructureTopologyViewProps> = ({
  locationId,
  locationName,
}) => {
  const { topology, loading, flags } = useInfrastructureTopology(locationId, locationName);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Building infrastructure topology...
      </div>
    );
  }

  if (!topology) return null;

  const mdfCount = topology.nodes.filter(n => n.type === 'MDF').length;
  const idfCount = topology.nodes.filter(n => n.type === 'IDF').length;
  const connectedDrops = topology.drop_points.filter(d => d.parent_node_id).length;
  const unconnectedDrops = topology.drop_points.filter(d => !d.parent_node_id).length;

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getChildDropPoints = (nodeId: string): TopologyDropPoint[] =>
    topology.drop_points.filter(d => d.parent_node_id === nodeId);

  const handleExport = () => {
    const { flags: _flags, ...exportData } = topology;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topology-${locationName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const classificationColor = (c: string) => {
    switch (c) {
      case 'WiFi AP': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'Camera': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'TV / Display': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'Data': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'IoT': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{mdfCount}</div>
            <div className="text-xs text-muted-foreground">MDFs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{idfCount}</div>
            <div className="text-xs text-muted-foreground">IDFs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{topology.drop_points.length}</div>
            <div className="text-xs text-muted-foreground">Drop Points</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{topology.edges.length}</div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{flags.length}</div>
            <div className="text-xs text-muted-foreground">Flags</div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchical Tree */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Infrastructure Hierarchy</h3>
            <Button size="sm" variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </Button>
          </div>

          {topology.nodes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No distribution frames configured. Add MDF/IDF equipment to build the topology.
            </div>
          ) : (
            <div className="space-y-1">
              {topology.nodes.map(node => {
                const children = getChildDropPoints(node.id);
                const isExpanded = expandedNodes.has(node.id);
                const hasChildren = children.length > 0;

                return (
                  <div key={node.id}>
                    <button
                      onClick={() => hasChildren && toggleNode(node.id)}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 text-left"
                    >
                      {hasChildren ? (
                        isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <span className="w-4" />
                      )}
                      <Server className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{node.normalized_name}</span>
                      <Badge variant={node.type === 'MDF' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {node.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        Floor {node.floor}{node.room ? ` · ${node.room}` : ''}
                        {hasChildren ? ` · ${children.length} drops` : ''}
                      </span>
                    </button>

                    {isExpanded && hasChildren && (
                      <div className="ml-10 space-y-0.5 pb-1">
                        {children.map((dp, idx) => (
                          <div key={`${dp.id}-${idx}`} className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted/30">
                            <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{dp.label}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${classificationColor(dp.classification)}`}>
                              {dp.classification}
                            </Badge>
                            {dp.port && (
                              <span className="text-xs text-muted-foreground ml-auto">{dp.port}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Unconnected drop points */}
          {unconnectedDrops > 0 && (
            <div className="mt-4 pt-3 border-t">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Unconnected Drop Points ({unconnectedDrops})
              </h4>
              <div className="space-y-0.5">
                {topology.drop_points.filter(d => !d.parent_node_id).map((dp, idx) => (
                  <div key={`${dp.id}-unconnected-${idx}`} className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted/30">
                    <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{dp.label}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${classificationColor(dp.classification)}`}>
                      {dp.classification}
                    </Badge>
                    {dp.floor != null && (
                      <span className="text-xs text-muted-foreground ml-auto">Floor {dp.floor}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edges */}
      {topology.edges.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Physical Connections</h3>
            <div className="space-y-2">
              {topology.edges.map((edge, idx) => {
                const fromNode = topology.nodes.find(n => n.id === edge.from);
                const toNode = topology.nodes.find(n => n.id === edge.to);
                return (
                  <div key={idx} className="flex items-center gap-3 p-2 border rounded-md text-sm">
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{fromNode?.normalized_name ?? 'Unknown'}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{toNode?.normalized_name ?? 'Unknown'}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{edge.media}</Badge>
                    <span className="text-xs text-muted-foreground">{edge.cable_label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flags */}
      {flags.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Flags for Review ({flags.length})
            </h3>
            <div className="space-y-1.5">
              {flags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-amber-500/5 border border-amber-200 rounded-md text-sm">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{flag.reason}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
