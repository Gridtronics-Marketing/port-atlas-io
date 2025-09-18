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
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveMap } from "@/components/InteractiveMap";
import { DropPointList } from "@/components/DropPointList";
import { FloorPlanEditor } from "@/components/FloorPlanEditor";
import { FloorPlanDemo } from "@/components/FloorPlanDemo";
import { FloorPlanViewer } from "@/components/FloorPlanViewer";
import { InteractiveFloorPlan } from "@/components/InteractiveFloorPlan";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { type Location } from "@/hooks/useLocations";

interface LocationDetailsModalProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { FloorPlanDebugger } from "@/components/FloorPlanDebugger";

export const LocationDetailsModal = ({ location, open, onOpenChange }: LocationDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [floorPlanUrls, setFloorPlanUrls] = useState<{ [floorNumber: number]: string }>({});

  // Check if floor plans exist and get their URLs
  useEffect(() => {
    const loadFloorPlans = async () => {
      if (!location?.floor_plan_files) {
        setFloorPlanUrls({});
        return;
      }

      const urls: { [floorNumber: number]: string } = {};
      
      for (const [floorStr, filePath] of Object.entries(location.floor_plan_files)) {
        if (filePath) {
          const { data } = supabase.storage
            .from('floor-plans')
            .getPublicUrl(filePath);
          
          urls[parseInt(floorStr)] = data.publicUrl;
        }
      }
      
      setFloorPlanUrls(urls);
    };

    if (open && location) {
      loadFloorPlans();
    }
  }, [location, open]);

  const hasFloorPlans = location?.floor_plan_files && Object.keys(location.floor_plan_files).length > 0;
  const currentFloorPlanUrl = floorPlanUrls[selectedFloor];

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-card border">
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
            <Button className="bg-gradient-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Add Drop Point
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Debug Info - Remove in production */}
          {location && (
            <FloorPlanDebugger location={location} />
          )}

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
            <TabsList className="grid w-full grid-cols-4 bg-muted">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
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

            <TabsContent value="map" className="mt-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Floor Plans & Layout Maps</CardTitle>
                      <CardDescription>
                        Interactive floor plans for all {location.floors} floor{location.floors > 1 ? 's' : ''}. Click on areas to add drop points or view installations.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {location.floors > 1 && (
                        <Select value={selectedFloor.toString()} onValueChange={(value) => setSelectedFloor(parseInt(value))}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: location.floors }, (_, i) => i + 1).map((floor) => (
                              <SelectItem key={floor} value={floor.toString()}>
                                Floor {floor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button 
                        variant={editMode ? "default" : "outline"} 
                        onClick={() => setEditMode(!editMode)}
                      >
                        {editMode ? "View Mode" : "Edit Mode"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {location.floors > 1 && (
                    <div className="mb-4">
                      <Badge variant="outline" className="mb-2">
                        Floor {selectedFloor} of {location.floors}
                      </Badge>
                    </div>
                  )}
                  
                   {editMode ? (
                     <FloorPlanEditor 
                       floorNumber={selectedFloor}
                       locationName={location.name}
                       backgroundImage={currentFloorPlanUrl || null}
                       onSave={(canvasData) => {
                         console.log(`Saving floor ${selectedFloor} plan:`, canvasData);
                         setEditMode(false);
                       }}
                     />
                   ) : hasFloorPlans ? (
                     <InteractiveFloorPlan
                       locationId={location.id}
                       floorNumber={selectedFloor}
                       fileUrl={currentFloorPlanUrl}
                       fileName={`floor_${selectedFloor}.${location.floor_plan_files?.[selectedFloor]?.split('.').pop() || 'pdf'}`}
                     />
                  ) : (
                    <FloorPlanDemo 
                      floorNumber={selectedFloor}
                      totalFloors={location.floors}
                      onStartEditor={() => setEditMode(true)}
                    />
                  )}
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Quick Tips:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Upload Floor Plans:</strong> Add building layouts when creating locations</li>
                      <li>• <strong>Edit Mode:</strong> Interactive editor for drawing and placing drop points</li>
                      <li>• <strong>View Mode:</strong> {hasFloorPlans ? 'See uploaded floor plans with existing drop points' : 'Demo mode - upload floor plans to see actual layouts'}</li>
                      <li>• {location.floors > 1 ? 'Use the floor selector to switch between floors' : 'Single floor layout'}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

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

            <TabsContent value="team" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Assigned Team</CardTitle>
                    <CardDescription>Personnel assigned to this location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">JD</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">John Doe</p>
                          <p className="text-sm text-muted-foreground">Lead Technician</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                        <div className="h-10 w-10 bg-success/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-success">SW</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Sarah Wilson</p>
                          <p className="text-sm text-muted-foreground">Installation Specialist</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Team Member
                      </Button>
                    </div>
                  </CardContent>
                </Card>

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
                      
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};