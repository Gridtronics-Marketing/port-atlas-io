import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Cable, Upload, UserPlus, MapPin } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "drop_added",
    user: "John Doe",
    userInitials: "JD",
    action: "Added fiber drop",
    location: "Downtown Office",
    time: "2 minutes ago",
    icon: Cable,
    color: "text-success",
  },
  {
    id: 2,
    type: "photo_uploaded",
    user: "Sarah Wilson",
    userInitials: "SW", 
    action: "Uploaded test results",
    location: "Manufacturing A",
    time: "15 minutes ago",
    icon: Upload,
    color: "text-primary",
  },
  {
    id: 3,
    type: "client_added",
    user: "Admin",
    userInitials: "AD",
    action: "Added new client",
    location: "System",
    time: "1 hour ago",
    icon: UserPlus,
    color: "text-warning",
  },
  {
    id: 4,
    type: "location_created",
    user: "Mike Johnson",
    userInitials: "MJ",
    action: "Created new location",
    location: "Retail Store",
    time: "3 hours ago",
    icon: MapPin,
    color: "text-primary",
  },
];

export const RecentActivity = () => {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`/avatars/${activity.user.toLowerCase().replace(' ', '')}.jpg`} />
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