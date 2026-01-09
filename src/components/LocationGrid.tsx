import { useState } from "react";
import { MapPin, Cable, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LocationDetailsModal } from "@/components/LocationDetailsModal";
import { AddLocationModal } from "@/components/AddLocationModal";
import { useLocations, type Location } from "@/hooks/useLocations";

export const LocationGrid = () => {
  const { locations, loading, deleteLocation, fetchLocations } = useLocations();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

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

  const getCompletionColor = (completion: number) => {
    if (completion >= 90) return "text-success";
    if (completion >= 70) return "text-warning";
    return "text-destructive";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading locations...</span>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No locations found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {locations.map((location) => (
          <div
            key={location.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-soft transition-all duration-200 bg-card cursor-pointer hover:border-primary/30"
            onClick={() => setSelectedLocation(location)}
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {location.name}
                  </h3>
                  <Badge className={getStatusColor(location.status)}>
                    {location.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {location.client?.name || location.project?.client?.name || (
                    <span className="text-destructive font-medium">⚠ Client not assigned</span>
                  )} • {location.address}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Cable className="h-3 w-3" />
                    {location.drop_points_count || 0} drops
                  </div>
                  <div className={`font-medium ${getCompletionColor(location.completion_percentage)}`}>
                    {location.completion_percentage}% complete
                  </div>
                  <span>Updated {new Date(location.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <LocationDetailsModal
        location={selectedLocation}
        open={!!selectedLocation}
        onOpenChange={(open) => !open && setSelectedLocation(null)}
        onEditLocation={setEditingLocation}
        onDeleteLocation={deleteLocation}
        onLocationUpdate={fetchLocations}
      />
      
      <AddLocationModal
        location={editingLocation}
        open={!!editingLocation}
        onOpenChange={(open) => !open && setEditingLocation(null)}
        onLocationUpdated={fetchLocations}
      />
    </>
  );
};