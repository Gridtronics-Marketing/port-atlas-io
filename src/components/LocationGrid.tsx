import { useState } from "react";
import { MapPin, MoreHorizontal, Eye, Edit, Trash2, Cable } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocationDetailsModal } from "@/components/LocationDetailsModal";

const mockLocations = [
  {
    id: 1,
    name: "Downtown Office Complex",
    client: "TechCorp Inc.",
    address: "123 Business Ave, Suite 100",
    status: "Active",
    dropPoints: 24,
    completion: 85,
    lastUpdate: "2 hours ago",
  },
  {
    id: 2,
    name: "Manufacturing Facility A",
    client: "Industrial Solutions",
    address: "456 Factory Road",
    status: "In Progress",
    dropPoints: 18,
    completion: 60,
    lastUpdate: "1 day ago",
  },
  {
    id: 3,
    name: "Retail Store Network",
    client: "ShopMart",
    address: "789 Commerce Street",
    status: "Completed",
    dropPoints: 32,
    completion: 100,
    lastUpdate: "3 days ago",
  },
];

export const LocationGrid = () => {
  const [selectedLocation, setSelectedLocation] = useState<typeof mockLocations[0] | null>(null);

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

  return (
    <>
      <div className="space-y-3">
        {mockLocations.map((location) => (
          <div
            key={location.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-soft transition-all duration-200 bg-card"
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
                  {location.client} • {location.address}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Cable className="h-3 w-3" />
                    {location.dropPoints} drops
                  </div>
                  <div className={`font-medium ${getCompletionColor(location.completion)}`}>
                    {location.completion}% complete
                  </div>
                  <span>Updated {location.lastUpdate}</span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border">
                <DropdownMenuItem onClick={() => setSelectedLocation(location)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Location
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Location
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <LocationDetailsModal
        location={selectedLocation}
        open={!!selectedLocation}
        onOpenChange={(open) => !open && setSelectedLocation(null)}
      />
    </>
  );
};