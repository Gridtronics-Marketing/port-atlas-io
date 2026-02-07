import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useInfrastructureTopology } from '@/hooks/useInfrastructureTopology';
import { Download, AlertTriangle, Network, Filter } from 'lucide-react';
import { TopologyDiagram } from '@/components/TopologyDiagram';
import { TRADE_CATEGORIES, TRADE_DISPLAY_NAMES, TRADE_TYPES, getTradeColor, type TradeType } from '@/lib/trade-registry';

interface InfrastructureTopologyViewProps {
  locationId: string;
  locationName: string;
}

export const InfrastructureTopologyView: React.FC<InfrastructureTopologyViewProps> = ({
  locationId,
  locationName,
}) => {
  const { topology, loading, flags } = useInfrastructureTopology(locationId, locationName);
  const [activeTrades, setActiveTrades] = useState<string[]>([]);
  const [showTradeFilter, setShowTradeFilter] = useState(false);

  const handleToggleTrade = (trade: string) => {
    setActiveTrades(prev =>
      prev.includes(trade) ? prev.filter(t => t !== trade) : [...prev, trade]
    );
  };

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
            <div className="text-2xl font-bold text-destructive">{flags.length}</div>
            <div className="text-xs text-muted-foreground">Flags</div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Topology Diagram */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              Infrastructure Topology
            </h3>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowTradeFilter(!showTradeFilter)}>
              <Filter className="h-3.5 w-3.5" />
              Trades
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </Button>
          </div>
          {showTradeFilter && (
            <div className="flex flex-wrap gap-2 mb-3">
              {TRADE_CATEGORIES.map(cat => cat.trades).flat().map(trade => (
                <button
                  key={trade}
                  onClick={() => handleToggleTrade(trade)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    activeTrades.includes(trade) || activeTrades.length === 0
                      ? 'opacity-100' : 'opacity-40'
                  }`}
                  style={{
                    borderColor: `hsl(${getTradeColor(trade)})`,
                    backgroundColor: activeTrades.includes(trade) ? `hsl(${getTradeColor(trade)} / 0.15)` : undefined,
                    color: `hsl(${getTradeColor(trade)})`,
                  }}
                >
                  {TRADE_DISPLAY_NAMES[trade as TradeType]}
                </button>
              ))}
            </div>
          )}
          <TopologyDiagram topology={topology} />
        </CardContent>
      </Card>

      {/* Physical Connections List */}
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
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Flags for Review ({flags.length})
            </h3>
            <div className="space-y-1.5">
              {flags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-destructive/5 border border-destructive/20 rounded-md text-sm">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
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
