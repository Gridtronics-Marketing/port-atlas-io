import { useState } from "react";
import { MapPin, Cable, Plus, Camera, FileText, Users } from "lucide-react";
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

import { type Location } from "@/hooks/useLocations";

interface LocationDetailsModalProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LocationDetailsModal = ({ location, open, onOpenChange }: LocationDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("map");

  if (!location) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "In Progress":
        return "bg-warning text-warning-foreground";
      case "Completed":
        return "bg-muted text-muted-foreground";
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
                  {location.client} • {location.address}
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
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Cable className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{location.dropPoints}</p>
                    <p className="text-sm text-muted-foreground">Drop Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">18</p>
                    <p className="text-sm text-muted-foreground">Photos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{location.completion}%</p>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Interactive Map
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

            <TabsContent value="map" className="mt-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Layout Map</CardTitle>
                  <CardDescription>
                    Click on areas to add drop points or view existing installations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InteractiveMap locationId={location.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drops" className="mt-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Drop Point Management</CardTitle>
                  <CardDescription>
                    Manage all installation points and their details
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
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Location Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-foreground">
                          <strong>Access Requirements:</strong> Security badge required for floors 3-5. 
                          Contact security desk for escort.
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-foreground">
                          <strong>Special Equipment:</strong> High-ceiling areas require extended ladder. 
                          Cable runs through existing conduit system.
                        </p>
                      </div>
                      <Button variant="outline" className="w-full">
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