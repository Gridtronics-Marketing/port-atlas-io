import { useState, useEffect } from "react";
import { MapPin, Plus, Search, Building2, CheckCircle, Clock, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationGrid } from "@/components/LocationGrid";
import { AddLocationModal } from "@/components/AddLocationModal";
import { MetricCard } from "@/components/ui/metric-card";
import { useLocations } from "@/hooks/useLocations";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { useNavigate } from "react-router-dom";
import { AddServiceLocationModal } from "@/components/AddServiceLocationModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Locations = () => {
  const { isClientPortalUser } = useOrganization();

  if (isClientPortalUser) {
    return <ClientLocationsView />;
  }

  return <AdminLocationsView />;
};

// ─── Client Portal: Simplified Locations ───
const ClientLocationsView = () => {
  const navigate = useNavigate();
  const { accessibleLocations, loading } = useClientPortalData();
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchClientId = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("client_portal_users")
        .select("client_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setClientId(data.client_id);
    };
    fetchClientId();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">
          Loading locations...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Locations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sites you have access to view
          </p>
        </div>
        <Button onClick={() => setShowAddLocation(true)} disabled={!clientId} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Request New Location
        </Button>
      </div>

      {accessibleLocations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No locations assigned yet</p>
            <p className="text-sm">Contact your service provider to get access to locations.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessibleLocations.map((location) => (
            <Card
              key={location.id}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => navigate(`/client-locations/${location.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={location.status === 'Active' ? 'default' : 'secondary'}>
                    {location.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{location.name}</h3>
                {location.address && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{location.address}</p>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{location.drop_points_count} drop points</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {clientId && (
        <AddServiceLocationModal
          open={showAddLocation}
          onOpenChange={setShowAddLocation}
          clientId={clientId}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

// ─── Admin: Full Locations View ───
const AdminLocationsView = () => {
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { locations } = useLocations();

  const activeCount = locations.filter(l => l.status === 'Active').length;
  const completedCount = locations.filter(l => l.status === 'Completed').length;
  const inProgressCount = locations.filter(l => l.status === 'In Progress').length;

  return (
    <div className="min-h-full bg-background">
      {/* Page Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Locations</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage jobsites, track installations, and monitor progress
              </p>
            </div>
            <Button 
              onClick={() => setShowAddLocation(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-6 py-6 space-y-6">
        
        {/* KPI Metrics Row */}
        <div className="grid-metrics">
          <MetricCard title="Total Sites" value={locations.length} icon={Building2} />
          <MetricCard title="Active" value={activeCount} icon={Activity} variant="primary" />
          <MetricCard title="In Progress" value={inProgressCount} icon={Clock} variant="warning" />
          <MetricCard title="Completed" value={completedCount} icon={CheckCircle} variant="success" />
        </div>

        {/* Search & Filter Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations, clients, or addresses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Locations Grid */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">All Locations</CardTitle>
                  <CardDescription className="text-xs">
                    Manage installation sites and track project progress
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-medium">
                {locations.length} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <LocationGrid searchTerm={searchTerm} statusFilter={statusFilter} />
          </CardContent>
        </Card>
      </div>

      <AddLocationModal 
        open={showAddLocation} 
        onOpenChange={setShowAddLocation} 
      />
    </div>
  );
};

export default Locations;
