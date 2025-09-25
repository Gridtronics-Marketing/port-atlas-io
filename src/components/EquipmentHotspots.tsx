import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Building, Box, Zap, Activity, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Equipment {
  id: string;
  type: 'frame' | 'junction_box' | 'device';
  name: string;
  floor: number;
  room?: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  capacity?: {
    used: number;
    total: number;
  };
  lastSeen?: string;
  coordinates: {
    x: number;
    y: number;
  };
  details?: {
    model?: string;
    manufacturer?: string;
    ipAddress?: string;
    macAddress?: string;
  };
}

interface EquipmentHotspotsProps {
  equipment: Equipment[];
  onEquipmentClick: (equipment: Equipment) => void;
  showLabels?: boolean;
  showCapacity?: boolean;
  showStatus?: boolean;
}

export const EquipmentHotspots: React.FC<EquipmentHotspotsProps> = ({
  equipment,
  onEquipmentClick,
  showLabels = true,
  showCapacity = false,
  showStatus = true
}) => {
  const [hoveredEquipment, setHoveredEquipment] = useState<string | null>(null);

  const getStatusIcon = (status: Equipment['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'error': return <XCircle className="h-3 w-3 text-red-500" />;
      default: return <XCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'online': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getEquipmentIcon = (type: Equipment['type']) => {
    switch (type) {
      case 'frame': return <Building className="h-4 w-4" />;
      case 'junction_box': return <Box className="h-4 w-4" />;
      case 'device': return <Zap className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const getCapacityColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const renderEquipmentHotspot = (eq: Equipment) => {
    const isHovered = hoveredEquipment === eq.id;
    
    return (
      <Popover key={eq.id}>
        <PopoverTrigger asChild>
          <div
            className={`absolute cursor-pointer transition-all duration-200 animate-scale-in ${
              isHovered ? 'z-20 scale-110' : 'z-10'
            }`}
            style={{
              left: `${eq.coordinates.x}%`,
              top: `${eq.coordinates.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseEnter={() => setHoveredEquipment(eq.id)}
            onMouseLeave={() => setHoveredEquipment(null)}
            onClick={() => onEquipmentClick(eq)}
          >
            {/* Equipment Hotspot */}
            <div className={`
              relative flex items-center justify-center w-8 h-8 rounded-full border-2 
              ${getStatusColor(eq.status)} 
              hover:shadow-lg transition-all duration-200
              ${isHovered ? 'animate-pulse' : ''}
            `}>
              {getEquipmentIcon(eq.type)}
              
              {/* Status Indicator */}
              {showStatus && (
                <div className="absolute -top-1 -right-1">
                  {getStatusIcon(eq.status)}
                </div>
              )}
              
              {/* Capacity Ring */}
              {showCapacity && eq.capacity && (
                <div 
                  className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{
                    background: `conic-gradient(
                      ${eq.capacity.used / eq.capacity.total >= 0.9 ? '#ef4444' : 
                        eq.capacity.used / eq.capacity.total >= 0.75 ? '#f59e0b' : '#10b981'} 
                      ${(eq.capacity.used / eq.capacity.total) * 360}deg, 
                      transparent 0deg
                    )`,
                    mask: 'radial-gradient(circle, transparent 6px, black 7px)',
                    WebkitMask: 'radial-gradient(circle, transparent 6px, black 7px)'
                  }}
                />
              )}
            </div>

            {/* Equipment Label */}
            {showLabels && (
              <div className={`
                absolute top-10 left-1/2 transform -translate-x-1/2 
                bg-white border rounded px-2 py-1 text-xs font-medium shadow-sm
                transition-opacity duration-200
                ${isHovered ? 'opacity-100' : 'opacity-80'}
              `}>
                {eq.name}
              </div>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-80" side="right">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getEquipmentIcon(eq.type)}
              <h4 className="font-medium">{eq.name}</h4>
              {getStatusIcon(eq.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <div className="font-medium capitalize">{eq.type.replace('_', ' ')}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Floor:</span>
                <div className="font-medium">{eq.floor}</div>
              </div>
              {eq.room && (
                <div>
                  <span className="text-muted-foreground">Room:</span>
                  <div className="font-medium">{eq.room}</div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={eq.status === 'online' ? 'default' : 'destructive'}>
                  {eq.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {eq.capacity && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className={getCapacityColor(eq.capacity.used, eq.capacity.total)}>
                    {eq.capacity.used} / {eq.capacity.total}
                  </span>
                </div>
                <Progress 
                  value={(eq.capacity.used / eq.capacity.total) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {eq.details && (
              <div className="space-y-1 text-xs">
                {eq.details.model && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span>{eq.details.model}</span>
                  </div>
                )}
                {eq.details.ipAddress && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP:</span>
                    <span className="font-mono">{eq.details.ipAddress}</span>
                  </div>
                )}
                {eq.details.macAddress && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MAC:</span>
                    <span className="font-mono">{eq.details.macAddress}</span>
                  </div>
                )}
              </div>
            )}

            {eq.lastSeen && (
              <div className="text-xs text-muted-foreground">
                Last seen: {new Date(eq.lastSeen).toLocaleString()}
              </div>
            )}

            <Button size="sm" className="w-full" onClick={() => onEquipmentClick(eq)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="relative w-full h-full">
      {equipment.map(renderEquipmentHotspot)}
    </div>
  );
};