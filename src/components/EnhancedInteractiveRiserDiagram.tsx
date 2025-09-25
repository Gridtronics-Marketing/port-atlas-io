import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DiagramLayerControls } from '@/components/DiagramLayerControls';
import { EquipmentHotspots } from '@/components/EquipmentHotspots';
import { CapacityUtilizationOverlay } from '@/components/CapacityUtilizationOverlay';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { Layers, Maximize, Minimize, Settings, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useBackboneCables } from '@/hooks/useBackboneCables';
import { useDistributionFrames } from '@/hooks/useDistributionFrames';
import { useJunctionBoxes } from '@/hooks/useJunctionBoxes';

interface EnhancedInteractiveRiserDiagramProps {
  locationId: string;
  locationName: string;
  height?: number;
}

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

export const EnhancedInteractiveRiserDiagram: React.FC<EnhancedInteractiveRiserDiagramProps> = ({
  locationId,
  locationName,
  height = 600
}) => {
  const { cables, loading: cablesLoading } = useBackboneCables(locationId);
  const { frames, loading: framesLoading } = useDistributionFrames(locationId);
  const { junctionBoxes, loading: junctionLoading } = useJunctionBoxes(locationId);
  
  const [showLayerControls, setShowLayerControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  
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

  // Mock data for demonstration
  const equipmentData = [
    ...frames.map(frame => ({
      id: frame.id,
      type: 'frame' as const,
      name: `${frame.frame_type} - Floor ${frame.floor}`,
      floor: frame.floor,
      room: frame.room,
      status: 'online' as const,
      capacity: {
        used: frame.port_count,
        total: frame.capacity
      },
      coordinates: {
        x: 20 + (frame.floor * 15),
        y: 30 + (frame.floor * 20)
      },
      details: {
        model: 'Cisco 2960X',
        manufacturer: 'Cisco',
        ipAddress: `192.168.${frame.floor}.1`
      }
    })),
    ...junctionBoxes.map((box, index) => ({
      id: box.id,
      type: 'junction_box' as const,
      name: box.label,
      floor: box.floor,
      status: 'online' as const,
      coordinates: {
        x: 60 + (index * 10),
        y: 40 + (box.floor * 15)
      }
    }))
  ];

  const capacityData = [
    ...cables.map((cable, index) => ({
      id: cable.id,
      name: cable.cable_label,
      type: 'cable' as const,
      utilized: cable.capacity_used || 0,
      total: cable.capacity_total || 100,
      coordinates: {
        x: 40 + (index * 20),
        y: 50 + ((cable.origin_floor || 1) * 25)
      },
      trend: 'stable' as const,
      alertLevel: 'none' as const
    })),
    ...frames.map((frame, index) => ({
      id: frame.id,
      name: `${frame.frame_type} - Floor ${frame.floor}`,
      type: 'frame' as const,
      utilized: frame.port_count,
      total: frame.capacity,
      coordinates: {
        x: 20 + (frame.floor * 15),
        y: 30 + (frame.floor * 20)
      },
      trend: 'increasing' as const
    }))
  ];

  const cableStats = {
    fiber: cables.filter(c => c.cable_type === 'fiber').length,
    copper: cables.filter(c => c.cable_type === 'copper').length,
    coax: cables.filter(c => c.cable_type === 'coax').length
  };

  const equipmentStats = {
    frames: frames.length,
    junctionBoxes: junctionBoxes.length
  };

  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        // Refresh data - in real app, would refetch from API
        console.log('Refreshing diagram data...');
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const handleLayerToggle = (layer: keyof LayerState, enabled: boolean) => {
    setLayers(prev => ({ ...prev, [layer]: enabled }));
  };

  const handleEquipmentClick = (equipment: any) => {
    setSelectedEquipment(equipment);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const filteredCables = cables.filter(cable => {
    if (cable.cable_type === 'fiber' && !layers.fiber) return false;
    if (cable.cable_type === 'copper' && !layers.copper) return false;
    if (cable.cable_type === 'coax' && !layers.coax) return false;
    return true;
  });

  const filteredEquipment = equipmentData.filter(eq => {
    if (eq.type === 'frame' && !layers.equipment) return false;
    if (eq.type === 'junction_box' && !layers.junctionBoxes) return false;
    return true;
  });

  if (cablesLoading || framesLoading || junctionLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading enhanced riser diagram...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Enhanced Riser Diagram - {locationName}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLayerControls(!showLayerControls)}
              >
                {showLayerControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          
          {/* Status Bar */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{equipmentData.filter(eq => eq.status === 'online').length} Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{equipmentData.filter(eq => eq.status !== 'online').length} Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{filteredCables.length} Cables</span>
            </div>
            {layers.capacityOverlay && (
              <Badge variant="outline" className="text-xs">
                Capacity Overlay Active
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0 relative">
          <div className="flex">
            {/* Layer Controls */}
            {showLayerControls && (
              <div className="absolute left-4 top-4 z-20">
                <DiagramLayerControls
                  onLayerToggle={handleLayerToggle}
                  cableStats={cableStats}
                  equipmentStats={equipmentStats}
                />
              </div>
            )}

            {/* Main Diagram Area */}
            <div 
              className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 border-l"
              style={{ height: isFullscreen ? 'calc(100vh - 140px)' : height }}
            >
              {/* Floor Labels */}
              {layers.floorLabels && (
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gray-200/50 border-r">
                  {[1, 2, 3, 4, 5].map(floor => (
                    <div 
                      key={floor}
                      className="absolute text-sm font-medium text-gray-600 transform -rotate-90"
                      style={{ 
                        top: `${20 + floor * 15}%`,
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-90deg)'
                      }}
                    >
                      Floor {floor}
                    </div>
                  ))}
                </div>
              )}

              {/* Cable Runs */}
              <div className="absolute inset-0" style={{ marginLeft: layers.floorLabels ? '64px' : '0' }}>
                {/* Render cable paths */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {filteredCables.map((cable, index) => {
                    const startY = 30 + ((cable.origin_floor || 1) * 20);
                    const endY = 30 + ((cable.destination_floor || 2) * 20);
                    const x = 40 + (index * 20);
                    
                    const color = cable.cable_type === 'fiber' ? '#3b82f6' : 
                                 cable.cable_type === 'copper' ? '#f97316' : '#10b981';
                    
                    return (
                      <g key={cable.id}>
                        <line
                          x1={`${x}%`}
                          y1={`${startY}%`}
                          x2={`${x}%`}
                          y2={`${endY}%`}
                          stroke={color}
                          strokeWidth="3"
                          className="animate-fade-in"
                        />
                        <circle
                          cx={`${x}%`}
                          cy={`${startY}%`}
                          r="4"
                          fill={color}
                        />
                        <circle
                          cx={`${x}%`}
                          cy={`${endY}%`}
                          r="4"
                          fill={color}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Equipment Hotspots */}
                {layers.equipment || layers.junctionBoxes ? (
                  <EquipmentHotspots
                    equipment={filteredEquipment}
                    onEquipmentClick={handleEquipmentClick}
                    showLabels={true}
                    showCapacity={layers.capacityOverlay}
                    showStatus={layers.statusIndicators}
                  />
                ) : null}

                {/* Capacity Overlay */}
                {layers.capacityOverlay && (
                  <CapacityUtilizationOverlay
                    capacityData={capacityData.filter(item => {
                      if (item.type === 'cable') {
                        const cable = cables.find(c => c.id === item.id);
                        return cable && layers[cable.cable_type as keyof LayerState];
                      }
                      if (item.type === 'frame') return layers.equipment;
                      return true;
                    })}
                    showTrends={true}
                    showAlerts={true}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Equipment Details Panel */}
          {selectedEquipment && (
            <div className="absolute bottom-4 right-4 z-20">
              <Card className="w-80 max-h-96 overflow-auto">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{selectedEquipment.name}</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSelectedEquipment(null)}
                    >
                      ×
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="font-medium capitalize">{selectedEquipment.type.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Floor:</span>
                      <div className="font-medium">{selectedEquipment.floor}</div>
                    </div>
                    {selectedEquipment.room && (
                      <div>
                        <span className="text-muted-foreground">Room:</span>
                        <div className="font-medium">{selectedEquipment.room}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedEquipment.status === 'online' ? 'default' : 'destructive'}>
                        {selectedEquipment.status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {selectedEquipment.capacity && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span>{selectedEquipment.capacity.used} / {selectedEquipment.capacity.total}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <QRCodeDisplay
                      type="distribution_frame"
                      id={selectedEquipment.id}
                      locationId={locationId}
                      label={selectedEquipment.name}
                      size="sm"
                      showButtons={false}
                    />
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};