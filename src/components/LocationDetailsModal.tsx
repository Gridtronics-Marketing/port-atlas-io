import { useState, useEffect } from "react";
import {
  MapPin, 
  Cable, 
  Plus, 
  Camera, 
  FileText, 
  Users, 
  Building2,
  Phone,
  User,
  Calendar,
  Layers,
  Square,
  Info,
  Trash2,
  Settings2,
  Share2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveMap } from "@/components/InteractiveMap";
import { DropPointList } from "@/components/DropPointList";
import { FloorPlanViewer } from "@/components/FloorPlanViewer";
import { RiserDiagramViewer } from "@/components/RiserDiagramViewer";
import { RiserDiagramLibrary } from "@/components/RiserDiagramLibrary";
import { CreateRiserDiagramModal } from "@/components/CreateRiserDiagramModal";
import { ScheduleAssignmentModal } from "@/components/ScheduleAssignmentModal";
import { AddLocationNoteModal } from "@/components/AddLocationNoteModal";
import { WalkThroughNotesList } from "@/components/WalkThroughNotesList";
import { CustomerNotesPanel } from "@/components/CustomerNotesPanel";
import { InfrastructureTopologyView } from "@/components/InfrastructureTopologyView";

import { FloorPlanRepairTool } from "@/components/FloorPlanRepairTool";
import { FloorPlanFileManager } from "@/components/FloorPlanFileManager";
import { InteractiveFloorPlan } from "@/components/InteractiveFloorPlan";
import { FloorBuildingManager } from "@/components/FloorBuildingManager";
import { getFloorPlanUrls, getStorageUrl, getFloorPlanImagePath, getAllFloorPlanUrls, getFloorPlanMetadata } from "@/lib/storage-utils";
import { useLocationTeam } from "@/hooks/useLocationTeam";
import { useLocationNotes } from "@/hooks/useLocationNotes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { type Location } from "@/hooks/useLocations";

interface LocationDetailsModalProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditLocation?: (location: Location) => void;
  onDeleteLocation?: (id: string) => void;
  onLocationUpdate?: () => void; // Callback to refresh location data
}

