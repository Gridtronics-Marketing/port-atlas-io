import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Network, Zap, Cable, Download, Building, Box, Trash2, Edit } from 'lucide-react';
import { useBackboneCables } from '@/hooks/useBackboneCables';
import { useCableSegments } from '@/hooks/useCableSegments';
import { useDistributionFrames } from '@/hooks/useDistributionFrames';
import { useJunctionBoxes } from '@/hooks/useJunctionBoxes';
import { InteractiveRiserDiagram } from '@/components/InteractiveRiserDiagram';
import { AddDistributionFrameModal } from '@/components/AddDistributionFrameModal';
import { AddBackboneCableModal } from '@/components/AddBackboneCableModal';
import { AddJunctionBoxModal } from '@/components/AddJunctionBoxModal';
import { AddRiserPathwayModal } from '@/components/AddRiserPathwayModal';
import { MultiSegmentCableCard } from '@/components/MultiSegmentCableCard';
import { RiserDiagramPDFExporter } from '@/components/RiserDiagramPDFExporter';
import { RiserFloorPlanToggle } from '@/components/RiserFloorPlanToggle';
import { RiserWorkOrderIntegration } from '@/components/RiserWorkOrderIntegration';
import { OverviewDetailsModal } from '@/components/OverviewDetailsModal';
import { BackboneCableDetailsModal } from '@/components/BackboneCableDetailsModal';
import { DistributionFrameDetailsModal } from '@/components/DistributionFrameDetailsModal';
import { DevicesEndpointsTab } from '@/components/DevicesEndpointsTab';
import { VLANsTab } from '@/components/VLANsTab';
import { PatchPanelsTab } from '@/components/PatchPanelsTab';
import { CapacityTab } from '@/components/CapacityTab';
import { DocumentationTab } from '@/components/DocumentationTab';
import { EnhancedExportManager } from '@/components/EnhancedExportManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RiserDiagramViewerProps {
  locationId: string;
  locationName: string;
}

