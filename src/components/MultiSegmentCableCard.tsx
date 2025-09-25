import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ChevronDown, ChevronRight, Cable, Trash2, ArrowRight, Building2, Zap } from 'lucide-react';
import { BackboneCable } from '@/hooks/useBackboneCables';
import { CableSegment } from '@/hooks/useCableSegments';

interface MultiSegmentCableCardProps {
  cable: BackboneCable;
  segments: CableSegment[];
  onDelete: (id: string) => void;
  onDeleteSegment?: (segmentId: string) => void;
}

export const MultiSegmentCableCard: React.FC<MultiSegmentCableCardProps> = ({
  cable,
  segments,
  onDelete,
  onDeleteSegment
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCableTypeIcon = (type: string) => {
    return <Cable className="h-4 w-4" />;
  };

  const getCableTypeColor = (type: string) => {
    switch (type) {
      case 'fiber': return 'text-blue-600';
      case 'copper': return 'text-orange-600';
      case 'coax': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getEquipmentIcon = (equipmentName: string) => {
    const isMdf = equipmentName.toLowerCase().includes('mdf');
    const isIdf = equipmentName.toLowerCase().includes('idf');
    
    if (isMdf || isIdf) {
      return <Building2 className="h-3 w-3" />;
    }
    return <Zap className="h-3 w-3" />;
  };

  const renderPath = () => {
    if (!segments.length) return cable.origin_equipment + ' → ' + cable.destination_equipment;
    
    const sortedSegments = [...segments].sort((a, b) => a.segment_order - b.segment_order);
    const pathParts = [sortedSegments[0].origin_equipment];
    
    sortedSegments.forEach(segment => {
      pathParts.push(segment.destination_equipment);
    });
    
    return pathParts.join(' → ');
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <div className={getCableTypeColor(cable.cable_type)}>
                {getCableTypeIcon(cable.cable_type)}
              </div>
              <span className="font-medium">{cable.cable_label}</span>
              <Badge variant="outline" className="text-xs">
                {cable.total_segments} segments
              </Badge>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Multi-Segment Cable</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the entire cable run and all {cable.total_segments} segments. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(cable.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Cable
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1 flex-wrap">
            <span>Path:</span>
            <span className="font-mono">{renderPath()}</span>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Cable Type:</span> {cable.cable_type}
                {cable.cable_subtype && <span> ({cable.cable_subtype})</span>}
              </div>
              <div>
                <span className="font-medium">Capacity:</span> {cable.capacity_used || 0}/{cable.capacity_total || 'N/A'}
              </div>
            </div>

            {segments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Cable className="h-4 w-4" />
                  Cable Segments
                </h4>
                <div className="space-y-2">
                  {[...segments].sort((a, b) => a.segment_order - b.segment_order).map((segment) => (
                    <div key={segment.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2 flex-1">
                        <Badge variant="outline" className="text-xs">
                          {segment.segment_order}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm">
                          {getEquipmentIcon(segment.origin_equipment)}
                          <span>{segment.origin_equipment}</span>
                          <ArrowRight className="h-3 w-3 mx-1" />
                          {getEquipmentIcon(segment.destination_equipment)}
                          <span>{segment.destination_equipment}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {segment.segment_label}
                        </Badge>
                      </div>
                      
                      {onDeleteSegment && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive ml-2">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Cable Segment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete segment {segment.segment_label}? This may affect the cable routing.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDeleteSegment(segment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Segment
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cable.notes && (
              <div className="text-sm">
                <span className="font-medium">Notes:</span> {cable.notes}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};