export const LocationDetailsModal = ({ location, open, onOpenChange, onEditLocation, onDeleteLocation, onLocationUpdate }: LocationDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [selectedFloorKey, setSelectedFloorKey] = useState<string>("1");
  const [allFloorPlanUrls, setAllFloorPlanUrls] = useState<Record<string, string>>({});
  const [riserDiagramUrl, setRiserDiagramUrl] = useState<string | null>(null);
  const [showAddFloorPlanModal, setShowAddFloorPlanModal] = useState(false);
  const [showAddRiserModal, setShowAddRiserModal] = useState(false);
  const [showFloorManager, setShowFloorManager] = useState(false);

  // Fetch team members for this location
  const { teamMembers, loading: teamLoading, refetch: refetchTeam } = useLocationTeam(location?.id);

  // Schedule assignment modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Add note modal state
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  // Fetch location notes
  const { notes, loading: notesLoading, refetch: refetchNotes } = useLocationNotes(location?.id);

  // Check if floor plans exist and get their URLs
  useEffect(() => {
    const loadFloorPlans = async () => {
      if (!location?.floor_plan_files) {
        setAllFloorPlanUrls({});
        setRiserDiagramUrl(null);
        return;
      }

      // Use the utility function to generate URLs for all floors including outbuildings
      const urls = await getAllFloorPlanUrls(location.floor_plan_files);
      setAllFloorPlanUrls(urls);
      
      // Check for riser diagram (stored with key 'riser' or 'riser_diagram')
      const riserFile = location.floor_plan_files['riser'] || location.floor_plan_files['riser_diagram'];
      if (riserFile) {
        const riserUrl = await getSignedStorageUrl('floor-plans', typeof riserFile === 'string' ? riserFile : riserFile.image_path);
        setRiserDiagramUrl(riserUrl);
      } else {
        setRiserDiagramUrl(null);
      }
    };

    if (open && location) {
      loadFloorPlans();
    }
  }, [location, location?.floor_plan_files, open]);

  // Listen for floor plan upload events for real-time updates
  useEffect(() => {
    const handleFloorPlanSavedEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { locationId, floorNumber, filePath } = customEvent.detail;
      
      // Only update if it's for this location
      if (locationId === location?.id && filePath) {
        console.log('Floor plan saved event received:', { locationId, floorNumber, filePath });
        
        // Generate the public URL for the new file
        const newUrl = getStorageUrl('floor-plans', filePath);
        
        // Update the allFloorPlanUrls state with the new URL
        setAllFloorPlanUrls(prev => ({
          ...prev,
          [floorNumber.toString()]: newUrl
        }));
        
        // If parent provided a callback, trigger it to refetch location data
        if (onLocationUpdate) {
          onLocationUpdate();
        }
      }
    };
    
    window.addEventListener('FLOORPLAN_SAVED', handleFloorPlanSavedEvent);
    
    return () => {
      window.removeEventListener('FLOORPLAN_SAVED', handleFloorPlanSavedEvent);
    };
  }, [location?.id, onLocationUpdate]);

  // Handle floor plan saved - refresh location data
  const handleFloorPlanSaved = async () => {
    // Trigger parent to refetch location data if callback is provided
    if (onLocationUpdate) {
      await Promise.resolve(onLocationUpdate());
    }
    
    // Force re-render by updating floor plan URLs from location
    if (location?.floor_plan_files) {
      const urls = await getAllFloorPlanUrls(location.floor_plan_files);
      setAllFloorPlanUrls(urls);
    }
  };

  const hasFloorPlans = location?.floor_plan_files && Object.keys(location.floor_plan_files).length > 0;
  const currentFloorPlanUrl = allFloorPlanUrls[selectedFloorKey];
  
  // Get the numeric floor number for InteractiveFloorPlan (0 for outbuildings)
  const selectedFloorNumber = selectedFloorKey.startsWith('outbuilding_') ? 0 : parseInt(selectedFloorKey) || 1;
  
  // Check if currently viewing an outbuilding
  const isOutbuilding = selectedFloorKey.startsWith('outbuilding_');
  
  // Get outbuildings from floor_plan_files
  const outbuildings: { key: string; name: string }[] = [];
  if (location?.floor_plan_files) {
    Object.entries(location.floor_plan_files).forEach(([key, value]) => {
      if (key.startsWith('outbuilding_')) {
        let name = key.replace('outbuilding_', 'Outbuilding ');
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          const objValue = value as Record<string, unknown>;
          if (typeof objValue.name === 'string' && objValue.name) {
            name = objValue.name;
          }
        }
        outbuildings.push({ key, name });
      }
    });
  }
  
  // Get custom floor names from metadata
  const getFloorDisplayName = (floorNum: number): string => {
    if (!location?.floor_plan_files) return `Floor ${floorNum}`;
    const metadata = getFloorPlanMetadata(location.floor_plan_files, floorNum.toString());
    return metadata?.name || `Floor ${floorNum}`;
  };
  

  const handleAddFloorPlan = () => {
    // Navigate to Floor Plan Editor for this location
    window.open(`/floor-plan-editor?locationId=${location?.id}&mode=floor`, '_blank');
  };

  const handleAddRiser = () => {
    setShowAddRiserModal(true);
  };

  if (!location) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "In Progress":
        return "bg-warning text-warning-foreground";
      case "Completed":
        return "bg-muted text-muted-foreground";
      case "On Hold":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-card border lg:max-w-[95vw] lg:w-[95vw] lg:h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <MapPin className="h-5 w-5 text-primary" />
                  {location.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(location.status)}>
                    {location.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {location.project?.client?.name || 'No Client'} • {location.address}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onEditLocation && (
                  <Button
                    variant="outline"
                    onClick={() => onEditLocation(location)}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Edit Location
                  </Button>
                )}
                <Button className="bg-gradient-primary hover:bg-primary-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Drop Point
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{location.floors}</p>
                      <p className="text-sm text-muted-foreground">Floor{location.floors > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Cable className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{location.drop_points_count || 0}</p>
                      <p className="text-sm text-muted-foreground">Drop Points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {location.total_square_feet ? `${location.total_square_feet.toLocaleString()}` : 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">Sq Ft</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-warning" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{location.completion_percentage}%</p>
                      <p className="text-sm text-muted-foreground">Complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6 bg-muted">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="floor-plans" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Floor Plans
                </TabsTrigger>
                <TabsTrigger value="drops" className="flex items-center gap-2">
                  <Cable className="h-4 w-4" />
                  Drop Points
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team & Notes
                </TabsTrigger>
                <TabsTrigger value="riser-diagrams" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Riser Diagrams
                </TabsTrigger>
                <TabsTrigger value="topology" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Topology
                </TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Location Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">Address</p>
                        <p className="text-foreground">{location.address}</p>
                      </div>
                      
                      {location.building_type && (
                        <div>
                          <p className="font-medium text-sm text-muted-foreground mb-1">Building Type</p>
                          <p className="text-foreground">{location.building_type}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-sm text-muted-foreground mb-1">Floors</p>
                          <p className="text-foreground">{location.floors}</p>
                        </div>
                        
                        {location.total_square_feet && (
                          <div>
                            <p className="font-medium text-sm text-muted-foreground mb-1">Square Feet</p>
                            <p className="text-foreground">{location.total_square_feet.toLocaleString()}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">Status</p>
                        <Badge className={getStatusColor(location.status)}>
                          {location.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {location.contact_onsite && (
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium text-sm text-muted-foreground">On-site Contact</p>
                            <p className="text-foreground">{location.contact_onsite}</p>
                          </div>
                        </div>
                      )}

                      {location.contact_phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium text-sm text-muted-foreground">Phone</p>
                            <p className="text-foreground">{location.contact_phone}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Created</p>
                          <p className="text-foreground">
                            {new Date(location.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {location.project?.client?.name && (
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium text-sm text-muted-foreground">Client</p>
                            <p className="text-foreground">{location.project.client.name}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Access Instructions */}
                  {location.access_instructions && (
                    <Card className="shadow-soft lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Access Instructions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-foreground whitespace-pre-wrap">
                            {location.access_instructions}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Floor Plans Tab */}
              <TabsContent value="floor-plans" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="floor-select">Floor / Building:</Label>
                    <Select value={selectedFloorKey} onValueChange={setSelectedFloorKey}>
                      <SelectTrigger className="w-48 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-md z-50">
                        {/* Regular Floors */}
                        {Array.from({ length: location.floors || 1 }, (_, i) => i + 1).map((floor) => (
                          <SelectItem key={floor} value={floor.toString()}>
                            {getFloorDisplayName(floor)}
                          </SelectItem>
                        ))}
                        {/* Outbuildings */}
                        {outbuildings.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                              Outbuildings
                            </div>
                            {outbuildings.map((ob) => (
                              <SelectItem key={ob.key} value={ob.key}>
                                {ob.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFloorManager(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    Manage Floors
                  </Button>
                </div>

                <div className="space-y-4">
                  <InteractiveFloorPlan
                    locationId={location.id}
                    floorNumber={selectedFloorNumber}
                    fileUrl={currentFloorPlanUrl}
                    filePath={getFloorPlanImagePath(location.floor_plan_files, selectedFloorKey) || ''}
                    fileName={getFloorPlanImagePath(location.floor_plan_files, selectedFloorKey)?.split('/').pop() || ''}
                    className="min-h-[500px]"
                    onFloorPlanSaved={handleFloorPlanSaved}
                  />
                </div>
                <Tabs defaultValue="diagnostics" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                    <TabsTrigger value="file-manager">File Manager</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="diagnostics" className="mt-4">
                    <FloorPlanRepairTool 
                      location={location} 
                      onRepairComplete={() => {
                        if (location.floor_plan_files) {
                          setAllFloorPlanUrls(getAllFloorPlanUrls(location.floor_plan_files));
                        }
                      }}
                    />
                  </TabsContent>
                  
                  <TabsContent value="file-manager" className="mt-4">
                    <FloorPlanFileManager
                      locationId={location.id}
                      onFilesChanged={() => {
                        if (location.floor_plan_files) {
                          setAllFloorPlanUrls(getAllFloorPlanUrls(location.floor_plan_files));
                        }
                        window.location.reload();
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Drop Points Tab */}
              <TabsContent value="drops" className="mt-6">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Drop Point Management</CardTitle>
                    <CardDescription>
                      Manage all installation points across {location.floors} floor{location.floors > 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DropPointList locationId={location.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team & Notes Tab */}
              <TabsContent value="team" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Team and Walk-Through Notes */}
                  <div className="space-y-6">
                    {/* Assigned Team */}
                    <Card className="shadow-soft">
                      <CardHeader>
                        <CardTitle>Assigned Team</CardTitle>
                        <CardDescription>Personnel assigned to this location</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {teamLoading ? (
                            <div className="text-sm text-muted-foreground">Loading team members...</div>
                          ) : teamMembers.length > 0 ? (
                            teamMembers.map((member) => (
                              <div key={member.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{member.first_name} {member.last_name}</p>
                                  <p className="text-sm text-muted-foreground">{member.role}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">No team members currently assigned to this location.</div>
                          )}
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setShowScheduleModal(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Assign Team Member
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Walk-Through Notes */}
                    <WalkThroughNotesList 
                      locationId={location.id}
                      totalFloors={location.floors || 1}
                    />
                  </div>

                  {/* Right Column: Project Notes and Customer Notes */}
                  <div className="space-y-6">
                    {/* Project Notes */}
                    <Card className="shadow-soft">
                      <CardHeader>
                        <CardTitle>Project Notes</CardTitle>
                        <CardDescription>Important notes and observations</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          {location.access_instructions && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-foreground">
                                <strong>Access Requirements:</strong> {location.access_instructions}
                              </p>
                            </div>
                          )}
                          
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-foreground">
                              <strong>Building Details:</strong> {location.floors} floor{location.floors > 1 ? 's' : ''}, 
                              {location.building_type && ` ${location.building_type} building,`}
                              {location.total_square_feet && ` ${location.total_square_feet.toLocaleString()} sq ft total`}
                            </p>
                          </div>

                          {/* Display existing notes */}
                          {notesLoading ? (
                            <div className="text-sm text-muted-foreground">Loading notes...</div>
                          ) : notes.length > 0 ? (
                            notes.map((note) => (
                              <div key={note.id} className="p-3 bg-muted rounded-lg">
                                <p className="text-foreground">
                                  <strong>{note.title}:</strong> {note.content}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  By {note.employee_name} • {new Date(note.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">No project notes yet.</div>
                          )}
                          
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setShowAddNoteModal(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Note
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Customer Notes */}
                    <CustomerNotesPanel locationId={location.id} />
                  </div>
                </div>
              </TabsContent>

              {/* Riser Diagrams Tab */}
               <TabsContent value="riser-diagrams" className="mt-6">
                <RiserDiagramLibrary 
                  locationId={location.id}
                  locationName={location.name}
                />
              </TabsContent>

              {/* Topology Tab */}
              <TabsContent value="topology" className="mt-6">
                <InfrastructureTopologyView
                  locationId={location.id}
                  locationName={location.name}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Assignment Modal */}
      <ScheduleAssignmentModal
        open={showScheduleModal}
        onOpenChange={(open) => {
          setShowScheduleModal(open);
          if (!open) {
            refetchTeam(); // Refresh team members when modal closes
          }
        }}
        selectedDate={new Date()}
      />

      {/* Add Note Modal */}
      <AddLocationNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        locationId={location?.id || ''}
        onNoteAdded={() => {
          refetchNotes();
          setShowAddNoteModal(false);
        }}
      />

      {/* Add Floor Plan Modal */}
      <Dialog open={showAddFloorPlanModal} onOpenChange={setShowAddFloorPlanModal}>
        <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Add Floor Plan</DialogTitle>
             <p className="text-sm text-muted-foreground">
              Upload a floor plan for {isOutbuilding ? outbuildings.find(o => o.key === selectedFloorKey)?.name : `Floor ${selectedFloorKey}`}
             </p>
           </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Use the Floor Plan File Manager above to upload and manage floor plans.</p>
              <Button variant="outline" onClick={() => {
                setShowAddFloorPlanModal(false);
                setActiveTab('floor-plans');
              }}>
                Go to File Manager
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Riser Modal */}
      <Dialog open={showAddRiserModal} onOpenChange={setShowAddRiserModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Riser Diagram</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Upload a riser diagram showing the network backbone infrastructure
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Use the Floor Plan File Manager above to upload riser diagrams. Name the file "riser.png".  </p>
               <Button variant="outline" onClick={() => {
                 setShowAddRiserModal(false);
                 setActiveTab('riser-diagrams');
               }}>
                 Go to Riser Diagrams
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Riser Diagram Modal */}
      <CreateRiserDiagramModal
        open={showAddRiserModal}
        onOpenChange={setShowAddRiserModal}
        locationId={location?.id || ''}
        locationName={location?.name || ''}
        onRiserCreated={() => {
          // Refresh riser diagrams when a new one is created
          if (location) {
            // This would trigger a refresh of the riser diagram library
          }
        }}
      />

      {/* Floor & Building Manager */}
      <FloorBuildingManager
        locationId={location?.id || ''}
        locationName={location?.name || ''}
        currentFloors={location?.floors || 1}
        floorPlanFiles={location?.floor_plan_files || null}
        open={showFloorManager}
        onOpenChange={setShowFloorManager}
        onFloorsUpdated={() => {
          if (onLocationUpdate) {
            onLocationUpdate();
          }
        }}
      />
    </>
  );
};