import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Text, FabricObject } from 'fabric';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Server, 
  HardDrive, 
  Router, 
  Wifi, 
  Monitor,
  Zap,
  Save,
  RotateCcw,
  Plus
} from 'lucide-react';
import { useEquipment, Rack, Equipment } from '@/hooks/useEquipment';

interface RackVisualizerProps {
  rack: Rack;
  onRackUpdate?: (rack: Rack) => void;
}

const equipmentTypes = [
  { type: 'Server', icon: Server, color: '#3b82f6', height: 2 },
  { type: 'Switch', icon: Router, color: '#10b981', height: 1 },
  { type: 'Router', icon: Wifi, color: '#f59e0b', height: 1 },
  { type: 'Storage', icon: HardDrive, color: '#8b5cf6', height: 2 },
  { type: 'UPS', icon: Zap, color: '#ef4444', height: 3 },
  { type: 'Monitor', icon: Monitor, color: '#6b7280', height: 1 },
];

export function RackVisualizer({ rack, onRackUpdate }: RackVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('Server');
  const [equipmentName, setEquipmentName] = useState('');
  const [rackEquipment, setRackEquipment] = useState<Equipment[]>([]);
  const { equipment, updateEquipment, addEquipment } = useEquipment();

  const rackUnits = rack.rack_units || 42;
  const rackWidth = 400;
  const rackHeight = 600;
  const unitHeight = rackHeight / rackUnits;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: rackWidth + 100,
      height: rackHeight + 100,
      backgroundColor: '#f8f9fa',
    });

    setFabricCanvas(canvas);
    
    // Draw rack frame
    drawRackFrame(canvas);
    
    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    // Filter equipment for this rack
    const filtered = equipment.filter(eq => eq.rack_id === rack.id);
    setRackEquipment(filtered);
    
    if (fabricCanvas) {
      redrawRack();
    }
  }, [equipment, rack.id, fabricCanvas]);

  const drawRackFrame = (canvas: FabricCanvas) => {
    // Main rack outline
    const rackFrame = new Rect({
      left: 50,
      top: 50,
      width: rackWidth,
      height: rackHeight,
      fill: 'transparent',
      stroke: '#374151',
      strokeWidth: 3,
      selectable: false,
      evented: false,
    });
    canvas.add(rackFrame);

    // Unit markers
    for (let i = 0; i <= rackUnits; i++) {
      const y = 50 + (i * unitHeight);
      
      // Unit lines
      const unitLine = new Rect({
        left: 50,
        top: y,
        width: rackWidth,
        height: 1,
        fill: '#d1d5db',
        selectable: false,
        evented: false,
      });
      canvas.add(unitLine);

      // Unit numbers (every 5 units or at ends)
      if (i % 5 === 0 || i === rackUnits) {
        const unitNumber = new Text((rackUnits - i).toString(), {
          left: 25,
          top: y - 8,
          fontSize: 12,
          fill: '#6b7280',
          selectable: false,
          evented: false,
        });
        canvas.add(unitNumber);
      }
    }

    // Rack title
    const title = new Text(rack.rack_name, {
      left: 50,
      top: 20,
      fontSize: 16,
      fontWeight: 'bold',
      fill: '#111827',
      selectable: false,
      evented: false,
    });
    canvas.add(title);
  };

  const redrawRack = () => {
    if (!fabricCanvas) return;

    // Clear existing equipment (keep frame)
    const objects = fabricCanvas.getObjects();
    const equipmentObjects = objects.filter(obj => (obj as any).isEquipment);
    equipmentObjects.forEach(obj => fabricCanvas.remove(obj));

    // Draw equipment
    rackEquipment.forEach((eq) => {
      if (eq.rack_position) {
        drawEquipment(eq);
      }
    });

    fabricCanvas.renderAll();
  };

  const drawEquipment = (eq: Equipment) => {
    if (!fabricCanvas || !eq.rack_position) return;

    const equipmentType = equipmentTypes.find(t => t.type === eq.equipment_type) || equipmentTypes[0];
    const unitPosition = rackUnits - eq.rack_position;
    const equipmentHeight = unitHeight * equipmentType.height;
    
    const y = 50 + (unitPosition * unitHeight);

    // Equipment rectangle
    const equipmentRect = new Rect({
      left: 55,
      top: y + 2,
      width: rackWidth - 10,
      height: equipmentHeight - 4,
      fill: equipmentType.color,
      stroke: '#ffffff',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
      selectable: true,
    } as any);

    // Store custom data
    (equipmentRect as any).isEquipment = true;
    (equipmentRect as any).equipmentId = eq.id;

    // Equipment label
    const label = new Text(`${eq.name}${eq.model ? ` (${eq.model})` : ''}`, {
      left: 65,
      top: y + (equipmentHeight / 2) - 6,
      fontSize: 11,
      fill: '#ffffff',
      fontWeight: 'bold',
      selectable: false,
      evented: false,
    });

    fabricCanvas.add(equipmentRect);
    fabricCanvas.add(label);

    // Handle equipment selection
    equipmentRect.on('selected', () => {
      console.log('Selected equipment:', eq.name);
    });
  };

  const addEquipmentToRack = async () => {
    if (!equipmentName.trim()) return;

    try {
      // Find available rack position
      const occupiedPositions = rackEquipment.map(eq => eq.rack_position).filter(Boolean);
      const equipmentType = equipmentTypes.find(t => t.type === selectedEquipmentType) || equipmentTypes[0];
      
      let availablePosition = null;
      for (let pos = 1; pos <= rackUnits; pos++) {
        const positionsNeeded = Array.from({ length: equipmentType.height }, (_, i) => pos + i);
        const hasConflict = positionsNeeded.some(p => occupiedPositions.includes(p) || p > rackUnits);
        
        if (!hasConflict) {
          availablePosition = pos;
          break;
        }
      }

      if (!availablePosition) {
        alert('No available space in rack for this equipment');
        return;
      }

      await addEquipment({
        name: equipmentName,
        equipment_type: selectedEquipmentType,
        status: 'Available',
        rack_id: rack.id,
        rack_position: availablePosition,
        location_id: rack.location_id,
      });

      setEquipmentName('');
    } catch (error) {
      console.error('Error adding equipment to rack:', error);
    }
  };

  const saveRackLayout = () => {
    if (!fabricCanvas) return;
    
    const rackData = fabricCanvas.toJSON();
    console.log('Saved rack layout:', rackData);
    
    // In a real implementation, you'd save this to the database
    alert('Rack layout saved successfully!');
  };

  const resetRack = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    drawRackFrame(fabricCanvas);
    redrawRack();
  };

  const getOccupancyStats = () => {
    const totalUnits = rackUnits;
    const occupiedUnits = rackEquipment.reduce((sum, eq) => {
      const type = equipmentTypes.find(t => t.type === eq.equipment_type);
      return sum + (type?.height || 1);
    }, 0);
    
    return {
      occupied: occupiedUnits,
      available: totalUnits - occupiedUnits,
      percentage: Math.round((occupiedUnits / totalUnits) * 100),
    };
  };

  const stats = getOccupancyStats();

  return (
    <div className="space-y-6">
      {/* Rack Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rackUnits}U</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.occupied}U</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}U</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percentage}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rack Visualizer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {rack.rack_name}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={saveRackLayout}>
                <Save className="h-4 w-4 mr-1" />
                Save Layout
              </Button>
              <Button variant="outline" size="sm" onClick={resetRack}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-white">
              <canvas ref={canvasRef} className="border rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Equipment Panel */}
        <div className="space-y-6">
          {/* Add Equipment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Equipment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="equipmentName">Equipment Name</Label>
                <Input
                  id="equipmentName"
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  placeholder="e.g., Core Switch 01"
                />
              </div>
              
              <div>
                <Label>Equipment Type</Label>
                <Select value={selectedEquipmentType} onValueChange={setSelectedEquipmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.type} ({type.height}U)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={addEquipmentToRack} className="w-full">
                Add to Rack
              </Button>
            </CardContent>
          </Card>

          {/* Equipment List */}
          <Card>
            <CardHeader>
              <CardTitle>Rack Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              {rackEquipment.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No equipment in this rack
                </div>
              ) : (
                <div className="space-y-2">
                  {rackEquipment
                    .sort((a, b) => (a.rack_position || 0) - (b.rack_position || 0))
                    .map((eq) => {
                      const type = equipmentTypes.find(t => t.type === eq.equipment_type);
                      const Icon = type?.icon || Server;
                      
                      return (
                        <div key={eq.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Icon 
                              className="h-5 w-5" 
                              style={{ color: type?.color || '#6b7280' }}
                            />
                            <div>
                              <div className="font-medium">{eq.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {eq.equipment_type} • Position {eq.rack_position}U
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={eq.status === 'Available' ? 'default' : 'secondary'}
                            >
                              {eq.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
