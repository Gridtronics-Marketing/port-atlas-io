import { useState } from "react";
import { MapPin, Plus, Search, Building2, CheckCircle, Clock, Activity } from "lucide-react";
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

const Locations = () => {
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
          <MetricCard
            title="Total Sites"
            value={locations.length}
            icon={Building2}
          />
          <MetricCard
            title="Active"
            value={activeCount}
            icon={Activity}
            variant="primary"
          />
          <MetricCard
            title="In Progress"
            value={inProgressCount}
            icon={Clock}
            variant="warning"
          />
          <MetricCard
            title="Completed"
            value={completedCount}
            icon={CheckCircle}
            variant="success"
          />
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