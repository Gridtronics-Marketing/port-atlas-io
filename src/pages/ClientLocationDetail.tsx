import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Building2, Network, FileText, Package } from "lucide-react";
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

  useEffect(() => {
    const fetchLocationDetails = async () => {
      if (!locationId || !currentOrganization?.id) return;

      try {
        // Fetch location details
        const { data: locationData, error: locationError } = await supabase
          .from("locations")
          .select("*")
          .eq("id", locationId)
          .single();

        if (locationError) throw locationError;
        setLocation(locationData);

        // Fetch drop point count
        const { count: dpCount } = await supabase
          .from("drop_points")
          .select("*", { count: "exact", head: true })
          .eq("location_id", locationId);

        setDropPointCount(dpCount || 0);

        // Fetch equipment count
        const { count: eqCount } = await supabase
          .from("equipment")
          .select("*", { count: "exact", head: true })
          .eq("location_id", locationId);

        setEquipmentCount(eqCount || 0);
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
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{location.building_type || "N/A"}</p>
                <p className="text-sm text-muted-foreground">Building Type</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="floorplan" className="w-full">
        <TabsList>
          <TabsTrigger value="floorplan">Floor Plan</TabsTrigger>
          <TabsTrigger value="droppoints">Drop Points</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
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

        <TabsContent value="equipment" className="mt-4">
          <ClientEquipmentList locationId={locationId!} />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default ClientLocationDetail;
