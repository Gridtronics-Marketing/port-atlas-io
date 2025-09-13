import { useState } from "react";
import { MoreHorizontal, Eye, Edit, Trash2, Camera, FileText, Zap, Wifi, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DropPoint {
  id: number;
  label: string;
  room: string;
  type: "data" | "fiber" | "security";
  status: "planned" | "installed" | "tested";
  assignedTo: string;
  installDate?: string;
  testResults?: string;
  photos?: number;
  notes?: string;
}

interface DropPointListProps {
  locationId: number;
}

// Mock data
const mockDropPoints: DropPoint[] = [
  {
    id: 1,
    label: "DP-001",
    room: "Reception Area",
    type: "data",
    status: "tested",
    assignedTo: "John Doe",
    installDate: "2024-01-15",
    testResults: "passed",
    photos: 3,
    notes: "Standard CAT6 installation",
  },
  {
    id: 2,
    label: "FP-001",
    room: "Server Room",
    type: "fiber",
    status: "installed",
    assignedTo: "Sarah Wilson",
    installDate: "2024-01-14",
    photos: 2,
    notes: "Single-mode fiber, 12-strand",
  },
  {
    id: 3,
    label: "SP-001",
    room: "Main Entrance",
    type: "security",
    status: "tested",
    assignedTo: "Mike Johnson",
    installDate: "2024-01-16",
    testResults: "passed",
    photos: 4,
  },
  {
    id: 4,
    label: "DP-002",
    room: "Office A",
    type: "data",
    status: "planned",
    assignedTo: "John Doe",
  },
  {
    id: 5,
    label: "DP-003",
    room: "Conference Room",
    type: "data",
    status: "installed",
    assignedTo: "Sarah Wilson",
    installDate: "2024-01-17",
    photos: 1,
  },
];

export const DropPointList = ({ locationId }: DropPointListProps) => {
  const [dropPoints, setDropPoints] = useState<DropPoint[]>(mockDropPoints);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "data":
        return Zap;
      case "fiber":
        return Wifi;
      case "security":
        return Shield;
      default:
        return Zap;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "data":
        return "text-primary bg-primary/10";
      case "fiber":
        return "text-warning bg-warning/10";
      case "security":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "tested":
        return "bg-success text-success-foreground";
      case "installed":
        return "bg-warning text-warning-foreground";
      case "planned":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const filteredDropPoints = dropPoints.filter((point) => {
    const matchesSearch = point.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         point.room.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || point.type === filterType;
    const matchesStatus = filterStatus === "all" || point.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search drop points or rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="fiber">Fiber</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="installed">Installed</SelectItem>
              <SelectItem value="tested">Tested</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drop Points List */}
      <div className="space-y-3">
        {filteredDropPoints.map((point) => {
          const TypeIcon = getTypeIcon(point.type);
          
          return (
            <div
              key={point.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-soft transition-all duration-200 bg-card"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg ${getTypeColor(point.type)}`}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">
                      {point.label}
                    </h3>
                    <Badge className={getStatusColor(point.status)}>
                      {point.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {point.room} • {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Assigned: {point.assignedTo}</span>
                    {point.installDate && (
                      <span>Installed: {point.installDate}</span>
                    )}
                    {point.photos && (
                      <div className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {point.photos} photos
                      </div>
                    )}
                    {point.testResults && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Tests: {point.testResults}
                      </div>
                    )}
                  </div>
                  
                  {point.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{point.notes}"
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {point.photos && (
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
                
                {point.testResults && (
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Drop Point
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Camera className="mr-2 h-4 w-4" />
                      Add Photos
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      Test Results
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDropPoints.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No drop points found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};