export const RiserDiagramViewer: React.FC<RiserDiagramViewerProps> = ({
  locationId,
  locationName
}) => {
  const { cables, loading: cablesLoading, fetchCables, deleteCable } = useBackboneCables(locationId);
  const { segments, loading: segmentsLoading, deleteSegment } = useCableSegments();
  const { frames, loading: framesLoading, fetchFrames, deleteFrame } = useDistributionFrames(locationId);
  const { junctionBoxes, loading: junctionLoading, deleteJunctionBox } = useJunctionBoxes(locationId);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [showAddFrame, setShowAddFrame] = useState(false);
  const [showAddCable, setShowAddCable] = useState(false);
  const [showAddJunction, setShowAddJunction] = useState(false);
  const [selectedCableForJunction, setSelectedCableForJunction] = useState<string | null>(null);
  const [showAddPathway, setShowAddPathway] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'cable' | 'frame' | 'junction', label: string} | null>(null);
  
  // Detail modal states
  const [showOverviewDetails, setShowOverviewDetails] = useState(false);
  const [showCableDetails, setShowCableDetails] = useState(false);
  const [showFrameDetails, setShowFrameDetails] = useState(false);
  const [selectedCable, setSelectedCable] = useState<any>(null);
  const [selectedFrame, setSelectedFrame] = useState<any>(null);

  // Get unique floors from frames and cables
  const floors = Array.from(
    new Set([
      ...frames.map(f => f.floor),
      ...cables.flatMap(c => [c.origin_floor, c.destination_floor].filter(Boolean))
    ])
  ).sort((a, b) => (b || 0) - (a || 0));

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      switch (itemToDelete.type) {
        case 'cable':
          await deleteCable(itemToDelete.id);
          break;
        case 'frame':
          await deleteFrame(itemToDelete.id);
          break;
        case 'junction':
          await deleteJunctionBox(itemToDelete.id);
          break;
      }
      await fetchCables();
      await fetchFrames();
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteClick = (id: string, type: 'cable' | 'frame' | 'junction', label: string) => {
    setItemToDelete({ id, type, label });
    setDeleteDialogOpen(true);
  };

  const handleEditCable = (cable: any) => {
    setSelectedCable(cable);
    setShowCableDetails(true);
  };

  const handleEditFrame = (frame: any) => {
    setSelectedFrame(frame);
    setShowFrameDetails(true);
  };

  const handleOverviewDetails = (floor: number) => {
    setSelectedFloor(floor);
    setShowOverviewDetails(true);
  };

  const getCableTypeIcon = (type: string) => {
    switch (type) {
      case 'fiber': return <Zap className="h-4 w-4" />;
      case 'copper': return <Cable className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const getCableTypeColor = (type: string) => {
    switch (type) {
      case 'fiber': return 'bg-blue-500';
      case 'copper': return 'bg-orange-500';
      case 'coax': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCapacityStatus = (cable: any) => {
    if (!cable.capacity_total) return 'unknown';
    const utilization = (cable.capacity_used / cable.capacity_total) * 100;
    if (utilization < 50) return 'good';
    if (utilization < 80) return 'medium';
    return 'high';
  };

  if (cablesLoading || framesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading riser diagram...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Riser Diagram - {locationName}
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" className="gap-2" onClick={() => setShowAddFrame(true)}>
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAddCable(true)}>
            <Plus className="h-4 w-4" />
            Add Cable Run
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="physical" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="physical" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Physical Infrastructure
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network Infrastructure
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              Overview & Management
            </TabsTrigger>
          </TabsList>

          {/* Physical Infrastructure Tab */}
          <TabsContent value="physical" className="mt-6">
            <Tabs defaultValue="diagram" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="diagram">Interactive Diagram</TabsTrigger>
                <TabsTrigger value="cables">Backbone Cables</TabsTrigger>
                <TabsTrigger value="equipment">Distribution Frames</TabsTrigger>
                <TabsTrigger value="integration">Work Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="diagram" className="space-y-4">
                <RiserFloorPlanToggle 
                  locationId={locationId}
                  locationName={locationName}
                  onAddEquipment={() => setShowAddFrame(true)}
                  onAddCable={() => setShowAddCable(true)}
                  onAddJunctionBox={() => setShowAddJunction(true)}
                />
              </TabsContent>

              <TabsContent value="cables" className="space-y-4">
                <div className="space-y-4">
                  {/* Multi-segment cables */}
                  {cables.filter(cable => cable.is_multi_segment).map(cable => {
                    const cableSegments = segments.filter(segment => segment.cable_run_id === cable.id);
                    return (
                      <MultiSegmentCableCard
                        key={cable.id}
                        cable={cable}
                        segments={cableSegments}
                        onDelete={deleteCable}
                        onDeleteSegment={deleteSegment}
                      />
                    );
                  })}

                  {/* Simple cables */}
                  {cables.filter(cable => !cable.is_multi_segment).map(cable => (
                    <div key={cable.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getCableTypeIcon(cable.cable_type)}
                          <div>
                            <div className="font-medium">{cable.cable_label}</div>
                            <div className="text-sm text-muted-foreground">
                              {cable.origin_equipment || 'Unknown'} → {cable.destination_equipment || 'Unknown'}
                            </div>
                            {cable.cable_subtype && (
                              <div className="text-xs text-muted-foreground">
                                Subtype: {cable.cable_subtype}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getCableTypeColor(cable.cable_type)}>
                            {cable.cable_type.toUpperCase()}
                          </Badge>
                          {cable.jacket_rating && (
                            <Badge variant="outline">{cable.jacket_rating}</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCable(cable)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(cable.id, 'cable', cable.cable_label)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Origin:</span> Floor {cable.origin_floor}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Destination:</span> Floor {cable.destination_floor}
                        </div>
                        {cable.strand_count && (
                          <div>
                            <span className="text-muted-foreground">Strands:</span> {cable.strand_count}
                          </div>
                        )}
                        {cable.capacity_total && (
                          <div>
                            <span className="text-muted-foreground">Capacity:</span> {cable.capacity_used}/{cable.capacity_total}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {cables.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No backbone cables configured. Add cable runs to start building your riser diagram.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="equipment" className="space-y-4">
                <div className="space-y-3">
                  {frames.map(frame => (
                    <div key={frame.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Network className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{frame.frame_type} - Floor {frame.floor}</div>
                            {frame.room && (
                              <div className="text-sm text-muted-foreground">Room: {frame.room}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={frame.frame_type === 'MDF' ? 'default' : 'secondary'}>
                            {frame.frame_type}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditFrame(frame)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(frame.id, 'frame', `${frame.frame_type} - Floor ${frame.floor}`)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Port Count:</span> {frame.port_count}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Capacity:</span> {frame.capacity}
                        </div>
                        {frame.rack_position && (
                          <div>
                            <span className="text-muted-foreground">Rack Position:</span> {frame.rack_position}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {frames.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No distribution frames configured. Add MDF/IDF equipment to start mapping your network infrastructure.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="integration" className="space-y-4">
                <RiserWorkOrderIntegration 
                  locationId={locationId}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Network Infrastructure Tab */}
          <TabsContent value="network" className="mt-6">
            <Tabs defaultValue="devices" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="devices">Devices/Endpoints</TabsTrigger>
                <TabsTrigger value="vlans">VLANs</TabsTrigger>
                <TabsTrigger value="patches">Patch Panels</TabsTrigger>
                <TabsTrigger value="capacity">Capacity</TabsTrigger>
              </TabsList>

              <TabsContent value="devices" className="space-y-4">
                <DevicesEndpointsTab locationId={locationId} />
              </TabsContent>

              <TabsContent value="vlans" className="space-y-4">
                <VLANsTab locationId={locationId} />
              </TabsContent>

              <TabsContent value="patches" className="space-y-4">
                <PatchPanelsTab locationId={locationId} />
              </TabsContent>

              <TabsContent value="capacity" className="space-y-4">
                <CapacityTab locationId={locationId} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Overview & Management Tab */}
          <TabsContent value="management" className="mt-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
                <TabsTrigger value="changes">Change Log</TabsTrigger>
                <TabsTrigger value="export">Export & Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{cables.length}</div>
                      <div className="text-sm text-muted-foreground">Backbone Cables</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{frames.length}</div>
                      <div className="text-sm text-muted-foreground">Distribution Frames</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{floors.length}</div>
                      <div className="text-sm text-muted-foreground">Floors Served</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Floor Summary</h3>
                  {floors.map(floor => {
                    const floorFrames = frames.filter(f => f.floor === floor);
                    const floorCables = cables.filter(
                      c => c.origin_floor === floor || c.destination_floor === floor
                    );
                    
                    return (
                      <div key={floor} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Floor {floor}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {floorFrames.length} frames, {floorCables.length} cables
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOverviewDetails(floor)}
                        >
                          View Details
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="documentation" className="space-y-4">
                <DocumentationTab locationId={locationId} />
              </TabsContent>

              <TabsContent value="changes" className="space-y-4">
                {/* TODO: Add Change Log component */}
                <div className="text-center py-8 text-muted-foreground">
                  Change log functionality coming soon.
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-4">
                <EnhancedExportManager locationId={locationId} locationName={locationName} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <AddDistributionFrameModal 
        open={showAddFrame}
        onOpenChange={setShowAddFrame}
        locationId={locationId}
        onSuccess={() => {
          fetchFrames();
          fetchCables();
        }}
      />
      
      <AddBackboneCableModal 
        open={showAddCable}
        onOpenChange={setShowAddCable}
        locationId={locationId}
        onSuccess={() => {
          fetchCables();
          fetchFrames();
        }}
      />
      
      <AddJunctionBoxModal
        open={showAddJunction}
        onOpenChange={setShowAddJunction}
        locationId={locationId}
        cableId={selectedCableForJunction || null}
        onSuccess={() => {
          fetchCables();
          fetchFrames();
        }}
      />
      
      <AddRiserPathwayModal 
        open={showAddPathway}
        onOpenChange={setShowAddPathway}
        locationId={locationId}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.label}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Modals */}
      <OverviewDetailsModal
        open={showOverviewDetails}
        onOpenChange={setShowOverviewDetails}
        floor={selectedFloor}
        frames={frames}
        cables={cables}
        onEditFrame={handleEditFrame}
        onEditCable={handleEditCable}
        onDeleteFrame={(id, label) => handleDeleteClick(id, 'frame', label)}
        onDeleteCable={(id, label) => handleDeleteClick(id, 'cable', label)}
      />

      <BackboneCableDetailsModal
        open={showCableDetails}
        onOpenChange={setShowCableDetails}
        cable={selectedCable}
        onSuccess={() => {
          fetchCables();
          fetchFrames();
        }}
      />

      <DistributionFrameDetailsModal
        open={showFrameDetails}
        onOpenChange={setShowFrameDetails}
        frame={selectedFrame}
        onSuccess={() => {
          fetchFrames();
          fetchCables();
        }}
      />
    </Card>
  );
};