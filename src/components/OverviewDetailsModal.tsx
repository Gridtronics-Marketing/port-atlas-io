import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, Cable, Network, Trash2, Edit } from 'lucide-react';
import { BackboneCable } from '@/hooks/useBackboneCables';
import { DistributionFrame } from '@/hooks/useDistributionFrames';

interface OverviewDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floor: number | null;
  frames: DistributionFrame[];
  cables: BackboneCable[];
  onEditFrame: (frame: DistributionFrame) => void;
  onEditCable: (cable: BackboneCable) => void;
  onDeleteFrame: (id: string, label: string) => void;
  onDeleteCable: (id: string, label: string) => void;
}

export const OverviewDetailsModal: React.FC<OverviewDetailsModalProps> = ({
  open,
  onOpenChange,
  floor,
  frames,
  cables,
  onEditFrame,
  onEditCable,
  onDeleteFrame,
  onDeleteCable
}) => {
  if (!floor) return null;

  const floorFrames = frames.filter(f => f.floor === floor);
  const floorCables = cables.filter(
    c => c.origin_floor === floor || c.destination_floor === floor
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Floor {floor} - Infrastructure Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{floorFrames.length}</div>
                <div className="text-sm text-muted-foreground">Distribution Frames</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{floorCables.length}</div>
                <div className="text-sm text-muted-foreground">Cable Connections</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {floorFrames.reduce((sum, f) => sum + (f.port_count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Ports</div>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Frames */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Distribution Frames ({floorFrames.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {floorFrames.map(frame => (
                <div key={frame.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Network className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{frame.frame_type}</div>
                      {frame.room && (
                        <div className="text-sm text-muted-foreground">Room: {frame.room}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {frame.port_count} ports, Capacity: {frame.capacity}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={frame.frame_type === 'MDF' ? 'default' : 'secondary'}>
                      {frame.frame_type}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditFrame(frame)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteFrame(frame.id, `${frame.frame_type} - Floor ${frame.floor}`)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {floorFrames.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No distribution frames on this floor.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cable className="h-4 w-4" />
                Cable Connections ({floorCables.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {floorCables.map(cable => (
                <div key={cable.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Cable className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{cable.cable_label}</div>
                      <div className="text-sm text-muted-foreground">
                        {cable.origin_equipment || 'Unknown'} → {cable.destination_equipment || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Floor {cable.origin_floor} → Floor {cable.destination_floor}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`bg-${cable.cable_type === 'fiber' ? 'blue' : cable.cable_type === 'copper' ? 'orange' : 'gray'}-500`}>
                      {cable.cable_type.toUpperCase()}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditCable(cable)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteCable(cable.id, cable.cable_label)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {floorCables.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No cable connections on this floor.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};