import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Layers, Eye, EyeOff, Zap, Cable, Network, Building, Box, Activity } from 'lucide-react';

interface LayerState {
  fiber: boolean;
  copper: boolean;
  coax: boolean;
  equipment: boolean;
  junctionBoxes: boolean;
  capacityOverlay: boolean;
  statusIndicators: boolean;
  floorLabels: boolean;
}

interface DiagramLayerControlsProps {
  onLayerToggle: (layer: keyof LayerState, enabled: boolean) => void;
  cableStats: {
    fiber: number;
    copper: number;
    coax: number;
  };
  equipmentStats: {
    frames: number;
    junctionBoxes: number;
  };
}

export const DiagramLayerControls: React.FC<DiagramLayerControlsProps> = ({
  onLayerToggle,
  cableStats,
  equipmentStats
}) => {
  const [layers, setLayers] = useState<LayerState>({
    fiber: true,
    copper: true,
    coax: true,
    equipment: true,
    junctionBoxes: true,
    capacityOverlay: false,
    statusIndicators: true,
    floorLabels: true
  });

  const handleLayerToggle = (layer: keyof LayerState) => {
    const newState = !layers[layer];
    setLayers(prev => ({ ...prev, [layer]: newState }));
    onLayerToggle(layer, newState);
  };

  const toggleAll = (enabled: boolean) => {
    const newState = Object.keys(layers).reduce((acc, key) => ({
      ...acc,
      [key]: enabled
    }), {} as LayerState);
    
    setLayers(newState);
    Object.keys(newState).forEach(key => {
      onLayerToggle(key as keyof LayerState, enabled);
    });
  };

  const getLayerIcon = (layer: keyof LayerState) => {
    switch (layer) {
      case 'fiber': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'copper': return <Cable className="h-4 w-4 text-orange-500" />;
      case 'coax': return <Network className="h-4 w-4 text-green-500" />;
      case 'equipment': return <Building className="h-4 w-4 text-purple-500" />;
      case 'junctionBoxes': return <Box className="h-4 w-4 text-gray-500" />;
      case 'capacityOverlay': return <Activity className="h-4 w-4 text-red-500" />;
      case 'statusIndicators': return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'floorLabels': return <Layers className="h-4 w-4 text-indigo-500" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getLayerLabel = (layer: keyof LayerState) => {
    switch (layer) {
      case 'fiber': return 'Fiber Cables';
      case 'copper': return 'Copper Cables';
      case 'coax': return 'Coax Cables';
      case 'equipment': return 'Equipment';
      case 'junctionBoxes': return 'Junction Boxes';
      case 'capacityOverlay': return 'Capacity Overlay';
      case 'statusIndicators': return 'Status Indicators';
      case 'floorLabels': return 'Floor Labels';
      default: return layer;
    }
  };

  const getLayerCount = (layer: keyof LayerState) => {
    switch (layer) {
      case 'fiber': return cableStats.fiber;
      case 'copper': return cableStats.copper;
      case 'coax': return cableStats.coax;
      case 'equipment': return equipmentStats.frames;
      case 'junctionBoxes': return equipmentStats.junctionBoxes;
      default: return null;
    }
  };

  const cableLayers: (keyof LayerState)[] = ['fiber', 'copper', 'coax'];
  const equipmentLayers: (keyof LayerState)[] = ['equipment', 'junctionBoxes'];
  const visualLayers: (keyof LayerState)[] = ['capacityOverlay', 'statusIndicators', 'floorLabels'];

  return (
    <Card className="w-80 animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-5 w-5" />
          Diagram Layers
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => toggleAll(true)}>
            <Eye className="h-4 w-4 mr-1" />
            Show All
          </Button>
          <Button size="sm" variant="outline" onClick={() => toggleAll(false)}>
            <EyeOff className="h-4 w-4 mr-1" />
            Hide All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cable Layers */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Cable Types</h4>
          {cableLayers.map(layer => (
            <div key={layer} className="flex items-center justify-between hover-scale">
              <div className="flex items-center gap-3">
                {getLayerIcon(layer)}
                <span className="text-sm">{getLayerLabel(layer)}</span>
                {getLayerCount(layer) !== null && (
                  <Badge variant="outline" className="text-xs">
                    {getLayerCount(layer)}
                  </Badge>
                )}
              </div>
              <Switch
                checked={layers[layer]}
                onCheckedChange={() => handleLayerToggle(layer)}
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Equipment Layers */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Equipment</h4>
          {equipmentLayers.map(layer => (
            <div key={layer} className="flex items-center justify-between hover-scale">
              <div className="flex items-center gap-3">
                {getLayerIcon(layer)}
                <span className="text-sm">{getLayerLabel(layer)}</span>
                {getLayerCount(layer) !== null && (
                  <Badge variant="outline" className="text-xs">
                    {getLayerCount(layer)}
                  </Badge>
                )}
              </div>
              <Switch
                checked={layers[layer]}
                onCheckedChange={() => handleLayerToggle(layer)}
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Visual Enhancement Layers */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Visual Enhancements</h4>
          {visualLayers.map(layer => (
            <div key={layer} className="flex items-center justify-between hover-scale">
              <div className="flex items-center gap-3">
                {getLayerIcon(layer)}
                <span className="text-sm">{getLayerLabel(layer)}</span>
              </div>
              <Switch
                checked={layers[layer]}
                onCheckedChange={() => handleLayerToggle(layer)}
              />
            </div>
          ))}
        </div>

        {/* Layer Statistics */}
        <Separator />
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Total Cables:</span>
            <span>{cableStats.fiber + cableStats.copper + cableStats.coax}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Layers:</span>
            <span>{Object.values(layers).filter(Boolean).length} / {Object.keys(layers).length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};