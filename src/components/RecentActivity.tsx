import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Cable, MapPin, Users, Building2 } from "lucide-react";
import { useLocations } from "@/hooks/useLocations";
import { useClients } from "@/hooks/useClients";
import { useDropPoints } from "@/hooks/useDropPoints";
import { useEmployees } from "@/hooks/useEmployees";
import { useMemo } from "react";

export const RecentActivity = () => {
  const { locations } = useLocations();
  const { clients } = useClients();
  const { dropPoints } = useDropPoints();
  const { employees } = useEmployees();

  const recentActivities = useMemo(() => {
    const activities: any[] = [];

    // Add recent locations
    locations.slice(0, 2).forEach((location) => {
      activities.push({
        id: `location-${location.id}`,
        type: "location_created",
        user: "System",
        userInitials: "SY",
        action: `Created location`,
        location: location.name,
        time: new Date(location.created_at).toLocaleDateString(),
        icon: MapPin,
        color: "text-primary",
      });
    });

    // Add recent clients
    clients.slice(0, 1).forEach((client) => {
      activities.push({
        id: `client-${client.id}`,
        type: "client_added",
        user: "Admin",
        userInitials: "AD",
        action: `Added client`,
        location: client.name,
        time: new Date(client.created_at).toLocaleDateString(),
        icon: Users,
        color: "text-success",
      });
    });

    // Add recent drop points
    dropPoints.slice(0, 2).forEach((dropPoint) => {
      activities.push({
        id: `drop-${dropPoint.id}`,
        type: "drop_added",
        user: "Technician",
        userInitials: "TC",
        action: `Added drop point`,
        location: dropPoint.label,
        time: new Date(dropPoint.created_at).toLocaleDateString(),
        icon: Cable,
        color: "text-warning",
      });
    });

    return activities.slice(0, 4);
  }, [locations, clients, dropPoints]);

  if (recentActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
        <p className="text-xs text-muted-foreground mt-1">Add some data to see activity here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentActivities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {activity.userInitials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <activity.icon className={`h-4 w-4 ${activity.color}`} />
              <span className="text-sm font-medium text-foreground">
                {activity.user}
              </span>
              <span className="text-sm text-muted-foreground">
                {activity.action}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {activity.location}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {activity.time}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};