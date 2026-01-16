import { useState } from "react";
import { MapPin, Plus, Filter, Search } from "lucide-react";
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
import { useLocations } from "@/hooks/useLocations";

const Locations = () => {
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { locations } = useLocations();

  const stats = [
    { label: "Total Locations", value: locations.length.toString(), color: "text-primary" },
    { label: "Active Projects", value: locations.filter(l => l.status === 'Active').length.toString(), color: "text-success" },
    { label: "Completed", value: locations.filter(l => l.status === 'Completed').length.toString(), color: "text-muted-foreground" },
    { label: "In Progress", value: locations.filter(l => l.status === 'In Progress').length.toString(), color: "text-warning" },
  ];

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Location Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all jobsites, track installations, and monitor progress
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAddLocation(true)}
            className="bg-gradient-primary hover:bg-primary-hover shadow-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Location
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations, clients, or addresses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border">
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
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                All Locations
              </span>
              <Badge variant="secondary">{locations.length} Total</Badge>
            </CardTitle>
            <CardDescription>
              Manage installation sites and track project progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocationGrid searchTerm={searchTerm} statusFilter={statusFilter} />
          </CardContent>
        </Card>

        <AddLocationModal 
          open={showAddLocation} 
          onOpenChange={setShowAddLocation} 
        />
      </main>
  );
};

export default Locations;