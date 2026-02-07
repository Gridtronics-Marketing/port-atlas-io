import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Building2, Network, FileText, Package, Camera, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { ClientFloorPlanViewer } from "@/components/ClientFloorPlanViewer";
import { ClientDropPointList } from "@/components/ClientDropPointList";
import { ClientEquipmentList } from "@/components/ClientEquipmentList";
import { ClientRoomViewList } from "@/components/ClientRoomViewList";
import { ClientLocationNotesTab } from "@/components/ClientLocationNotesTab";

interface LocationDetails {
  id: string;
  name: string;
  address: string | null;
  status: string | null;
  floors: number | null;
  building_type: string | null;
  contact_onsite: string | null;
  contact_phone: string | null;
}

const ClientLocationDetail = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const { currentOrganization, isClientPortalUser } = useOrganization();
  const [location, setLocation] = useState<LocationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropPointCount, setDropPointCount] = useState(0);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [roomViewCount, setRoomViewCount] = useState(0);

  useEffect(() => {
    const fetchLocationDetails = async () => {
      if (!locationId || !currentOrganization?.id) return;

      try {
        const { data: locationData, error: locationError } = await supabase
          .from("locations")
          .select("*")
          .eq("id", locationId)
          .single();

        if (locationError) throw locationError;
        setLocation(locationData);

        const [dpRes, eqRes, rvRes] = await Promise.all([
          supabase.from("drop_points").select("*", { count: "exact", head: true }).eq("location_id", locationId),
          supabase.from("equipment").select("*", { count: "exact", head: true }).eq("location_id", locationId),
          supabase.from("room_views").select("*", { count: "exact", head: true }).eq("location_id", locationId),
        ]);

        setDropPointCount(dpRes.count || 0);
        setEquipmentCount(eqRes.count || 0);
        setRoomViewCount(rvRes.count || 0);
      } catch (error) {
        console.error("Error fetching location details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationDetails();
  }, [locationId, currentOrganization?.id]);

  if (!isClientPortalUser) {
    navigate("/");
    return null;
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!location) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Location not found</p>
          <Button variant="link" onClick={() => navigate("/")}>
            Return to Dashboard
          </Button>
        </div>
      </main>
    );
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500/10 text-green-600">Active</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-500/10 text-blue-600">In Progress</Badge>;
      case "Completed":
        return <Badge className="bg-purple-500/10 text-purple-600">Completed</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/locations")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{location.name}</h1>
            {getStatusBadge(location.status)}
          </div>
          {location.address && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {location.address}
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dropPointCount}</p>
                <p className="text-sm text-muted-foreground">Drop Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Camera className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roomViewCount}</p>
                <p className="text-sm text-muted-foreground">Room Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{equipmentCount}</p>
                <p className="text-sm text-muted-foreground">Equipment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Building2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{location.floors || 1}</p>
                <p className="text-sm text-muted-foreground">Floors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="floorplan" className="w-full">
        <TabsList>
          <TabsTrigger value="floorplan">Floor Plan</TabsTrigger>
          <TabsTrigger value="droppoints">Drop Points</TabsTrigger>
          <TabsTrigger value="roomviews">Room Views</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="notes">Notes & Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="floorplan" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Floor Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientFloorPlanViewer locationId={locationId!} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="droppoints" className="mt-4">
          <ClientDropPointList locationId={locationId!} />
        </TabsContent>

        <TabsContent value="roomviews" className="mt-4">
          <ClientRoomViewList locationId={locationId!} />
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <ClientEquipmentList locationId={locationId!} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <ClientLocationNotesTab locationId={locationId!} totalFloors={location.floors || 1} />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default ClientLocationDetail;
